/**
 * Digital Seva — Secure Application Server & Private Upload Backend
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Features:
 * - Pure Node.js core with optional Nodemailer integration
 * - Production-hardened administrator authentication (min 32-char secret in production)
 * - Timing-safe constant-time secret comparison via crypto.timingSafeEqual
 * - Brute-force rate limiting for admin login & sliding-window submission protection
 * - Configurable persistent storage supporting absolute paths (e.g. Render /var/data)
 * - Atomic enquiries database writes with corrupted-record backup & write locks
 * - Configurable automated retention policy with safe file purging
 * - Optional automated email notifications to business owner via SMTP
 * - Secure static file delivery with security headers & strict access protection
 * - Binary magic-byte signature validation (PDF, JPEG, PNG)
 * - Safe randomized UUID storage in private directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// -------------------------------------------------------------
// 1. Environment & Server Configuration
// -------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// Development fallback token (STRICTLY PROHIBITED in production)
const DEV_FALLBACK_TOKEN = 'ds_local_dev_only_key';
const KNOWN_PLACEHOLDER_TOKENS = [
    'ds_local_dev_only_key',
    'your_secure_admin_password_or_token_here',
    'your_secure_random_admin_token_minimum_32_characters_here',
    'admin',
    'password',
    'changeme',
    '12345678',
    'test_admin_secret_key_123'
];

let ADMIN_TOKEN = (process.env.ADMIN_TOKEN || process.env.ADMIN_SECRET_KEY || '').trim();

if (isProduction) {
    if (!ADMIN_TOKEN) {
        console.error('🚨 [FATAL CONFIG ERROR] Production mode: ADMIN_TOKEN environment variable is not configured!');
        process.exit(1);
    }
    if (ADMIN_TOKEN.length < 32) {
        console.error('🚨 [FATAL CONFIG ERROR] Production mode: ADMIN_TOKEN must be at least 32 characters long!');
        process.exit(1);
    }
    if (KNOWN_PLACEHOLDER_TOKENS.includes(ADMIN_TOKEN)) {
        console.error('🚨 [FATAL CONFIG ERROR] Production mode: Refusing to start with known development or placeholder ADMIN_TOKEN!');
        process.exit(1);
    }
} else {
    if (!ADMIN_TOKEN) {
        ADMIN_TOKEN = DEV_FALLBACK_TOKEN;
        console.warn('⚠️ [SECURITY NOTICE] Running in development mode with fallback key. Configure ADMIN_TOKEN in .env for production use.');
    }
}

// -------------------------------------------------------------
// 2. Configurable Persistent Storage Architecture
// -------------------------------------------------------------
const rawStorageDir = process.env.STORAGE_DIR || 'uploads';
const UPLOADS_DIR = path.isAbsolute(rawStorageDir)
    ? path.normalize(rawStorageDir)
    : path.resolve(__dirname, rawStorageDir);
const ENQUIRIES_FILE = path.join(UPLOADS_DIR, 'enquiries.json');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_REQUEST_SIZE = 25 * 1024 * 1024; // 25 MB max total request payload

let isStorageCorrupted = false;
let corruptionError = null;

// Ensure private uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    try {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (err) {
        console.error(`🚨 [FATAL] Failed to create storage directory ${UPLOADS_DIR}:`, err.message);
        if (isProduction) process.exit(1);
    }
}

function initStorage() {
    isStorageCorrupted = false;
    corruptionError = null;

    if (!fs.existsSync(ENQUIRIES_FILE)) {
        try {
            fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify([], null, 2), 'utf8');
        } catch (err) {
            console.error('🚨 [STORAGE INIT ERROR] Failed to initialize enquiries file:', err.message);
        }
    } else {
        try {
            const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                throw new Error('enquiries.json does not contain a JSON array');
            }
        } catch (err) {
            isStorageCorrupted = true;
            corruptionError = err.message;
            const backupPath = path.join(UPLOADS_DIR, `enquiries.corrupt.${Date.now()}.json`);
            try {
                fs.copyFileSync(ENQUIRIES_FILE, backupPath);
                console.error(`🚨 [DATABASE CORRUPTION DETECTED] ${ENQUIRIES_FILE} failed JSON parsing (${err.message}). Safe backup created at ${backupPath}. Writes suspended to prevent data loss.`);
            } catch (copyErr) {
                console.error(`🚨 [BACKUP FAILED] Could not create backup of corrupt database: ${copyErr.message}`);
            }
        }
    }
}

initStorage();

// Serialized concurrency queue for safe file writes
let writeQueue = Promise.resolve();

function getEnquiries() {
    if (isStorageCorrupted) {
        throw new Error(`Customer records database is in corrupted state (${corruptionError}). Writes suspended.`);
    }
    if (!fs.existsSync(ENQUIRIES_FILE)) {
        return [];
    }
    try {
        const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error('enquiries.json is not an array');
        }
        return parsed;
    } catch (err) {
        isStorageCorrupted = true;
        corruptionError = err.message;
        const backupPath = path.join(UPLOADS_DIR, `enquiries.corrupt.${Date.now()}.json`);
        try { fs.copyFileSync(ENQUIRIES_FILE, backupPath); } catch {}
        console.error(`🚨 [DATABASE PARSE ERROR] ${err.message}. Safe backup created at ${backupPath}.`);
        throw new Error('Storage parse failure');
    }
}

function saveEnquiries(list) {
    if (isStorageCorrupted) {
        throw new Error(`Database corrupted. Unsafe write blocked.`);
    }
    if (!Array.isArray(list)) {
        throw new Error('saveEnquiries requires an array');
    }
    // Atomic Write Pattern: write to temp file on same filesystem, then atomic rename
    const tempFile = path.join(UPLOADS_DIR, `enquiries.json.tmp.${crypto.randomUUID()}`);
    fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf8');
    fs.renameSync(tempFile, ENQUIRIES_FILE);
}

function safeSaveEnquiries(list) {
    return new Promise((resolve, reject) => {
        writeQueue = writeQueue.then(() => {
            try {
                saveEnquiries(list);
                resolve();
            } catch (err) {
                reject(err);
            }
        }).catch(reject);
    });
}

// -------------------------------------------------------------
// 3. Customer Record Retention Policy
// -------------------------------------------------------------
function getRetentionDays() {
    return parseInt(process.env.RETENTION_DAYS || '90', 10);
}

function runRetentionCleanup(overrideDays = null) {
    const days = overrideDays !== null ? overrideDays : getRetentionDays();
    if (isNaN(days) || days <= 0) {
        // days <= 0 disables automatic expiry
        return { cleanedCount: 0, removedFiles: 0, disabled: true };
    }

    if (isStorageCorrupted) {
        console.warn('⚠️ [RETENTION CLEANUP SKIPPED] Storage corrupted. Skipping cleanup.');
        return { error: 'Storage corrupted' };
    }

    try {
        const enquiries = getEnquiries();
        const now = Date.now();
        const maxAgeMs = days * 24 * 60 * 60 * 1000;
        const remaining = [];
        let cleanedCount = 0;
        let removedFiles = 0;

        for (const item of enquiries) {
            const createdAt = new Date(item.createdAt).getTime();
            const isExpired = !isNaN(createdAt) && (now - createdAt > maxAgeMs);

            if (isExpired) {
                cleanedCount++;
                if (item.files && Array.isArray(item.files)) {
                    for (const f of item.files) {
                        if (f && f.storedFilename) {
                            const safeFilename = path.basename(f.storedFilename);
                            const filePath = path.join(UPLOADS_DIR, safeFilename);
                            if (filePath.startsWith(UPLOADS_DIR) && fs.existsSync(filePath)) {
                                try {
                                    fs.unlinkSync(filePath);
                                    removedFiles++;
                                } catch (err) {
                                    console.error(`⚠️ [RETENTION CLEANUP] Failed to unlink ${safeFilename}: ${err.message}`);
                                }
                            }
                        }
                    }
                }
            } else {
                remaining.push(item);
            }
        }

        if (cleanedCount > 0) {
            saveEnquiries(remaining);
            console.log(`🧹 [RETENTION CLEANUP] Purged ${cleanedCount} expired record(s) and ${removedFiles} file(s) (> ${days} days old).`);
        }

        return { cleanedCount, removedFiles, disabled: false };
    } catch (err) {
        console.error('🚨 [RETENTION CLEANUP ERROR]', err.message);
        return { error: err.message };
    }
}

// Run retention cleanup on startup and schedule every 24 hours
if (getRetentionDays() > 0) {
    runRetentionCleanup();
    setInterval(() => runRetentionCleanup(), 24 * 60 * 60 * 1000).unref();
}

// -------------------------------------------------------------
// 4. Constant-Time Authentication & Rate Limiting
// -------------------------------------------------------------
function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        const parts = forwarded.split(',');
        if (parts.length > 0 && parts[0].trim()) {
            return parts[0].trim();
        }
    }
    return req.socket.remoteAddress || 'unknown';
}

// Enquiry Submission Rate Limiter (8 per 15 min per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 8;

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || [];
    const validTimestamps = entry.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (validTimestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
        return true;
    }
    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);
    return false;
}

// Admin Login Rate Limiter (Max 5 failed attempts per 15 min per IP)
const adminLoginAttempts = new Map();
const ADMIN_LOGIN_WINDOW = 15 * 60 * 1000;
const MAX_ADMIN_LOGIN_FAILURES = 5;

function isLoginRateLimited(ip) {
    const now = Date.now();
    const entry = adminLoginAttempts.get(ip) || [];
    const valid = entry.filter(ts => now - ts < ADMIN_LOGIN_WINDOW);
    adminLoginAttempts.set(ip, valid);
    return valid.length >= MAX_ADMIN_LOGIN_FAILURES;
}

function recordLoginFailure(ip) {
    const now = Date.now();
    const entry = adminLoginAttempts.get(ip) || [];
    const valid = entry.filter(ts => now - ts < ADMIN_LOGIN_WINDOW);
    valid.push(now);
    adminLoginAttempts.set(ip, valid);
}

function clearLoginFailures(ip) {
    adminLoginAttempts.delete(ip);
}

// Periodic cleanup of rate limit maps every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, tsList] of rateLimitMap.entries()) {
        const valid = tsList.filter(ts => now - ts < RATE_LIMIT_WINDOW);
        if (valid.length === 0) rateLimitMap.delete(ip);
        else rateLimitMap.set(ip, valid);
    }
    for (const [ip, tsList] of adminLoginAttempts.entries()) {
        const valid = tsList.filter(ts => now - ts < ADMIN_LOGIN_WINDOW);
        if (valid.length === 0) adminLoginAttempts.delete(ip);
        else adminLoginAttempts.set(ip, valid);
    }
}, 10 * 60 * 1000).unref();

function isAuthenticated(req) {
    if (!ADMIN_TOKEN) return false;
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        return safeCompare(token, ADMIN_TOKEN);
    }
    // Query string token is intentionally PROHIBITED to prevent token leakage in URLs & logs
    return false;
}

// -------------------------------------------------------------
// 5. Automatic Email Notifications (Nodemailer Integration)
// -------------------------------------------------------------
let emailTransporter = null;
let emailNotificationConfigured = false;

function initEmailNotifier(mockTransporter = null) {
    if (mockTransporter) {
        emailTransporter = mockTransporter;
        emailNotificationConfigured = true;
        return;
    }

    const enabled = (process.env.EMAIL_NOTIFICATIONS_ENABLED || '').toLowerCase() === 'true';
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!enabled) {
        emailNotificationConfigured = false;
        return;
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('⚠️ [EMAIL NOTIFICATIONS] Enabled but awaiting SMTP settings (host, user, pass).');
        emailNotificationConfigured = false;
        return;
    }

    try {
        const nodemailer = require('nodemailer');
        emailTransporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: (process.env.SMTP_SECURE || '').toLowerCase() === 'true',
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });
        emailNotificationConfigured = true;
        console.log('📧 [EMAIL NOTIFICATIONS] Configured with SMTP server.');
    } catch (err) {
        console.error('🚨 [EMAIL NOTIFICATIONS ERROR] Nodemailer initialization failed:', err.message);
        emailNotificationConfigured = false;
    }
}

initEmailNotifier();

async function sendEnquiryNotification(enquiryRecord) {
    if (!emailNotificationConfigured || !emailTransporter) {
        return { sent: false, reason: 'not_configured' };
    }

    const recipient = process.env.NOTIFICATION_EMAIL || 'digitalseva7051@gmail.com';
    const fromAddress = process.env.EMAIL_FROM || '"Digital Seva Notifications" <no-reply@example.com>';

    const mailOptions = {
        from: fromAddress,
        to: recipient,
        subject: `[Digital Seva] New Enquiry: ${enquiryRecord.enquiryId} (${enquiryRecord.service.toUpperCase()})`,
        text: `New Citizen Service Enquiry Received
----------------------------------------
Reference ID: ${enquiryRecord.enquiryId}
Service: ${enquiryRecord.service.toUpperCase()}
Application Type / Variant: ${enquiryRecord.variant || 'Standard'}
Submitted At: ${enquiryRecord.createdAt}
Attached Documents: ${enquiryRecord.files ? enquiryRecord.files.length : 0} file(s)

Log in to the Owner Dashboard to review this enquiry and retrieve attached documents securely.
----------------------------------------
Digital Seva Automated Notification System`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e40af; margin-top: 0;">🏛️ Digital Seva — New Enquiry Received</h2>
            <p>A new customer application assistance enquiry has been received on the portal.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Reference ID:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><code>${enquiryRecord.enquiryId}</code></td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Service:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${enquiryRecord.service.toUpperCase()}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Variant / Type:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${enquiryRecord.variant || 'Standard'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Submitted At:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${enquiryRecord.createdAt}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Attached Documents:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${enquiryRecord.files ? enquiryRecord.files.length : 0} file(s)</td></tr>
            </table>
            <p style="color: #64748b; font-size: 0.9em;"><em>Note: For privacy and UIDAI compliance, customer personal documents and numbers are not transmitted via email. Access them via the authenticated Owner Portal.</em></p>
        </div>`
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        console.log(`[EMAIL NOTIFICATION SENT] Ref: ${enquiryRecord.enquiryId}`);
        return { sent: true };
    } catch (err) {
        console.error(`[EMAIL NOTIFICATION FAILED] Ref: ${enquiryRecord.enquiryId} | Error: ${err.message}`);
        return { sent: false, error: err.message };
    }
}

// -------------------------------------------------------------
// 6. Magic Bytes Binary Signature Validation
// -------------------------------------------------------------
const SIGNATURES = {
    pdf: {
        magic: [0x25, 0x50, 0x44, 0x46], // %PDF
        mime: 'application/pdf',
        ext: 'pdf'
    },
    jpg: {
        magic: [0xFF, 0xD8, 0xFF], // JPEG
        mime: 'image/jpeg',
        ext: 'jpg'
    },
    png: {
        magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
        mime: 'image/png',
        ext: 'png'
    }
};

function validateMagicBytes(buffer) {
    if (!buffer || buffer.length < 8) return null;

    // Check PNG
    const png = SIGNATURES.png.magic;
    let isPng = true;
    for (let i = 0; i < png.length; i++) {
        if (buffer[i] !== png[i]) { isPng = false; break; }
    }
    if (isPng) return SIGNATURES.png;

    // Check JPEG
    const jpg = SIGNATURES.jpg.magic;
    let isJpg = true;
    for (let i = 0; i < jpg.length; i++) {
        if (buffer[i] !== jpg[i]) { isJpg = false; break; }
    }
    if (isJpg) return SIGNATURES.jpg;

    // Check PDF
    const pdf = SIGNATURES.pdf.magic;
    let isPdf = true;
    for (let i = 0; i < pdf.length; i++) {
        if (buffer[i] !== pdf[i]) { isPdf = false; break; }
    }
    if (isPdf) return SIGNATURES.pdf;

    return null;
}

// -------------------------------------------------------------
// 7. Multipart Form-Data Parser
// -------------------------------------------------------------
function parseMultipartFormData(bodyBuffer, boundary) {
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = [];

    let start = 0;
    while ((start = bodyBuffer.indexOf(boundaryBuffer, start)) !== -1) {
        start += boundaryBuffer.length;
        if (bodyBuffer.slice(start, start + 2).equals(Buffer.from('--'))) {
            break; // End boundary
        }
        if (bodyBuffer.slice(start, start + 2).equals(Buffer.from('\r\n'))) {
            start += 2;
        }

        const nextBoundary = bodyBuffer.indexOf(boundaryBuffer, start);
        if (nextBoundary === -1) break;

        let partBuffer = bodyBuffer.slice(start, nextBoundary);
        if (partBuffer.slice(-2).equals(Buffer.from('\r\n'))) {
            partBuffer = partBuffer.slice(0, -2);
        }

        const headerEnd = partBuffer.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd === -1) continue;

        const headerStr = partBuffer.slice(0, headerEnd).toString('utf8');
        const contentBuffer = partBuffer.slice(headerEnd + 4);

        const headers = {};
        headerStr.split('\r\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx !== -1) {
                headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
            }
        });

        const disposition = headers['content-disposition'] || '';
        const nameMatch = disposition.match(/name="([^"]+)"/);
        const filenameMatch = disposition.match(/filename="([^"]+)"/);

        if (nameMatch) {
            parts.push({
                fieldName: nameMatch[1],
                filename: filenameMatch ? filenameMatch[1] : null,
                contentType: headers['content-type'] || 'text/plain',
                data: contentBuffer
            });
        }
        start = nextBoundary;
    }
    return parts;
}

// -------------------------------------------------------------
// 8. Safe Static File Delivery with Security Headers
// -------------------------------------------------------------
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'self';"
};

function serveStaticFile(req, res, pathname) {
    let safePath = pathname === '/' ? '/index.html' : pathname;

    // Strict path normalization to prevent directory traversal
    const normalized = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');

    // Strictly prohibit sensitive system files, server sources, tests, and storage paths
    if (
        normalized.includes('..') ||
        normalized.startsWith('/uploads') ||
        normalized.startsWith('/.git') ||
        normalized.startsWith('/tests') ||
        normalized.startsWith('/node_modules') ||
        normalized.endsWith('.env') ||
        normalized.includes('.env.') ||
        normalized === '/server.js' ||
        normalized === '/package.json' ||
        normalized === '/package-lock.json' ||
        normalized === '/yarn.lock' ||
        (normalized.endsWith('.json') && !normalized.endsWith('manifest.json'))
    ) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
        res.end('Access Denied');
        return;
    }

    const filePath = path.join(__dirname, normalized);

    // Guard against serving any file located inside the private UPLOADS_DIR
    if (filePath.startsWith(UPLOADS_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
        res.end('Access Denied');
        return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
        res.end('File Not Found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        ...SECURITY_HEADERS
    });
    res.end(content);
}

// -------------------------------------------------------------
// 9. HTTP Application Server
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const clientIp = getClientIp(req);

    // ---------------------------------------------------------
    // Endpoint: GET /healthz (Healthcheck for Render deployments)
    // ---------------------------------------------------------
    if (pathname === '/healthz' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            ...SECURITY_HEADERS
        });
        res.end(JSON.stringify({
            status: 'ok',
            storageReady: !isStorageCorrupted,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // ---------------------------------------------------------
    // API: POST /api/enquiries (Customer Enquiry + Optional Uploads)
    // ---------------------------------------------------------
    if (pathname === '/api/enquiries' && req.method === 'POST') {
        if (isRateLimited(clientIp)) {
            res.writeHead(429, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                ...SECURITY_HEADERS
            });
            res.end(JSON.stringify({
                success: false,
                error: 'Too many requests. Please wait a few minutes before submitting again.'
            }));
            return;
        }

        const chunks = [];
        let totalSize = 0;

        req.on('data', chunk => {
            totalSize += chunk.length;
            if (totalSize > MAX_REQUEST_SIZE) {
                res.writeHead(413, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                res.end(JSON.stringify({ success: false, error: 'Total request size exceeds maximum limit of 25 MB.' }));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });

        req.on('end', async () => {
            try {
                const bodyBuffer = Buffer.concat(chunks);
                const contentType = req.headers['content-type'] || '';

                let fields = {};
                let uploadedFiles = [];

                if (contentType.includes('multipart/form-data')) {
                    const boundaryMatch = contentType.match(/boundary=(?:["']?)([^"';]+)(?:["']?)/);
                    if (!boundaryMatch) {
                        res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                        res.end(JSON.stringify({ success: false, error: 'Invalid multipart boundary.' }));
                        return;
                    }
                    const boundary = boundaryMatch[1];
                    const parts = parseMultipartFormData(bodyBuffer, boundary);

                    for (const part of parts) {
                        if (part.filename) {
                            if (part.data.length === 0) continue; // Skip empty files

                            if (part.data.length > MAX_FILE_SIZE) {
                                res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `File ${part.filename} exceeds the maximum 5 MB limit.`
                                }));
                                return;
                            }

                            // Validate Magic Bytes signature
                            const sig = validateMagicBytes(part.data);
                            if (!sig) {
                                res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `File ${part.filename} is not a valid PDF, JPG, or PNG document.`
                                }));
                                return;
                            }

                            // Generate safe cryptographic UUID filename
                            const fileId = crypto.randomUUID();
                            const storedFilename = `${fileId}.${sig.ext}`;
                            const storagePath = path.join(UPLOADS_DIR, storedFilename);

                            fs.writeFileSync(storagePath, part.data);

                            uploadedFiles.push({
                                fileId: fileId,
                                slotName: part.fieldName,
                                originalName: path.basename(part.filename).replace(/[^a-zA-Z0-9._-]/g, '_'),
                                storedFilename: storedFilename,
                                sizeBytes: part.data.length,
                                mimeType: sig.mime
                            });
                        } else {
                            fields[part.fieldName] = part.data.toString('utf8').trim();
                        }
                    }
                } else if (contentType.includes('application/json')) {
                    fields = JSON.parse(bodyBuffer.toString('utf8'));
                } else {
                    res.writeHead(415, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                    res.end(JSON.stringify({ success: false, error: 'Unsupported Content-Type.' }));
                    return;
                }

                // Field Validations
                const name = (fields.name || '').trim();
                const phone = (fields.phone || '').replace(/[\s\-\+]/g, '').slice(-10);
                const service = (fields.service || '').trim();
                const variant = (fields.variant || '').trim();
                const notes = (fields.notes || '').slice(0, 1000).trim();

                if (!name || name.length < 2) {
                    res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                    res.end(JSON.stringify({ success: false, error: 'Please enter a valid applicant name.' }));
                    return;
                }

                if (!/^[6-9]\d{9}$/.test(phone)) {
                    res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                    res.end(JSON.stringify({ success: false, error: 'Please enter a valid 10-digit Indian mobile number.' }));
                    return;
                }

                if (!service) {
                    res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                    res.end(JSON.stringify({ success: false, error: 'Please select a valid service.' }));
                    return;
                }

                // Generate Unique Enquiry Record
                const enquiryId = `DS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
                const enquiryRecord = {
                    enquiryId: enquiryId,
                    createdAt: new Date().toISOString(),
                    name: name,
                    phone: phone,
                    service: service,
                    variant: variant,
                    notes: notes,
                    status: 'received',
                    files: uploadedFiles
                };

                const enquiries = getEnquiries();
                enquiries.unshift(enquiryRecord);
                await safeSaveEnquiries(enquiries);

                // Safe operational log (No personal PII or document contents logged)
                console.log(`[ENQUIRY RECEIVED] ID: ${enquiryId} | Service: ${service} | Files: ${uploadedFiles.length}`);

                // Send Email Notification in background (non-blocking)
                sendEnquiryNotification(enquiryRecord).catch(() => {});

                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store',
                    ...SECURITY_HEADERS
                });
                res.end(JSON.stringify({
                    success: true,
                    enquiryId: enquiryId,
                    message: 'Enquiry submitted successfully.',
                    filesCount: uploadedFiles.length
                }));
            } catch (err) {
                console.error('[ENQUIRY ERROR]', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                res.end(JSON.stringify({ success: false, error: 'Failed to process enquiry. Please try again or use WhatsApp.' }));
            }
        });
        return;
    }

    // ---------------------------------------------------------
    // API: POST /api/admin/login (Verify Owner Password)
    // ---------------------------------------------------------
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        if (isLoginRateLimited(clientIp)) {
            res.writeHead(429, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                ...SECURITY_HEADERS
            });
            res.end(JSON.stringify({
                success: false,
                error: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
            }));
            return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const password = (data.password || '').trim();

                if (!ADMIN_TOKEN) {
                    res.writeHead(503, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                    res.end(JSON.stringify({ success: false, error: 'Admin access is not configured. Set ADMIN_TOKEN in environment.' }));
                    return;
                }

                if (password && safeCompare(password, ADMIN_TOKEN)) {
                    clearLoginFailures(clientIp);
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-store, no-cache, must-revalidate',
                        ...SECURITY_HEADERS
                    });
                    res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN }));
                } else {
                    recordLoginFailure(clientIp);
                    res.writeHead(401, {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-store',
                        ...SECURITY_HEADERS
                    });
                    res.end(JSON.stringify({ success: false, error: 'Invalid admin credentials.' }));
                }
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                res.end(JSON.stringify({ success: false, error: 'Bad request.' }));
            }
        });
        return;
    }

    // ---------------------------------------------------------
    // API: GET /api/admin/enquiries (Authenticated Owner Inquiries List)
    // ---------------------------------------------------------
    if (pathname === '/api/admin/enquiries' && req.method === 'GET') {
        if (!isAuthenticated(req)) {
            res.writeHead(401, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                ...SECURITY_HEADERS
            });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized.' }));
            return;
        }

        try {
            const enquiries = getEnquiries();
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                ...SECURITY_HEADERS
            });
            res.end(JSON.stringify({ success: true, enquiries: enquiries }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
            res.end(JSON.stringify({ success: false, error: 'Storage access failed.' }));
        }
        return;
    }

    // ---------------------------------------------------------
    // API: GET /api/admin/document (Authenticated Document Retrieval)
    // ---------------------------------------------------------
    if (pathname.startsWith('/api/admin/document/') && req.method === 'GET') {
        if (!isAuthenticated(req)) {
            res.writeHead(401, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store',
                ...SECURITY_HEADERS
            });
            res.end('Unauthorized');
            return;
        }

        const parts = pathname.split('/').filter(Boolean);
        // expected: ['api', 'admin', 'document', enquiryId, storedFilename]
        if (parts.length < 5) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
            res.end('Invalid document path');
            return;
        }

        const enquiryId = parts[3];
        const storedFilename = path.basename(parts[4]);

        try {
            const enquiries = getEnquiries();
            const enquiry = enquiries.find(e => e.enquiryId === enquiryId);
            if (!enquiry) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
                res.end('Enquiry not found');
                return;
            }

            const fileRecord = enquiry.files && enquiry.files.find(f => f.storedFilename === storedFilename);
            if (!fileRecord) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
                res.end('File record not found');
                return;
            }

            const filePath = path.join(UPLOADS_DIR, storedFilename);
            if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
                res.end('Physical file missing');
                return;
            }

            const fileBuffer = fs.readFileSync(filePath);
            res.writeHead(200, {
                'Content-Type': fileRecord.mimeType || 'application/octet-stream',
                'Content-Disposition': `inline; filename="${fileRecord.originalName}"`,
                'Content-Length': fileBuffer.length,
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                ...SECURITY_HEADERS
            });
            res.end(fileBuffer);
        } catch {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
            res.end('Failed to retrieve file.');
        }
        return;
    }

    // ---------------------------------------------------------
    // API: DELETE /api/admin/enquiry/:enquiryId (Owner Deletion)
    // ---------------------------------------------------------
    if (pathname.startsWith('/api/admin/enquiry/') && req.method === 'DELETE') {
        if (!isAuthenticated(req)) {
            res.writeHead(401, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                ...SECURITY_HEADERS
            });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized.' }));
            return;
        }

        const enquiryId = path.basename(pathname);
        try {
            let enquiries = getEnquiries();
            const target = enquiries.find(e => e.enquiryId === enquiryId);

            if (!target) {
                res.writeHead(404, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
                res.end(JSON.stringify({ success: false, error: 'Enquiry not found.' }));
                return;
            }

            // Delete physical files belonging to this enquiry
            if (target.files && Array.isArray(target.files)) {
                for (const file of target.files) {
                    if (file && file.storedFilename) {
                        const safeName = path.basename(file.storedFilename);
                        const p = path.join(UPLOADS_DIR, safeName);
                        if (p.startsWith(UPLOADS_DIR) && fs.existsSync(p)) {
                            try { fs.unlinkSync(p); } catch {}
                        }
                    }
                }
            }

            enquiries = enquiries.filter(e => e.enquiryId !== enquiryId);
            await safeSaveEnquiries(enquiries);

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                ...SECURITY_HEADERS
            });
            res.end(JSON.stringify({ success: true, message: 'Enquiry and files deleted.' }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
            res.end(JSON.stringify({ success: false, error: 'Deletion failed.' }));
        }
        return;
    }

    // ---------------------------------------------------------
    // Static Frontend File Delivery
    // ---------------------------------------------------------
    serveStaticFile(req, res, pathname);
});

// Start listening if run directly
if (require.main === module) {
    server.listen(PORT, HOST, () => {
        console.log(`=======================================================`);
        console.log(`🏛️ Digital Seva Server running at http://${HOST}:${PORT}`);
        console.log(`🔒 Private Storage: ${UPLOADS_DIR}`);
        console.log(`🛡️ Owner Admin Portal: http://${HOST}:${PORT}/admin.html`);
        console.log(`⏱️ Retention Policy: ${getRetentionDays() > 0 ? `${getRetentionDays()} days` : 'Disabled (Permanent)'}`);
        console.log(`=======================================================`);
    });
}

module.exports = {
    server,
    safeCompare,
    getClientIp,
    isRateLimited,
    isLoginRateLimited,
    recordLoginFailure,
    clearLoginFailures,
    initStorage,
    getEnquiries,
    saveEnquiries,
    safeSaveEnquiries,
    runRetentionCleanup,
    initEmailNotifier,
    sendEnquiryNotification,
    validateMagicBytes,
    UPLOADS_DIR,
    ENQUIRIES_FILE
};
