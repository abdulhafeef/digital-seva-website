/**
 * Digital Seva — Supabase REST & Storage Client for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Implements pure Web Fetch interaction with Supabase PostgREST & Storage REST APIs.
 * Never exposes service-role keys to clients or browser code.
 */

const STORAGE_BUCKET = 'customer-documents';

/**
 * Returns trimmed Supabase configuration from environment.
 */
export function getSupabaseConfig(env = {}) {
    const url = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const anonKey = (env.SUPABASE_ANON_KEY || '').trim();

    return {
        url,
        serviceRoleKey,
        anonKey,
        isConfigured: Boolean(url && serviceRoleKey)
    };
}

/**
 * Default headers for Supabase Service Role PostgREST calls.
 */
function getPostgrestHeaders(serviceRoleKey, extra = {}) {
    return {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...extra
    };
}

/**
 * Inserts a customer enquiry into Supabase Postgres.
 *
 * @param {object} env
 * @param {object} enquiryData
 * @returns {Promise<{ id: string, enquiry_ref: string }>}
 */
export async function insertEnquiry(env, enquiryData) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        throw new Error('Supabase URL or Service Role Key is not configured in environment.');
    }

    const endpoint = `${url}/rest/v1/enquiries`;
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: getPostgrestHeaders(serviceRoleKey),
        body: JSON.stringify(enquiryData)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Database error saving enquiry (${res.status}): ${errText}`);
    }

    const inserted = await res.json();
    return inserted[0];
}

/**
 * Inserts document metadata records into Supabase Postgres.
 *
 * @param {object} env
 * @param {Array<object>} documents
 * @returns {Promise<Array<object>>}
 */
export async function insertEnquiryDocuments(env, documents) {
    if (!documents || documents.length === 0) return [];
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        throw new Error('Supabase is not configured.');
    }

    const endpoint = `${url}/rest/v1/enquiry_documents`;
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: getPostgrestHeaders(serviceRoleKey),
        body: JSON.stringify(documents)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Database error saving document metadata (${res.status}): ${errText}`);
    }

    return await res.json();
}

/**
 * Formats a clean object path for Supabase Storage REST API,
 * encoding individual path segments while preserving '/' delimiters.
 */
function formatStorageEndpoint(url, bucket, storagePath) {
    const cleanPath = String(storagePath)
        .replace(/%2F/gi, '/')
        .split('/')
        .filter(Boolean)
        .map(encodeURIComponent)
        .join('/');
    return `${url}/storage/v1/object/${bucket}/${cleanPath}`;
}

/**
 * Uploads a private file buffer into the private Supabase Storage bucket.
 *
 * @param {object} env
 * @param {string} storagePath - E.g. "DS-123456/uuid.pdf"
 * @param {Uint8Array|ArrayBuffer} fileBytes
 * @param {string} mimeType
 * @returns {Promise<{ path: string }>}
 */
export async function uploadStorageDocument(env, storagePath, fileBytes, mimeType) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        throw new Error('Supabase Storage is not configured.');
    }

    const endpoint = formatStorageEndpoint(url, STORAGE_BUCKET, storagePath);
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'false'
        },
        body: fileBytes
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Storage upload error (${res.status}): ${errText}`);
    }

    return { path: storagePath };
}

/**
 * Downloads a private document from the Supabase Storage bucket.
 *
 * @param {object} env
 * @param {string} storagePath
 * @returns {Promise<Response>}
 */
export async function downloadStorageDocument(env, storagePath) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        throw new Error('Supabase Storage is not configured.');
    }

    const endpoint = formatStorageEndpoint(url, STORAGE_BUCKET, storagePath);
    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    return res;
}

/**
 * Deletes a document from the private Supabase Storage bucket.
 *
 * @param {object} env
 * @param {string} storagePath
 * @returns {Promise<boolean>}
 */
export async function deleteStorageDocument(env, storagePath) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) return false;

    const endpoint = formatStorageEndpoint(url, STORAGE_BUCKET, storagePath);
    const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    return res.ok;
}

/**
 * Cleans up partially uploaded storage objects (called when database transaction fails).
 *
 * @param {object} env
 * @param {Array<string>} storagePaths
 */
export async function rollbackStorageUploads(env, storagePaths) {
    if (!Array.isArray(storagePaths) || storagePaths.length === 0) return;
    for (const path of storagePaths) {
        try {
            await deleteStorageDocument(env, path);
        } catch (err) {
            console.error(`[STORAGE ROLLBACK WARNING] Failed to delete orphan object ${path}:`, err);
        }
    }
}

/**
 * Lists all customer enquiries with attached document metadata (ordered by latest first).
 *
 * @param {object} env
 * @returns {Promise<Array<object>>}
 */
export async function listEnquiries(env) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        throw new Error('Supabase is not configured.');
    }

    const endpoint = `${url}/rest/v1/enquiries?select=id,enquiry_ref,name,phone,service,variant,notes,created_at,enquiry_documents(id,storage_path,original_name,mime_type,size_bytes,slot_id)&order=created_at.desc`;
    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to list enquiries (${res.status}): ${errText}`);
    }

    const rows = await res.json();

    // Map to frontend-compatible format
    return rows.map(r => ({
        id: r.id,
        enquiryId: r.enquiry_ref,
        name: r.name,
        phone: r.phone,
        service: r.service,
        variant: r.variant,
        notes: r.notes,
        createdAt: r.created_at,
        files: (r.enquiry_documents || []).map(d => ({
            id: d.id,
            slotId: d.slot_id,
            originalName: d.original_name,
            storedFilename: d.storage_path,
            mimeType: d.mime_type,
            sizeBytes: d.size_bytes
        }))
    }));
}

/**
 * Finds an enquiry by either UUID id or enquiry_ref.
 *
 * @param {object} env
 * @param {string} idOrRef
 * @returns {Promise<object|null>}
 */
export async function getEnquiry(env, idOrRef) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef);
    const filter = isUuid ? `id=eq.${encodeURIComponent(idOrRef)}` : `enquiry_ref=eq.${encodeURIComponent(idOrRef)}`;

    const endpoint = `${url}/rest/v1/enquiries?${filter}&select=id,enquiry_ref,name,phone,service,variant,notes,created_at,enquiry_documents(id,storage_path,original_name,mime_type,size_bytes,slot_id)`;
    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Finds document metadata by either document UUID id or storage_path.
 *
 * @param {object} env
 * @param {string} docIdentifier
 * @returns {Promise<object|null>}
 */
export async function getDocumentMetadata(env, docIdentifier) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) return null;

    const cleanIdentifier = decodeURIComponent(String(docIdentifier)).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanIdentifier);
    const filter = isUuid
        ? `id=eq.${encodeURIComponent(cleanIdentifier)}`
        : `storage_path=eq.${encodeURIComponent(cleanIdentifier)}`;

    const endpoint = `${url}/rest/v1/enquiry_documents?${filter}&select=id,enquiry_id,storage_path,original_name,mime_type,size_bytes,slot_id`;
    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Permanently deletes an enquiry and all its associated documents from storage and Postgres.
 *
 * @param {object} env
 * @param {string} enquiryIdOrRef
 * @returns {Promise<{ success: boolean, deletedFilesCount: number }>}
 */
export async function deleteEnquiryWithDocuments(env, enquiryIdOrRef) {
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        throw new Error('Supabase is not configured.');
    }

    const enquiry = await getEnquiry(env, enquiryIdOrRef);
    if (!enquiry) {
        throw new Error(`Enquiry ${enquiryIdOrRef} not found.`);
    }

    // 1. Delete associated storage objects
    const docs = enquiry.enquiry_documents || [];
    let deletedFilesCount = 0;
    for (const doc of docs) {
        try {
            await deleteStorageDocument(env, doc.storage_path);
            deletedFilesCount++;
        } catch (err) {
            console.error(`[STORAGE DELETION WARNING] Error unlinking object ${doc.storage_path}:`, err);
        }
    }

    // 2. Delete database record (foreign key ON DELETE CASCADE removes enquiry_documents metadata)
    const endpoint = `${url}/rest/v1/enquiries?id=eq.${enquiry.id}`;
    const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Database error deleting enquiry (${res.status}): ${errText}`);
    }

    return { success: true, deletedFilesCount };
}

/**
 * Queries enquiries that have exceeded the retention threshold.
 *
 * @param {object} env
 * @param {number} retentionDays
 * @returns {Promise<Array<object>>}
 */
export async function findExpiredEnquiries(env, retentionDays) {
    if (!retentionDays || retentionDays <= 0) return [];
    const { url, serviceRoleKey, isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) return [];

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const endpoint = `${url}/rest/v1/enquiries?created_at=lt.${cutoffDate}&select=id,enquiry_ref,created_at,enquiry_documents(storage_path)`;
    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    if (!res.ok) return [];
    return await res.json();
}
