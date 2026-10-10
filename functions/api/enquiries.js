/**
 * Digital Seva — Customer Enquiry & Document Upload Endpoint
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

import { validateMagicBytes, validateIndianMobile, verifyTurnstileToken } from '../utils/validation.js';
import {
    insertEnquiry,
    insertEnquiryDocuments,
    uploadStorageDocument,
    rollbackStorageUploads,
    getSupabaseConfig
} from '../utils/supabase.js';
import { sendEnquiryEmailNotification } from '../utils/email.js';

const VALID_SERVICES = ['pan', 'voter', 'aadhaar', 'passport', 'income', 'caste', 'scholarship', 'more', 'general'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB total request payload

// Sliding window submission rate limiter
const submissionRateMap = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 8;

function isSubmissionRateLimited(ip) {
    const now = Date.now();
    const timestamps = (submissionRateMap.get(ip) || []).filter(ts => now - ts < RATE_WINDOW_MS);
    if (timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
        return true;
    }
    timestamps.push(now);
    submissionRateMap.set(ip, timestamps);
    return false;
}

/**
 * Generates an unguessable unique enquiry reference ID (e.g. DS-4A8F2B-91C0).
 */
function generateEnquiryRef() {
    const randA = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randB = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DS-${randA}-${randB}`;
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // 1. Client IP & Rate Limiting
    const clientIp = request.headers.get('cf-connecting-ip')
        || request.headers.get('x-forwarded-for')
        || 'unknown';

    if (isSubmissionRateLimited(clientIp)) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Too many submissions. Please wait a few minutes before submitting again.'
        }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Parse Multipart Form Data
    let formData;
    try {
        formData = await request.formData();
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid form data or request payload too large.'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 3. Extract & Validate Text Fields
    const name = (formData.get('name') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const service = (formData.get('service') || 'general').toString().trim().toLowerCase();
    const variant = (formData.get('variant') || 'standard').toString().trim();
    const notes = (formData.get('notes') || '').toString().trim();
    const turnstileToken = (formData.get('cf-turnstile-response') || '').toString().trim();

    if (!name || name.length < 2 || name.length > 100) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Please enter a valid full name (2–100 characters).'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!validateIndianMobile(phone)) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Please enter a valid 10-digit Indian mobile number.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!VALID_SERVICES.includes(service)) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Please select a valid service category.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (notes.length > 1000) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Notes cannot exceed 1000 characters.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Verify Turnstile CAPTCHA (Production fail-safe & token validation)
    const isProd = (env.NODE_ENV || '').toLowerCase() === 'production';
    const turnstileSecret = (env.TURNSTILE_SECRET_KEY || '').trim();

    if (isProd && !turnstileSecret) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Security verification is temporarily unavailable. Please contact us directly on WhatsApp for immediate assistance.',
            whatsappFallback: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (turnstileSecret) {
        if (!turnstileToken) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Please complete the security verification before submitting.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const turnstileCheck = await verifyTurnstileToken(turnstileToken, turnstileSecret, clientIp, isProd);
        if (!turnstileCheck.success) {
            return new Response(JSON.stringify({
                success: false,
                error: turnstileCheck.error || 'Bot verification failed. Please refresh and try again.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
    }

    // 5. Extract & Validate Uploaded Files
    const fileEntries = [];
    let totalBytes = 0;

    for (const [key, value] of formData.entries()) {
        // Skip standard text fields
        if (['name', 'phone', 'service', 'variant', 'notes', 'cf-turnstile-response'].includes(key)) {
            continue;
        }

        // Check if value is a File/Blob with content
        if (value && typeof value === 'object' && typeof value.size === 'number' && value.size > 0) {
            const file = value;

            if (file.size > MAX_FILE_SIZE) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `File '${file.name || key}' exceeds maximum limit of 5 MB.`
                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            totalBytes += file.size;
            if (totalBytes > MAX_TOTAL_SIZE) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Total file upload size exceeds the 25 MB limit.'
                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            // Read bytes and validate magic bytes signature
            const arrayBuf = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuf);
            const verifiedSig = validateMagicBytes(bytes);

            if (!verifiedSig) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `File '${file.name || key}' is not a valid PDF, JPEG, or PNG document. Spoofed or unsupported file types are rejected.`
                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            fileEntries.push({
                slotId: key,
                originalName: (file.name || `${key}.${verifiedSig.ext}`).replace(/[^\w.-]/g, '_'),
                mimeType: verifiedSig.mime,
                ext: verifiedSig.ext,
                bytes: bytes,
                sizeBytes: file.size
            });
        }
    }

    // 6. Generate Enquiry Reference & Storage Paths
    const enquiryRef = generateEnquiryRef();
    const uploadedStoragePaths = [];

    // Check Supabase configuration
    const { isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Backend database is currently being configured. Please contact assistance on WhatsApp.'
        }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        // 7. Upload files to private Supabase Storage
        const preparedDocuments = [];
        for (const fileItem of fileEntries) {
            const randomId = crypto.randomUUID();
            const storagePath = `${enquiryRef}/${randomId}.${fileItem.ext}`;

            await uploadStorageDocument(env, storagePath, fileItem.bytes, fileItem.mimeType);
            uploadedStoragePaths.push(storagePath);

            preparedDocuments.push({
                storage_path: storagePath,
                original_name: fileItem.originalName,
                mime_type: fileItem.mimeType,
                size_bytes: fileItem.sizeBytes,
                slot_id: fileItem.slotId
            });
        }

        // 8. Insert Enquiry Record into Supabase Postgres
        const insertedEnquiry = await insertEnquiry(env, {
            enquiry_ref: enquiryRef,
            name: name,
            phone: phone,
            service: service,
            variant: variant,
            notes: notes,
            retention_status: 'active'
        });

        // 9. Insert Document Metadata into Supabase Postgres
        if (preparedDocuments.length > 0) {
            const docsWithEnquiryId = preparedDocuments.map(d => ({
                ...d,
                enquiry_id: insertedEnquiry.id
            }));
            await insertEnquiryDocuments(env, docsWithEnquiryId);
        }

        // 10. Optional HTTP Email Notification (Non-blocking)
        sendEnquiryEmailNotification(env, {
            enquiryRef,
            name,
            phone,
            service,
            variant,
            createdAt: insertedEnquiry.created_at || new Date().toISOString()
        }).catch(err => {
            console.error('[EMAIL NOTIFICATION DISPATCH ERROR]', err);
        });

        // 11. Return Success Response
        return new Response(JSON.stringify({
            success: true,
            enquiryId: enquiryRef,
            message: 'Your enquiry and documents were submitted securely.',
            filesUploadedCount: fileEntries.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (saveError) {
        console.error('🚨 [ENQUIRY PERSISTENCE ERROR]', saveError.message);

        // Rollback uploaded files to prevent orphan storage leaks
        if (uploadedStoragePaths.length > 0) {
            console.log(`[ROLLBACK TRIGGERED] Cleaning up ${uploadedStoragePaths.length} storage files...`);
            await rollbackStorageUploads(env, uploadedStoragePaths);
        }

        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to save enquiry to database. Upload has been safely rolled back. Please try again.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
