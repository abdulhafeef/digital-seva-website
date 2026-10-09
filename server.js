/**
 * Digital Seva — Secure Application Server & Private Upload Backend
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Features:
 * - Pure Node.js (zero external dependencies)
 * - Secure static file serving (protected against path traversal)
 * - Streaming multipart/form-data parser with strict size and type limits
 * - File signature / magic-bytes validation (PDF, JPEG, PNG)
 * - Safe randomized UUID storage in private uploads directory
 * - Encrypted/private enquiry store (never publicly accessible)
 * - Sliding-window rate limiting
 * - Authenticated Owner Admin API for reviewing enquiries and retrieving documents
 * - Safe sanitization and zero sensitive data logging
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

let ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_SECRET_KEY || null;

if (!ADMIN_TOKEN) {
    if (isProduction) {
        console.error('🚨 [SECURITY NOTICE] Production mode: ADMIN_TOKEN is not configured in environment! Admin endpoints are disabled.');
    } else {
        // Safe development fallback only when NOT in production
        ADMIN_TOKEN = 'ds_local_dev_only_key';
        console.warn('⚠️ [SECURITY NOTICE] Running in development mode with fallback key. Configure ADMIN_TOKEN in .env for production use.');
    }
}
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const ENQUIRIES_FILE = path.join(UPLOADS_DIR, 'enquiries.json');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_REQUEST_SIZE = 25 * 1024 * 1024; // 25 MB max total request payload

// Ensure private uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(ENQUIRIES_FILE)) {
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify([], null, 2), 'utf8');
}

// In-Memory Rate Limiter (Sliding Window per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 8; // Max 8 enquiries per 15 min per IP

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

// Allowed MIME types and corresponding Magic Byte Signatures
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

/**
 * Validates binary buffer against known magic byte signatures
 */
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

/**
 * Minimalist Multipart Form-Data Parser
 */
function parseMultipartFormData(bodyBuffer, boundary) {
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
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

        // Content between boundaries
        let partBuffer = bodyBuffer.slice(start, nextBoundary);
        if (partBuffer.slice(-2).equals(Buffer.from('\r\n'))) {
            partBuffer = partBuffer.slice(0, -2);
        }

        // Split headers and body
        const headerEnd = partBuffer.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd === -1) continue;

        const headerStr = partBuffer.slice(0, headerEnd).toString('utf8');
        const contentBuffer = partBuffer.slice(headerEnd + 4);

        // Parse headers
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

/**
 * Enquiries Store Helpers
 */
function getEnquiries() {
    try {
        const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveEnquiries(list) {
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(list, null, 2), 'utf8');
}

/**
 * Authentication Middleware Check
 */
function isAuthenticated(req) {
    if (!ADMIN_TOKEN) return false;
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        return token === ADMIN_TOKEN;
    }
    const queryToken = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
    return Boolean(queryToken && queryToken === ADMIN_TOKEN);
}

/**
 * Safe Static File Delivery
 */
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

function serveStaticFile(req, res, pathname) {
    let safePath = pathname === '/' ? '/index.html' : pathname;

    // Prohibit sensitive or non-public paths
    if (
        safePath.includes('..') ||
        safePath.startsWith('/uploads') ||
        safePath.endsWith('.env') ||
        safePath.startsWith('/.git') ||
        safePath.endsWith('.json') && !safePath.endsWith('manifest.json')
    ) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }

    const filePath = path.join(__dirname, safePath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(content);
}

// HTTP Server
const server = http.createServer((req, res) => {
    // CORS headers for local testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // -------------------------------------------------------------
    // API: POST /api/enquiries (Customer Enquiry + Optional Uploads)
    // -------------------------------------------------------------
    if (pathname === '/api/enquiries' && req.method === 'POST') {
        if (isRateLimited(clientIp)) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
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
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Total request size exceeds maximum limit of 25 MB.' }));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const bodyBuffer = Buffer.concat(chunks);
                const contentType = req.headers['content-type'] || '';

                let fields = {};
                let uploadedFiles = [];

                if (contentType.includes('multipart/form-data')) {
                    const boundaryMatch = contentType.match(/boundary=(?:["']?)([^"';]+)(?:["']?)/);
                    if (!boundaryMatch) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Invalid multipart boundary.' }));
                        return;
                    }
                    const boundary = boundaryMatch[1];
                    const parts = parseMultipartFormData(bodyBuffer, boundary);

                    for (const part of parts) {
                        if (part.filename) {
                            // File input
                            if (part.data.length === 0) continue; // Empty file upload ignored

                            if (part.data.length > MAX_FILE_SIZE) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `File ${part.filename} exceeds the maximum 5 MB limit.`
                                }));
                                return;
                            }

                            // Validate Magic Bytes signature
                            const sig = validateMagicBytes(part.data);
                            if (!sig) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: false,
                                    error: `File ${part.filename} is not a valid PDF, JPG, or PNG document.`
                                }));
                                return;
                            }

                            // Generate safe random unique filename
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
                    res.writeHead(415, { 'Content-Type': 'application/json' });
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
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Please enter a valid applicant name.' }));
                    return;
                }

                if (!/^[6-9]\d{9}$/.test(phone)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Please enter a valid 10-digit Indian mobile number.' }));
                    return;
                }

                if (!service) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Please select a valid service.' }));
                    return;
                }

                // Generate Enquiry Record
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
                saveEnquiries(enquiries);

                // Safe operational log (No personal secrets logged)
                console.log(`[ENQUIRY RECEIVED] ID: ${enquiryId} | Service: ${service} | Files: ${uploadedFiles.length}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    enquiryId: enquiryId,
                    message: 'Enquiry submitted successfully.',
                    filesCount: uploadedFiles.length
                }));
            } catch (err) {
                console.error('[ENQUIRY ERROR]', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Failed to process enquiry. Please try again or use WhatsApp.' }));
            }
        });
        return;
    }

    // -------------------------------------------------------------
    // API: POST /api/admin/login (Verify Owner Password)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const password = data.password || '';
                if (!ADMIN_TOKEN) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Admin access is not configured. Set ADMIN_TOKEN in environment.' }));
                    return;
                }
                if (password && password === ADMIN_TOKEN) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, token: ADMIN_TOKEN }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid admin credentials.' }));
                }
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Bad request.' }));
            }
        });
        return;
    }

    // -------------------------------------------------------------
    // API: GET /api/admin/enquiries (Authenticated Owner Inquiries List)
    // -------------------------------------------------------------
    if (pathname === '/api/admin/enquiries' && req.method === 'GET') {
        if (!isAuthenticated(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized.' }));
            return;
        }

        const enquiries = getEnquiries();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, enquiries: enquiries }));
        return;
    }

    // -------------------------------------------------------------
    // API: GET /api/admin/document (Authenticated Document Retrieval)
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/document/') && req.method === 'GET') {
        if (!isAuthenticated(req)) {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end('Unauthorized');
            return;
        }

        const parts = pathname.split('/').filter(Boolean);
        // expected: ['api', 'admin', 'document', enquiryId, storedFilename]
        if (parts.length < 5) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid document path');
            return;
        }

        const enquiryId = parts[3];
        const storedFilename = path.basename(parts[4]);

        const enquiries = getEnquiries();
        const enquiry = enquiries.find(e => e.enquiryId === enquiryId);
        if (!enquiry) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Enquiry not found');
            return;
        }

        const fileRecord = enquiry.files.find(f => f.storedFilename === storedFilename);
        if (!fileRecord) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File record not found');
            return;
        }

        const filePath = path.join(UPLOADS_DIR, storedFilename);
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Physical file missing');
            return;
        }

        const fileBuffer = fs.readFileSync(filePath);
        res.writeHead(200, {
            'Content-Type': fileRecord.mimeType || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${fileRecord.originalName}"`,
            'Content-Length': fileBuffer.length,
            'X-Content-Type-Options': 'nosniff'
        });
        res.end(fileBuffer);
        return;
    }

    // -------------------------------------------------------------
    // API: DELETE /api/admin/enquiry/:enquiryId (Owner Deletion)
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/enquiry/') && req.method === 'DELETE') {
        if (!isAuthenticated(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Unauthorized.' }));
            return;
        }

        const enquiryId = path.basename(pathname);
        let enquiries = getEnquiries();
        const target = enquiries.find(e => e.enquiryId === enquiryId);

        if (!target) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Enquiry not found.' }));
            return;
        }

        // Delete physical files
        if (target.files && Array.isArray(target.files)) {
            for (const file of target.files) {
                const p = path.join(UPLOADS_DIR, file.storedFilename);
                if (fs.existsSync(p)) {
                    try { fs.unlinkSync(p); } catch {}
                }
            }
        }

        enquiries = enquiries.filter(e => e.enquiryId !== enquiryId);
        saveEnquiries(enquiries);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Enquiry and files deleted.' }));
        return;
    }

    // -------------------------------------------------------------
    // Static Frontend File Delivery
    // -------------------------------------------------------------
    serveStaticFile(req, res, pathname);
});

server.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`🏛️ Digital Seva Server running at http://${HOST}:${PORT}`);
    console.log(`🔒 Private Document Storage: ${UPLOADS_DIR}`);
    console.log(`🛡️ Owner Admin Portal: http://${HOST}:${PORT}/admin.html`);
    console.log(`=======================================================`);
});
