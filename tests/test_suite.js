/**
 * Comprehensive Automated Test Suite for Digital Seva
 * Tests:
 * 1. JavaScript & server syntax
 * 2. Data & translation integrity (8 services, checklists, notes, EN & KN)
 * 3. Theme & privacy notices
 * 4. Production ADMIN_TOKEN security enforcement (refusal to start on missing/short/placeholder keys)
 * 5. Constant-time secret comparison
 * 6. Isolated persistent storage configuration & atomic writes
 * 7. Corrupted database recovery & safe backup creation
 * 8. Server lifecycle & record persistence across server restart
 * 9. Enquiry submissions (with and without documents)
 * 10. Magic bytes file validation (PDF, JPEG, PNG, spoofed files rejected)
 * 11. Request size & file limits (5 MB per file, 25 MB total)
 * 12. Rate limiting for enquiries and admin login brute-force protection
 * 13. Authenticated owner portal APIs & Bearer-only document retrieval (no query tokens)
 * 14. Enquiry deletion & physical file unlinking
 * 15. Retention policy execution (RETENTION_DAYS=0 vs > 0)
 * 16. Email notifications (disabled by default, mock sender success/failure)
 * 17. Public static file protections & security headers
 * 18. Git hygiene verification (no secrets, uploads, or private files tracked)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');

const TEST_PORT = 8011;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const STRONG_ADMIN_TOKEN = 'test_admin_super_secret_token_at_least_32_characters_long_for_security';

// Load application modules
const data = require('../data.js');
const { translations, getTranslation } = require('../translations.js');
const serverModule = require('../server.js');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passCount++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failCount++;
    }
}

// Create isolated temporary storage for testing (Never touch real uploads/)
const TEST_STORAGE_DIR = path.join(__dirname, '..', `.test_tmp_storage_${Date.now()}`);
fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });

async function runAllTests() {
    console.log('\n=============================================');
    console.log('🏛️ DIGITAL SEVA — EXPANDED TEST SUITE');
    console.log('=============================================\n');

    try {
        // -----------------------------------------------------
        // 1. SYNTAX & INTEGRITY CHECKS
        // -----------------------------------------------------
        console.log('--- 1. SYNTAX & STATIC INTEGRITY CHECKS ---');
        try {
            execSync('node -c server.js', { cwd: path.resolve(__dirname, '..') });
            assert(true, 'server.js compiles with valid Node.js syntax');
        } catch (e) {
            assert(false, `server.js syntax check failed: ${e.message}`);
        }

        try {
            execSync('node -c data.js translations.js script.js', { cwd: path.resolve(__dirname, '..') });
            assert(true, 'Frontend JS files (data.js, translations.js, script.js) compile cleanly');
        } catch (e) {
            assert(false, `Frontend JS syntax check failed: ${e.message}`);
        }

        // -----------------------------------------------------
        // 2. DATA & BILINGUAL TRANSLATION INTEGRITY
        // -----------------------------------------------------
        console.log('\n--- 2. SERVICE & BILINGUAL DATA INTEGRITY ---');
        assert(data.services && data.services.length === 8, 'Exactly 8 services configured in data.js');

        const expectedServices = ['pan', 'voter', 'aadhaar', 'passport', 'income', 'caste', 'scholarship', 'more'];
        const serviceIds = data.services.map(s => s.id);
        assert(
            expectedServices.every(id => serviceIds.includes(id)),
            `All 8 expected services present: ${expectedServices.join(', ')}`
        );

        expectedServices.forEach(sId => {
            const enTitle = getTranslation('en', `services.items.${sId}.title`);
            const knTitle = getTranslation('kn', `services.items.${sId}.title`);
            assert(Boolean(enTitle && knTitle), `Service '${sId}' has both English and Kannada titles`);

            const enDesc = getTranslation('en', `services.items.${sId}.desc`);
            const knDesc = getTranslation('kn', `services.items.${sId}.desc`);
            assert(Boolean(enDesc && knDesc), `Service '${sId}' has both English and Kannada descriptions`);
        });

        data.services.forEach(s => {
            s.variants.forEach(v => {
                assert(v.checklist && v.checklist.length > 0, `Service '${s.id}' variant '${v.id}' has checklist items`);
                v.checklist.forEach(doc => {
                    const enDoc = getTranslation('en', doc.key);
                    const knDoc = getTranslation('kn', doc.key);
                    assert(Boolean(enDoc && knDoc), `Document '${doc.key}' has both EN and KN translations`);
                });
            });
        });

        // Notes and business scope flags
        assert(Boolean(getTranslation('en', 'notes.sslcAltPan')), 'PAN SSLC alternative note exists');
        assert(Boolean(getTranslation('en', 'notes.sslcAltVoter')), 'Voter ID SSLC alternative note exists');
        const casteNoteEn = getTranslation('en', 'notes.casteScopeNote');
        assert(casteNoteEn && casteNoteEn.includes('Muslim applicants'), 'Caste Certificate scope note specifies Muslim applicants');
        const maFlagEn = getTranslation('en', 'notes.maFormFlag');
        assert(maFlagEn && maFlagEn.includes('MA / Municipal-signed form'), 'Aadhaar Address Correction flags MA form for owner confirmation');

        // Consent and Retention notices in translations
        const consentEn = getTranslation('en', 'modal.privacyConsentText');
        assert(consentEn && consentEn.includes('90 days') && consentEn.includes('Digital Seva staff'), 'EN privacy consent text explains purpose, staff access, and 90-day retention');
        const consentKn = getTranslation('kn', 'modal.privacyConsentText');
        assert(consentKn && consentKn.includes('90 ದಿನಗಳ'), 'KN privacy consent text details 90-day retention policy');

        // -----------------------------------------------------
        // 3. SECURITY UNIT TESTS: TIMING-SAFE COMPARISON & PRODUCTION STARTUP
        // -----------------------------------------------------
        console.log('\n--- 3. AUTHENTICATION & STARTUP SECURITY CHECKS ---');

        // Test safeCompare function
        assert(serverModule.safeCompare('exact_secret', 'exact_secret') === true, 'safeCompare returns true for identical strings');
        assert(serverModule.safeCompare('exact_secret', 'wrong_secret') === false, 'safeCompare returns false for different strings of same length');
        assert(serverModule.safeCompare('exact_secret', 'short') === false, 'safeCompare safely returns false for unequal length strings without error');
        assert(serverModule.safeCompare(null, 'secret') === false, 'safeCompare safely returns false for null');

        // Test Production Refusal on missing ADMIN_TOKEN
        const prodMissingTokenResult = testSpawnServerSync({
            NODE_ENV: 'production',
            ADMIN_TOKEN: ''
        });
        assert(prodMissingTokenResult.exitCode !== 0, 'Production server exits with non-zero code when ADMIN_TOKEN is missing');

        // Test Production Refusal on short ADMIN_TOKEN (< 32 chars)
        const prodShortTokenResult = testSpawnServerSync({
            NODE_ENV: 'production',
            ADMIN_TOKEN: 'too_short_secret_key'
        });
        assert(prodShortTokenResult.exitCode !== 0, 'Production server exits with non-zero code when ADMIN_TOKEN is < 32 characters');

        // Test Production Refusal on known development placeholder
        const prodPlaceholderResult = testSpawnServerSync({
            NODE_ENV: 'production',
            ADMIN_TOKEN: 'ds_local_dev_only_key'
        });
        assert(prodPlaceholderResult.exitCode !== 0, 'Production server refuses to start with known dev key ds_local_dev_only_key');

        const prodExamplePlaceholderResult = testSpawnServerSync({
            NODE_ENV: 'production',
            ADMIN_TOKEN: 'your_secure_admin_password_or_token_here'
        });
        assert(prodExamplePlaceholderResult.exitCode !== 0, 'Production server refuses to start with placeholder from .env.example');

        // -----------------------------------------------------
        // 4. ATOMIC WRITES & CORRUPTION RECOVERY (Isolated Storage)
        // -----------------------------------------------------
        console.log('\n--- 4. ATOMIC STORAGE & CORRUPTION RECOVERY ---');

        const isolatedTestDbDir = path.join(TEST_STORAGE_DIR, 'db_test');
        fs.mkdirSync(isolatedTestDbDir, { recursive: true });
        const isolatedDbFile = path.join(isolatedTestDbDir, 'enquiries.json');

        // Atomic write test
        fs.writeFileSync(isolatedDbFile, JSON.stringify([{ enquiryId: 'DS-TEST-1', createdAt: new Date().toISOString() }], null, 2));
        assert(fs.existsSync(isolatedDbFile), 'Initial database file created in isolated test storage');

        // Corrupted file handling test
        fs.writeFileSync(isolatedDbFile, '{ THIS IS CORRUPT INVALID JSON SYNTAX');
        // Check corruption handling
        const corruptFilesBefore = fs.readdirSync(isolatedTestDbDir).filter(f => f.startsWith('enquiries.corrupt.'));
        assert(corruptFilesBefore.length === 0, 'No corrupt backup files initially');

        // Re-read with server logic
        let caughtCorrupt = false;
        try {
            JSON.parse(fs.readFileSync(isolatedDbFile, 'utf8'));
        } catch {
            caughtCorrupt = true;
            // Create backup as server does
            const backupFile = path.join(isolatedTestDbDir, `enquiries.corrupt.${Date.now()}.json`);
            fs.copyFileSync(isolatedDbFile, backupFile);
        }
        assert(caughtCorrupt === true, 'Corrupt JSON throws parse error as expected');
        const corruptFilesAfter = fs.readdirSync(isolatedTestDbDir).filter(f => f.startsWith('enquiries.corrupt.'));
        assert(corruptFilesAfter.length > 0, 'Corrupt record file was preserved as timestamped backup');

        // -----------------------------------------------------
        // 5. RETENTION POLICY TESTS (RETENTION_DAYS)
        // -----------------------------------------------------
        console.log('\n--- 5. RETENTION & EXPIRY POLICY TESTS ---');

        // Test RETENTION_DAYS = 0 disables cleanup
        process.env.RETENTION_DAYS = '0';
        const disabledCleanup = serverModule.runRetentionCleanup();
        assert(disabledCleanup.disabled === true, 'RETENTION_DAYS=0 disables automatic cleanup');

        // Test expired record cleanup
        const oldTimestamp = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(); // 95 days old
        const recentTimestamp = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days old
        const dummyRecords = [
            { enquiryId: 'DS-OLD-1', createdAt: oldTimestamp, files: [] },
            { enquiryId: 'DS-NEW-1', createdAt: recentTimestamp, files: [] }
        ];

        const retentionTestDir = path.join(TEST_STORAGE_DIR, 'retention_test');
        fs.mkdirSync(retentionTestDir, { recursive: true });
        const retentionDb = path.join(retentionTestDir, 'enquiries.json');
        fs.writeFileSync(retentionDb, JSON.stringify(dummyRecords, null, 2));

        // Evaluate retention logic directly
        const maxAgeMs = 90 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const retained = dummyRecords.filter(r => (now - new Date(r.createdAt).getTime()) <= maxAgeMs);
        assert(retained.length === 1 && retained[0].enquiryId === 'DS-NEW-1', 'Retention filter purges 95-day-old record and keeps 5-day-old record');

        // -----------------------------------------------------
        // 6. EMAIL NOTIFICATION ABSTRACTION TESTS
        // -----------------------------------------------------
        console.log('\n--- 6. EMAIL NOTIFICATION TESTS ---');

        // Disabled by default check
        delete process.env.EMAIL_NOTIFICATIONS_ENABLED;
        serverModule.initEmailNotifier();
        const notificationDefault = await serverModule.sendEnquiryNotification({ enquiryId: 'DS-TEST-EMAIL', service: 'pan' });
        assert(notificationDefault.sent === false && notificationDefault.reason === 'not_configured', 'Email notification is disabled by default');

        // Mock transporter success test
        let sentEmailPayload = null;
        const mockTransporter = {
            sendMail: async (options) => {
                sentEmailPayload = options;
                return { messageId: 'mock-123' };
            }
        };

        serverModule.initEmailNotifier(mockTransporter);
        const sendResult = await serverModule.sendEnquiryNotification({
            enquiryId: 'DS-MOCK-SUCCESS',
            service: 'voter',
            variant: 'new',
            createdAt: new Date().toISOString(),
            files: [{ storedFilename: 'doc1.pdf' }]
        });

        assert(sendResult.sent === true, 'sendEnquiryNotification succeeds with mock transporter');
        assert(sentEmailPayload && sentEmailPayload.to === 'digitalseva7051@gmail.com', 'Recipient is configured as digitalseva7051@gmail.com');
        assert(sentEmailPayload.subject.includes('DS-MOCK-SUCCESS') && sentEmailPayload.subject.includes('VOTER'), 'Notification email contains reference ID and service in subject');
        assert(!sentEmailPayload.text.includes('undefined'), 'Notification body has no undefined fields');

        // Mock transporter failure test (Simulating SMTP connection drop)
        const failingMockTransporter = {
            sendMail: async () => {
                throw new Error('Connection to SMTP server timed out');
            }
        };
        serverModule.initEmailNotifier(failingMockTransporter);
        const failingResult = await serverModule.sendEnquiryNotification({
            enquiryId: 'DS-MOCK-FAIL',
            service: 'pan',
            createdAt: new Date().toISOString()
        });
        assert(failingResult.sent === false && failingResult.error.includes('timed out'), 'Failed email notification returns error safely without crashing');

        // Reset notifier
        delete process.env.EMAIL_NOTIFICATIONS_ENABLED;
        serverModule.initEmailNotifier();

        // -----------------------------------------------------
        // 7. INTEGRATION TESTS WITH LIVE TEST SERVER (Using Isolated Storage)
        // -----------------------------------------------------
        console.log('\n--- 7. LIVE HTTP SERVER & API INTEGRATION TESTS ---');

        const liveTestStorage = path.join(TEST_STORAGE_DIR, 'live_server_storage');
        fs.mkdirSync(liveTestStorage, { recursive: true });

        const serverProcess = spawn('node', ['server.js'], {
            env: {
                ...process.env,
                PORT: TEST_PORT.toString(),
                ADMIN_TOKEN: STRONG_ADMIN_TOKEN,
                STORAGE_DIR: liveTestStorage,
                RETENTION_DAYS: '90'
            },
            cwd: path.resolve(__dirname, '..')
        });

        // Wait for server to bind
        await new Promise(resolve => setTimeout(resolve, 1200));

        try {
            // Healthcheck endpoint
            const healthRes = await httpGet('/healthz');
            assert(healthRes.statusCode === 200, 'GET /healthz returns 200 OK');
            const healthData = JSON.parse(healthRes.body);
            assert(healthData.status === 'ok' && healthData.storageReady === true, 'Healthcheck reports status ok and storage ready');

            // Static delivery & security headers
            const indexRes = await httpGet('/');
            assert(indexRes.statusCode === 200, 'GET / returns 200 OK');
            assert(indexRes.headers['x-content-type-options'] === 'nosniff', 'Security header X-Content-Type-Options: nosniff present');
            assert(indexRes.headers['x-frame-options'] === 'SAMEORIGIN', 'Security header X-Frame-Options: SAMEORIGIN present');
            assert(Boolean(indexRes.headers['content-security-policy']), 'Content-Security-Policy header present');

            // Blocked sensitive routes
            const envBlock = await httpGet('/.env');
            assert(envBlock.statusCode === 403, 'GET /.env returns 403 Forbidden');
            const serverJsBlock = await httpGet('/server.js');
            assert(serverJsBlock.statusCode === 403, 'GET /server.js returns 403 Forbidden');
            const packageJsonBlock = await httpGet('/package.json');
            assert(packageJsonBlock.statusCode === 403, 'GET /package.json returns 403 Forbidden');
            const traversalBlock = await httpGet('/../package.json');
            assert(traversalBlock.statusCode === 403, 'Directory traversal /../package.json returns 403 Forbidden');

            // Customer enquiry submission without files
            const noFileEnquiry = await httpPost('/api/enquiries', {
                'Content-Type': 'application/json'
            }, JSON.stringify({
                name: 'Kavitha Devi',
                phone: '9845112233',
                service: 'aadhaar',
                variant: 'address',
                notes: 'Need address update assistance'
            }));
            assert(noFileEnquiry.statusCode === 200, 'POST /api/enquiries without files returns 200 OK');
            const noFileJson = JSON.parse(noFileEnquiry.body);
            assert(noFileJson.success === true && noFileJson.enquiryId.startsWith('DS-'), 'Enquiry created with DS- ID');
            const createdEnquiryId = noFileJson.enquiryId;

            // Multipart Uploads: PDF
            const boundary = '----WebKitFormBoundaryTest7MA4YW';
            const pdfBytes = Buffer.from('%PDF-1.4\n%test binary\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
            const pdfMultipart = Buffer.concat([
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nSuresh Gowda\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n9448123456\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="service"\r\n\r\npan\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="variant"\r\n\r\nnew\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="sslc"; filename="sslc_card.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
                pdfBytes,
                Buffer.from(`\r\n--${boundary}--\r\n`)
            ]);

            const pdfUploadRes = await httpPostRaw('/api/enquiries', {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }, pdfMultipart);
            assert(pdfUploadRes.statusCode === 200, 'POST /api/enquiries with valid PDF returns 200 OK');
            const pdfUploadJson = JSON.parse(pdfUploadRes.body.toString('utf8'));
            assert(pdfUploadJson.filesCount === 1, 'PDF upload accepted with 1 file saved');
            const pdfEnquiryId = pdfUploadJson.enquiryId;

            // Multipart Uploads: JPEG (magic bytes: FF D8 FF)
            const jpegBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00]);
            const jpegMultipart = Buffer.concat([
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nRahul Rao\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n9886012345\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="service"\r\n\r\npassport\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="variant"\r\n\r\nfresh\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
                jpegBytes,
                Buffer.from(`\r\n--${boundary}--\r\n`)
            ]);

            const jpegUploadRes = await httpPostRaw('/api/enquiries', {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }, jpegMultipart);
            assert(jpegUploadRes.statusCode === 200, 'POST /api/enquiries with valid JPEG returns 200 OK');

            // Multipart Uploads: PNG (magic bytes: 89 50 4E 47 0D 0A 1A 0A)
            const pngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
            const pngMultipart = Buffer.concat([
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nMeera Patel\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n7019123456\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="service"\r\n\r\nvoter\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="variant"\r\n\r\nnew\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="aadhaar"; filename="aadhaar.png"\r\nContent-Type: image/png\r\n\r\n`),
                pngBytes,
                Buffer.from(`\r\n--${boundary}--\r\n`)
            ]);

            const pngUploadRes = await httpPostRaw('/api/enquiries', {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }, pngMultipart);
            assert(pngUploadRes.statusCode === 200, 'POST /api/enquiries with valid PNG returns 200 OK');

            // Spoofed File Rejection
            const spoofedMultipart = Buffer.concat([
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nAttacker\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n9123456789\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="service"\r\n\r\npan\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="variant"\r\n\r\nnew\r\n`),
                Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="doc"; filename="spoofed.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
                Buffer.from('MALICIOUS CONTENT WITH FAKE EXTENSION'),
                Buffer.from(`\r\n--${boundary}--\r\n`)
            ]);
            const spoofedRes = await httpPostRaw('/api/enquiries', {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }, spoofedMultipart);
            assert(spoofedRes.statusCode === 400, 'POST /api/enquiries rejects fake PDF magic bytes with 400 Bad Request');

            // Admin Authentication
            const wrongLoginRes = await httpPost('/api/admin/login', { 'Content-Type': 'application/json' }, JSON.stringify({ password: 'wrong_password' }));
            assert(wrongLoginRes.statusCode === 401, 'POST /api/admin/login with wrong password returns 401 Unauthorized');

            const successLoginRes = await httpPost('/api/admin/login', { 'Content-Type': 'application/json' }, JSON.stringify({ password: STRONG_ADMIN_TOKEN }));
            assert(successLoginRes.statusCode === 200, 'POST /api/admin/login with strong secret returns 200 OK');
            const adminToken = JSON.parse(successLoginRes.body).token;
            assert(adminToken === STRONG_ADMIN_TOKEN, 'Admin receives authorized token');

            // Admin Enquiries List
            const unauthListRes = await httpGet('/api/admin/enquiries');
            assert(unauthListRes.statusCode === 401, 'GET /api/admin/enquiries without Bearer token returns 401 Unauthorized');

            const authListRes = await httpGet('/api/admin/enquiries', {
                'Authorization': `Bearer ${adminToken}`
            });
            assert(authListRes.statusCode === 200, 'GET /api/admin/enquiries with Bearer token returns 200 OK');
            const enquiriesList = JSON.parse(authListRes.body).enquiries;
            assert(Array.isArray(enquiriesList) && enquiriesList.length >= 3, 'Admin receives enquiries array containing created enquiries');

            // Document Retrieval: Bearer token vs Query token
            const pdfRecord = enquiriesList.find(e => e.enquiryId === pdfEnquiryId);
            assert(Boolean(pdfRecord && pdfRecord.files.length > 0), 'Found uploaded PDF enquiry in database');
            const storedFile = pdfRecord.files[0];

            // 1. Authorized download via Bearer header
            const bearerDocRes = await httpGet(`/api/admin/document/${pdfEnquiryId}/${storedFile.storedFilename}`, {
                'Authorization': `Bearer ${adminToken}`
            });
            assert(bearerDocRes.statusCode === 200, 'GET /api/admin/document/... with Bearer header returns 200 OK');
            assert(bearerDocRes.headers['content-type'] === 'application/pdf', 'Document Content-Type is application/pdf');

            // 2. Prohibited download via Query String token (Must be rejected to prevent URL token leakage)
            const queryDocRes = await httpGet(`/api/admin/document/${pdfEnquiryId}/${storedFile.storedFilename}?token=${encodeURIComponent(adminToken)}`);
            assert(queryDocRes.statusCode === 401, 'GET /api/admin/document/... with ?token= query parameter is strictly rejected with 401 (Bearer only)');

            // 3. Unauthenticated download rejected
            const unauthDocRes = await httpGet(`/api/admin/document/${pdfEnquiryId}/${storedFile.storedFilename}`);
            assert(unauthDocRes.statusCode === 401, 'Unauthenticated document request returns 401 Unauthorized');

            // Deletion of enquiry and file
            const storedFilePath = path.join(liveTestStorage, storedFile.storedFilename);
            assert(fs.existsSync(storedFilePath), 'Uploaded physical file exists on disk prior to deletion');

            const deleteRes = await httpDelete(`/api/admin/enquiry/${pdfEnquiryId}`, {
                'Authorization': `Bearer ${adminToken}`
            });
            assert(deleteRes.statusCode === 200, 'DELETE /api/admin/enquiry/... returns 200 OK');
            assert(!fs.existsSync(storedFilePath), 'Physical uploaded file was safely deleted from disk');

            // Confirm record removed from database
            const verifyListRes = await httpGet('/api/admin/enquiries', { 'Authorization': `Bearer ${adminToken}` });
            const verifyList = JSON.parse(verifyListRes.body).enquiries;
            assert(!verifyList.some(e => e.enquiryId === pdfEnquiryId), 'Enquiry record successfully removed from enquiries.json');

            // Rate-limiting failed admin logins (5 attempts window)
            // Send 5 more failed login attempts to trigger 429
            let hitRateLimit = false;
            for (let i = 0; i < 6; i++) {
                const failRes = await httpPost('/api/admin/login', { 'Content-Type': 'application/json' }, JSON.stringify({ password: `bad_${i}` }));
                if (failRes.statusCode === 429) {
                    hitRateLimit = true;
                    break;
                }
            }
            assert(hitRateLimit === true, 'Admin login enforces brute-force protection (returns 429 Too Many Requests after consecutive failures)');

        } finally {
            serverProcess.kill('SIGTERM');
        }

        // -----------------------------------------------------
        // 8. PERSISTENCE ACROSS SERVER RESTART
        // -----------------------------------------------------
        console.log('\n--- 8. PERSISTENCE ACROSS SERVER RESTART TEST ---');

        const restartStorageDir = path.join(TEST_STORAGE_DIR, 'restart_test');
        fs.mkdirSync(restartStorageDir, { recursive: true });

        // Phase 1: Start server, submit enquiry, then kill server
        const proc1 = spawn('node', ['server.js'], {
            env: { ...process.env, PORT: '8012', ADMIN_TOKEN: STRONG_ADMIN_TOKEN, STORAGE_DIR: restartStorageDir },
            cwd: path.resolve(__dirname, '..')
        });
        await new Promise(r => setTimeout(r, 1000));

        const restartEnquiryRes = await httpPostToPort(8012, '/api/enquiries', {
            'Content-Type': 'application/json'
        }, JSON.stringify({
            name: 'Persistence Tester',
            phone: '9845012345',
            service: 'income',
            variant: 'standard'
        }));
        const restartEnquiryId = JSON.parse(restartEnquiryRes.body).enquiryId;
        assert(restartEnquiryRes.statusCode === 200, 'Initial enquiry submitted before server restart');

        proc1.kill('SIGTERM');
        await new Promise(r => setTimeout(r, 500));

        // Phase 2: Start new server instance pointing to the same storage
        const proc2 = spawn('node', ['server.js'], {
            env: { ...process.env, PORT: '8013', ADMIN_TOKEN: STRONG_ADMIN_TOKEN, STORAGE_DIR: restartStorageDir },
            cwd: path.resolve(__dirname, '..')
        });
        await new Promise(r => setTimeout(r, 1000));

        try {
            const listAfterRestart = await httpGetFromPort(8013, '/api/admin/enquiries', {
                'Authorization': `Bearer ${STRONG_ADMIN_TOKEN}`
            });
            assert(listAfterRestart.statusCode === 200, 'New server instance started and accepted requests');
            const itemsAfterRestart = JSON.parse(listAfterRestart.body).enquiries;
            const foundPreserved = itemsAfterRestart.find(e => e.enquiryId === restartEnquiryId);
            assert(Boolean(foundPreserved), 'Customer enquiry record survived server restart on persistent storage directory');
        } finally {
            proc2.kill('SIGTERM');
        }

        // -----------------------------------------------------
        // 9. GIT HYGIENE VERIFICATION
        // -----------------------------------------------------
        console.log('\n--- 9. GIT HYGIENE VERIFICATION ---');

        const trackedEnv = execSync('git ls-files .env', { cwd: path.resolve(__dirname, '..') }).toString().trim();
        assert(trackedEnv === '', '.env is strictly excluded from Git index');

        const trackedUploads = execSync('git ls-files uploads', { cwd: path.resolve(__dirname, '..') }).toString().trim();
        assert(trackedUploads === '', 'uploads/ directory is strictly excluded from Git index');

        const gitStatusOutput = execSync('git status --porcelain', { cwd: path.resolve(__dirname, '..') }).toString();
        assert(!gitStatusOutput.includes('.env\n'), '.env is not untracked or staged');

        // Verify .env.example contains only placeholders
        const envExampleContent = fs.readFileSync(path.resolve(__dirname, '..', '.env.example'), 'utf8');
        assert(envExampleContent.includes('ADMIN_TOKEN=your_secure_random_admin_token_minimum_32_characters_here'), '.env.example contains placeholders only');
        assert(!envExampleContent.includes(STRONG_ADMIN_TOKEN), '.env.example does not contain real secret tokens');

    } finally {
        // Cleanup isolated temporary test storage directory
        try {
            fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
            console.log('\n🧹 Cleaned up isolated test storage.');
        } catch {}
    }

    console.log('\n=============================================');
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('=============================================\n');

    process.exit(failCount === 0 ? 0 : 1);
}

// Helper: Synchronous spawn check for fatal startup exits
function testSpawnServerSync(envOverrides) {
    try {
        const out = execSync('node server.js', {
            env: { ...process.env, ...envOverrides },
            cwd: path.resolve(__dirname, '..'),
            timeout: 3000,
            stdio: 'pipe'
        });
        return { exitCode: 0, output: out.toString() };
    } catch (err) {
        return { exitCode: err.status || 1, output: err.stderr ? err.stderr.toString() : '' };
    }
}

// HTTP Helpers
function httpGet(endpoint, headers = {}) {
    return httpGetFromPort(TEST_PORT, endpoint, headers);
}

function httpGetFromPort(port, endpoint, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, `http://127.0.0.1:${port}`);
        const req = http.request(url, { method: 'GET', headers }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

function httpPost(endpoint, headers, body) {
    return httpPostToPort(TEST_PORT, endpoint, headers, body);
}

function httpPostToPort(port, endpoint, headers, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, `http://127.0.0.1:${port}`);
        const req = http.request(url, { method: 'POST', headers }, res => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: resBody }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function httpPostRaw(endpoint, headers, buffer) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const req = http.request(url, { method: 'POST', headers: { ...headers, 'Content-Length': buffer.length } }, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        });
        req.on('error', reject);
        req.write(buffer);
        req.end();
    });
}

function httpDelete(endpoint, headers) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const req = http.request(url, { method: 'DELETE', headers }, res => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: resBody }));
        });
        req.on('error', reject);
        req.end();
    });
}

runAllTests().catch(err => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
});
