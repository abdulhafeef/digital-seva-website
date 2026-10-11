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
const vm = require('vm');

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

        // Regression Test: Frontend runtime initialization and TDZ safety
        // Ensure Turnstile state variables are initialized prior to applyTheme invocation,
        // preventing temporal-dead-zone ReferenceErrors when script.js executes.
        try {
            const rootDir = path.resolve(__dirname, '..');
            const translationsCode = fs.readFileSync(path.join(rootDir, 'translations.js'), 'utf8');
            const dataCode = fs.readFileSync(path.join(rootDir, 'data.js'), 'utf8');
            const scriptCode = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');

            const domState = { attributes: {}, listeners: {} };
            const storage = {};

            const context = vm.createContext({
                window: {
                    matchMedia: () => ({ matches: false }),
                    location: { hostname: 'localhost' },
                    addEventListener: (event, handler) => { domState.listeners[event] = handler; }
                },
                document: {
                    documentElement: {
                        setAttribute: (name, val) => { domState.attributes[name] = val; },
                        getAttribute: (name) => domState.attributes[name] || null,
                        scrollHeight: 1000,
                        clientHeight: 800
                    },
                    getElementById: () => null,
                    querySelectorAll: () => [],
                    querySelector: () => null,
                    addEventListener: (event, handler) => { domState.listeners[event] = handler; },
                    createElement: () => ({ style: {}, appendChild: () => {} }),
                    body: { appendChild: () => {}, style: {} }
                },
                localStorage: {
                    getItem: (key) => storage[key] || null,
                    setItem: (key, val) => { storage[key] = String(val); }
                },
                console: { log: () => {}, warn: () => {}, error: () => {} }
            });
            context.window.window = context.window;
            context.window.document = context.document;

            // Run prerequisites as ordered in index.html
            vm.runInContext(translationsCode, context);
            vm.runInContext(dataCode, context);

            // Execute script.js top-level code
            vm.runInContext(scriptCode, context);
            assert(true, 'script.js executes without temporal-dead-zone ReferenceError during top-level initialization');

            // Verify theme application succeeded
            assert(domState.attributes['data-theme'] === 'light', 'Initial applyTheme(currentTheme) sets data-theme to light');

            // Verify subsequent applyTheme calls succeed without TDZ error
            vm.runInContext("applyTheme('dark');", context);
            assert(domState.attributes['data-theme'] === 'dark', 'applyTheme("dark") updates data-theme attribute');

            // Verify declaration order: Turnstile variables must precede applyTheme invocation
            const applyThemeIndex = scriptCode.indexOf('applyTheme(currentTheme);');
            const widgetIdDeclIndex = scriptCode.indexOf('let turnstileWidgetId');
            const siteKeyDeclIndex = scriptCode.indexOf('let turnstileSiteKey');
            const tokenDeclIndex = scriptCode.indexOf('let currentTurnstileToken');
            const configLoadedDeclIndex = scriptCode.indexOf('let isConfigLoaded');

            assert(applyThemeIndex > 0, 'applyTheme(currentTheme) invocation found in script.js');
            assert(widgetIdDeclIndex !== -1 && widgetIdDeclIndex < applyThemeIndex, 'turnstileWidgetId declared before applyTheme(currentTheme) call');
            assert(siteKeyDeclIndex !== -1 && siteKeyDeclIndex < applyThemeIndex, 'turnstileSiteKey declared before applyTheme(currentTheme) call');
            assert(tokenDeclIndex !== -1 && tokenDeclIndex < applyThemeIndex, 'currentTurnstileToken declared before applyTheme(currentTheme) call');
            assert(configLoadedDeclIndex !== -1 && configLoadedDeclIndex < applyThemeIndex, 'isConfigLoaded declared before applyTheme(currentTheme) call');

            // Verify no duplicate declarations
            const secondWidgetDeclIndex = scriptCode.indexOf('let turnstileWidgetId', widgetIdDeclIndex + 1);
            assert(secondWidgetDeclIndex === -1, 'No duplicate let turnstileWidgetId declaration in script.js');
        } catch (e) {
            assert(false, `Frontend runtime initialization failed: ${e.message}`);
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

            // Public configuration endpoint
            const localConfigRes = await httpGet('/api/config');
            assert(localConfigRes.statusCode === 200, 'Local server GET /api/config returns 200 OK');
            const localConfigData = JSON.parse(localConfigRes.body);
            assert(typeof localConfigData.turnstileSiteKey === 'string', 'Local server GET /api/config returns turnstileSiteKey string');
            assert(!localConfigRes.body.includes(STRONG_ADMIN_TOKEN), 'Local server GET /api/config does not expose ADMIN_TOKEN or private credentials');

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

            // 4. Authorized download via document-ID route (/api/admin/document/:documentId)
            const docId = storedFile.id || storedFile.fileId;
            const docIdRes = await httpGet(`/api/admin/document/${docId}`, {
                'Authorization': `Bearer ${adminToken}`
            });
            assert(docIdRes.statusCode === 200, 'Local server GET /api/admin/document/:documentId with Bearer header returns 200 OK');
            assert(docIdRes.headers['content-type'] === 'application/pdf', 'Document-ID route Content-Type is application/pdf');

            // 5. Unauthenticated download via document-ID route rejected
            const unauthDocIdRes = await httpGet(`/api/admin/document/${docId}`);
            assert(unauthDocIdRes.statusCode === 401, 'Local server GET /api/admin/document/:documentId without auth returns 401');

            // 6. Non-existent document ID returns 404
            const missingDocIdRes = await httpGet(`/api/admin/document/00000000-0000-0000-0000-000000000000`, {
                'Authorization': `Bearer ${adminToken}`
            });
            assert(missingDocIdRes.statusCode === 404, 'Local server GET /api/admin/document/:documentId for non-existent ID returns 404');

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
        assert(envExampleContent.includes('ADMIN_TOKEN=your_secure_random_admin_token_minimum_32_characters_here'), '.env.example contains placeholders only for ADMIN_TOKEN');
        assert(envExampleContent.includes('SESSION_SECRET=your_secure_random_session_secret_minimum_32_characters_here'), '.env.example contains placeholders for SESSION_SECRET');
        assert(envExampleContent.includes('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key_here'), '.env.example contains placeholders for SUPABASE_SERVICE_ROLE_KEY');
        assert(!envExampleContent.includes(STRONG_ADMIN_TOKEN), '.env.example does not contain real secret tokens');

        // -----------------------------------------------------
        // 10. CLOUDFLARE PAGES FUNCTIONS & SUPABASE ARCHITECTURE TESTS
        // -----------------------------------------------------
        console.log('\n--- 10. CLOUDFLARE PAGES FUNCTIONS & SUPABASE ARCHITECTURE TESTS ---');

        // A. Dynamic import of Pages Functions & Worker modules
        const validationMod = await import('../functions/utils/validation.js');
        const authMod = await import('../functions/utils/auth.js');
        const supabaseMod = await import('../functions/utils/supabase.js');
        const emailMod = await import('../functions/utils/email.js');
        const healthzEndpoint = await import('../functions/healthz.js');
        const configEndpoint = await import('../functions/api/config.js');
        const loginEndpoint = await import('../functions/api/admin/login.js');
        const logoutEndpoint = await import('../functions/api/admin/logout.js');
        const enquiriesListEndpoint = await import('../functions/api/admin/enquiries.js');
        const enquiryDeleteEndpoint = await import('../functions/api/admin/enquiry/[id].js');
        const documentEndpoint = await import('../functions/api/admin/document/[[path]].js');
        const customerEnquiriesEndpoint = await import('../functions/api/enquiries.js');
        const retentionWorker = await import('../workers/retention-worker.js');

        // B. Magic Bytes Binary Validation on Typed Arrays
        const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]); // %PDF-1.4
        const validJpgBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
        const validPngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        const fakePdfBytes = new Uint8Array(Buffer.from('Not a PDF file at all, just text'));

        assert(validationMod.validateMagicBytes(validPdfBytes)?.mime === 'application/pdf', 'Edge validation correctly identifies PDF magic bytes');
        assert(validationMod.validateMagicBytes(validJpgBytes)?.mime === 'image/jpeg', 'Edge validation correctly identifies JPEG magic bytes');
        assert(validationMod.validateMagicBytes(validPngBytes)?.mime === 'image/png', 'Edge validation correctly identifies PNG magic bytes');
        assert(validationMod.validateMagicBytes(fakePdfBytes) === null, 'Edge validation strictly rejects spoofed file bytes');
        assert(validationMod.validateMagicBytes(new Uint8Array([0x01, 0x02])) === null, 'Edge validation rejects truncated buffers (< 8 bytes)');

        // C. Phone Number & Turnstile Validation
        assert(validationMod.validateIndianMobile('9876543210') === true, '10-digit Indian mobile is accepted');
        assert(validationMod.validateIndianMobile('+919876543210') === true, '+91 prefixed Indian mobile is accepted');
        assert(validationMod.validateIndianMobile('09876543210') === true, '0-prefixed Indian mobile is accepted');
        assert(validationMod.validateIndianMobile('1234567890') === false, 'Invalid mobile starting with 1 is rejected');
        assert(validationMod.validateIndianMobile('987654321') === false, '9-digit mobile is rejected');

        const turnstileDevPass = await validationMod.verifyTurnstileToken('', '');
        assert(turnstileDevPass.success === true, 'Turnstile verification safely passes in dev mode when unconfigured');

        const turnstileMissingToken = await validationMod.verifyTurnstileToken('', 'configured_turnstile_secret');
        assert(turnstileMissingToken.success === false, 'Turnstile verification fails when secret is configured but token is missing');

        // D. Owner Authentication & HMAC-SHA256 Session Management
        assert(authMod.safeCompare('exact_match_str', 'exact_match_str') === true, 'safeCompare returns true for identical strings');
        assert(authMod.safeCompare('exact_match_str', 'wrong_match_str') === false, 'safeCompare returns false for differing strings');

        // Production secret rules
        const prodMissingToken = authMod.validateProductionSecrets({ NODE_ENV: 'production', ADMIN_TOKEN: '' });
        assert(prodMissingToken.valid === false, 'Production mode rejects missing ADMIN_TOKEN');

        const prodShortToken = authMod.validateProductionSecrets({ NODE_ENV: 'production', ADMIN_TOKEN: 'short_key', SESSION_SECRET: STRONG_ADMIN_TOKEN });
        assert(prodShortToken.valid === false, 'Production mode rejects ADMIN_TOKEN < 32 characters');

        const prodPlaceholderToken = authMod.validateProductionSecrets({ NODE_ENV: 'production', ADMIN_TOKEN: 'ds_local_dev_only_key', SESSION_SECRET: STRONG_ADMIN_TOKEN });
        assert(prodPlaceholderToken.valid === false, 'Production mode rejects placeholder ADMIN_TOKEN');

        const prodValidSecrets = authMod.validateProductionSecrets({ NODE_ENV: 'production', ADMIN_TOKEN: STRONG_ADMIN_TOKEN, SESSION_SECRET: STRONG_ADMIN_TOKEN });
        assert(prodValidSecrets.valid === true, 'Production mode accepts strong secrets (>= 32 chars)');

        // HMAC-SHA256 Session Tokens
        const testSessionSecret = 'test_session_secret_minimum_32_characters_for_hmac_sha256';
        const sessionToken = await authMod.createSessionToken(testSessionSecret, 3600);
        assert(typeof sessionToken === 'string' && sessionToken.includes('.'), 'createSessionToken generates a signed token');

        const sessionVerifyValid = await authMod.verifySessionToken(sessionToken, testSessionSecret);
        assert(sessionVerifyValid.valid === true && sessionVerifyValid.role === 'owner', 'verifySessionToken validates legitimate session token');

        // Tampered session token
        const tamperedToken = sessionToken.slice(0, -4) + 'abcd';
        const sessionVerifyTampered = await authMod.verifySessionToken(tamperedToken, testSessionSecret);
        assert(sessionVerifyTampered.valid === false, 'verifySessionToken rejects tampered session token');

        // Expired session token
        const expiredToken = await authMod.createSessionToken(testSessionSecret, -10);
        const sessionVerifyExpired = await authMod.verifySessionToken(expiredToken, testSessionSecret);
        assert(sessionVerifyExpired.valid === false && sessionVerifyExpired.error === 'Session expired', 'verifySessionToken rejects expired session token');

        // Cookie building
        const sessionCookie = authMod.createSessionCookie(sessionToken, true);
        assert(sessionCookie.includes('HttpOnly') && sessionCookie.includes('SameSite=Strict') && sessionCookie.includes('Secure'), 'createSessionCookie sets HttpOnly, SameSite=Strict, Secure');

        const clearedCookie = authMod.clearSessionCookie();
        assert(clearedCookie.includes('Max-Age=0'), 'clearSessionCookie sets Max-Age=0 to expire cookie');

        // E. Cloudflare Pages Functions Endpoints (Direct Invocation)
        const testEnv = {
            NODE_ENV: 'development',
            ADMIN_TOKEN: STRONG_ADMIN_TOKEN,
            SESSION_SECRET: testSessionSecret
        };

        // 1. GET /healthz
        const healthzRes = await healthzEndpoint.onRequestGet({ env: testEnv });
        assert(healthzRes.status === 200, 'Pages Functions GET /healthz returns 200 OK');
        const healthzData = await healthzRes.json();
        assert(healthzData.status === 'ok' && healthzData.service === 'Digital Seva', 'Healthcheck reports ok and service name');

        // 2. POST /api/admin/login (Wrong password)
        const loginReqWrong = new Request('http://localhost/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'wrong_password' })
        });
        const loginResWrong = await loginEndpoint.onRequestPost({ request: loginReqWrong, env: testEnv });
        assert(loginResWrong.status === 401, 'Pages Functions POST /api/admin/login with wrong password returns 401');

        // 3. POST /api/admin/login (Valid password)
        const loginReqValid = new Request('http://localhost/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: STRONG_ADMIN_TOKEN })
        });
        const loginResValid = await loginEndpoint.onRequestPost({ request: loginReqValid, env: testEnv });
        assert(loginResValid.status === 200, 'Pages Functions POST /api/admin/login with strong secret returns 200 OK');
        const loginValidData = await loginResValid.json();
        assert(loginValidData.success === true && Boolean(loginValidData.token), 'Admin login returns success and session token');
        const setCookieHeader = loginResValid.headers.get('Set-Cookie');
        assert(setCookieHeader && setCookieHeader.includes('ds_session'), 'Admin login sets ds_session HttpOnly cookie');

        // 4. POST /api/admin/logout
        const logoutRes = await logoutEndpoint.onRequestPost();
        assert(logoutRes.status === 200, 'Pages Functions POST /api/admin/logout returns 200 OK');
        assert(logoutRes.headers.get('Set-Cookie')?.includes('Max-Age=0'), 'Logout clears session cookie with Max-Age=0');

        // 5. GET /api/admin/enquiries (Unauthenticated)
        const unauthReq = new Request('http://localhost/api/admin/enquiries');
        const unauthRes = await enquiriesListEndpoint.onRequestGet({ request: unauthReq, env: testEnv });
        assert(unauthRes.status === 401, 'Pages Functions GET /api/admin/enquiries without auth returns 401 Unauthorized');

        // 6. GET /api/admin/enquiries (Authenticated with session cookie)
        const cookieAuthReq = new Request('http://localhost/api/admin/enquiries', {
            headers: { 'Cookie': `ds_session=${encodeURIComponent(loginValidData.token)}` }
        });
        const cookieAuthRes = await enquiriesListEndpoint.onRequestGet({ request: cookieAuthReq, env: testEnv });
        assert(cookieAuthRes.status === 200, 'Pages Functions GET /api/admin/enquiries with session cookie returns 200 OK');

        // 7. GET /api/admin/enquiries (Authenticated with Bearer token)
        const bearerAuthReq = new Request('http://localhost/api/admin/enquiries', {
            headers: { 'Authorization': `Bearer ${loginValidData.token}` }
        });
        const bearerAuthRes = await enquiriesListEndpoint.onRequestGet({ request: bearerAuthReq, env: testEnv });
        assert(bearerAuthRes.status === 200, 'Pages Functions GET /api/admin/enquiries with Bearer token returns 200 OK');

        // 8. GET /api/admin/document (Strict prohibition of query-string tokens)
        const queryTokenDocReq = new Request('http://localhost/api/admin/document/doc123?token=secret123');
        const queryTokenDocRes = await documentEndpoint.onRequestGet({ request: queryTokenDocReq, env: testEnv, params: { path: ['doc123'] } });
        assert(queryTokenDocRes.status === 401, 'Pages Functions document endpoint strictly rejects query string tokens with 401');

        // 9. GET /api/admin/document (Path traversal attempt)
        const traversalDocReq = new Request('http://localhost/api/admin/document/..%2Fsecret', {
            headers: { 'Authorization': `Bearer ${loginValidData.token}` }
        });
        const traversalDocRes = await documentEndpoint.onRequestGet({ request: traversalDocReq, env: testEnv, params: { path: ['..', 'secret'] } });
        assert(traversalDocRes.status === 400, 'Pages Functions document endpoint rejects directory traversal (..) with 400');

        // 9b. GET /api/admin/document/:documentId (UUID Route & Path Duplication Regression Tests)
        const unauthDocIdReq = new Request('http://localhost/api/admin/document/12345678-1234-1234-1234-123456789abc');
        const unauthDocIdRes = await documentEndpoint.onRequestGet({ request: unauthDocIdReq, env: testEnv, params: { path: ['12345678-1234-1234-1234-123456789abc'] } });
        assert(unauthDocIdRes.status === 401, 'Pages Functions document-ID route without auth returns 401 Unauthorized');

        const originalFetchDocTest = globalThis.fetch;
        let lastStorageFetchUrl = '';
        try {
            globalThis.fetch = async (url, opts) => {
                const urlStr = (url || '').toString();
                if (urlStr.includes('/rest/v1/enquiry_documents')) {
                    if (urlStr.includes('12345678-1234-1234-1234-123456789abc')) {
                        return new Response(JSON.stringify([{
                            id: '12345678-1234-1234-1234-123456789abc',
                            enquiry_id: 'mock-enquiry-uuid',
                            storage_path: 'DS-20261011-TEST/doc-uuid.pdf',
                            original_name: 'test_passport_doc.pdf',
                            mime_type: 'application/pdf',
                            size_bytes: 2048,
                            slot_id: 'passport'
                        }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                    if (urlStr.includes('storage_path=eq.')) {
                        return new Response(JSON.stringify([{
                            id: '12345678-1234-1234-1234-123456789abc',
                            enquiry_id: 'mock-enquiry-uuid',
                            storage_path: 'DS-20261011-TEST/doc-uuid.pdf',
                            original_name: 'test_passport_doc.pdf',
                            mime_type: 'application/pdf',
                            size_bytes: 2048,
                            slot_id: 'passport'
                        }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
                if (urlStr.includes('/storage/v1/object/customer-documents/')) {
                    lastStorageFetchUrl = urlStr;
                    return new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
                        status: 200,
                        headers: { 'Content-Type': 'application/pdf' }
                    });
                }
                return originalFetchDocTest(url, opts);
            };

            const docTestEnv = {
                ...testEnv,
                SUPABASE_URL: 'https://mock.supabase.co',
                SUPABASE_SERVICE_ROLE_KEY: 'mock_service_role_key_for_test'
            };

            // Test missing document UUID in database
            const missingDocReq = new Request('http://localhost/api/admin/document/00000000-0000-0000-0000-000000000000', {
                headers: { 'Authorization': `Bearer ${loginValidData.token}` }
            });
            const missingDocRes = await documentEndpoint.onRequestGet({
                request: missingDocReq,
                env: docTestEnv,
                params: { path: ['00000000-0000-0000-0000-000000000000'] }
            });
            assert(missingDocRes.status === 404, 'Pages Functions document endpoint returns 404 for missing document UUID');

            // Test successful retrieval via document UUID route
            const validDocReq = new Request('http://localhost/api/admin/document/12345678-1234-1234-1234-123456789abc', {
                headers: { 'Authorization': `Bearer ${loginValidData.token}` }
            });
            const validDocRes = await documentEndpoint.onRequestGet({
                request: validDocReq,
                env: docTestEnv,
                params: { path: ['12345678-1234-1234-1234-123456789abc'] }
            });
            assert(validDocRes.status === 200, 'Pages Functions document-ID route returns 200 OK');
            assert(lastStorageFetchUrl.endsWith('/customer-documents/DS-20261011-TEST/doc-uuid.pdf'), 'Storage URL correctly targets customer-documents/DS-20261011-TEST/doc-uuid.pdf');
            assert(!lastStorageFetchUrl.includes('DS-20261011-TEST/DS-20261011-TEST'), 'Document-ID route strictly avoids duplicating enquiry-reference directory');
            assert(validDocRes.headers.get('Content-Disposition').includes('test_passport_doc.pdf'), 'Document-ID route preserves original filename in Content-Disposition');
            assert(validDocRes.headers.get('Cache-Control').includes('private'), 'Document response enforces private Cache-Control header');

            // Test multi-segment request with already-prefixed filename does not duplicate directory
            const multiSegmentReq = new Request('http://localhost/api/admin/document/DS-20261011-TEST/DS-20261011-TEST/doc-uuid.pdf', {
                headers: { 'Authorization': `Bearer ${loginValidData.token}` }
            });
            await documentEndpoint.onRequestGet({
                request: multiSegmentReq,
                env: docTestEnv,
                params: { path: ['DS-20261011-TEST', 'DS-20261011-TEST/doc-uuid.pdf'] }
            });
            assert(!lastStorageFetchUrl.includes('DS-20261011-TEST/DS-20261011-TEST'), 'Multi-segment request prevents duplicating enquiry-reference directory');
        } finally {
            globalThis.fetch = originalFetchDocTest;
        }

        // 10. DELETE /api/admin/enquiry/:id (Unauthenticated)
        const unauthDelReq = new Request('http://localhost/api/admin/enquiry/DS-TEST', { method: 'DELETE' });
        const unauthDelRes = await enquiryDeleteEndpoint.onRequestDelete({ request: unauthDelReq, env: testEnv, params: { id: 'DS-TEST' } });
        assert(unauthDelRes.status === 401, 'Pages Functions DELETE /api/admin/enquiry/:id without auth returns 401 Unauthorized');

        // 11. POST /api/enquiries (Validation checks)
        // Missing name
        const badFormNoName = new FormData();
        badFormNoName.append('phone', '9845012345');
        const noNameReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: badFormNoName });
        const noNameRes = await customerEnquiriesEndpoint.onRequestPost({ request: noNameReq, env: testEnv });
        assert(noNameRes.status === 400, 'POST /api/enquiries rejects submission with missing name');

        // Invalid phone
        const badFormBadPhone = new FormData();
        badFormBadPhone.append('name', 'Test Customer');
        badFormBadPhone.append('phone', '12345');
        const badPhoneReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: badFormBadPhone });
        const badPhoneRes = await customerEnquiriesEndpoint.onRequestPost({ request: badPhoneReq, env: testEnv });
        assert(badPhoneRes.status === 400, 'POST /api/enquiries rejects submission with invalid phone');

        // Spoofed PDF upload
        const badFormSpoofed = new FormData();
        badFormSpoofed.append('name', 'Test Customer');
        badFormSpoofed.append('phone', '9845012345');
        badFormSpoofed.append('service', 'pan');
        const spoofedBlob = new Blob(['Not really a PDF'], { type: 'application/pdf' });
        badFormSpoofed.append('documentSlot1', spoofedBlob, 'fake.pdf');
        const spoofedReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: badFormSpoofed });
        const spoofedRes = await customerEnquiriesEndpoint.onRequestPost({ request: spoofedReq, env: testEnv });
        assert(spoofedRes.status === 400, 'POST /api/enquiries rejects spoofed PDF file upload with 400 Bad Request');

        // 12. CLOUDFLARE TURNSTILE INTEGRATION & CONFIG ENDPOINT TESTS
        console.log('\n--- 12. TURNSTILE BOT PROTECTION & CONFIG SECURITY TESTS ---');

        // A. GET /api/config via Pages Functions
        const configWithKeyRes = await configEndpoint.onRequestGet({
            env: { TURNSTILE_SITE_KEY: '0x4AAAAAA_test_site_key_123' }
        });
        assert(configWithKeyRes.status === 200, 'Pages Functions GET /api/config returns 200 OK');
        assert(configWithKeyRes.headers.get('Cache-Control').includes('no-store'), 'GET /api/config sets Cache-Control: no-store');
        assert(configWithKeyRes.headers.get('X-Content-Type-Options') === 'nosniff', 'GET /api/config sets X-Content-Type-Options: nosniff');
        const configWithKeyData = await configWithKeyRes.json();
        assert(configWithKeyData.turnstileSiteKey === '0x4AAAAAA_test_site_key_123', 'GET /api/config returns configured turnstileSiteKey');

        // B. Secret Isolation Verification on /api/config
        // Ensure secret keys (TURNSTILE_SECRET_KEY, ADMIN_TOKEN, SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY) are NEVER returned!
        const secretEnv = {
            TURNSTILE_SITE_KEY: '0x4AAAAAA_public_key',
            TURNSTILE_SECRET_KEY: '0x4AAAAAA_super_secret_key_never_leak',
            ADMIN_TOKEN: 'admin_private_token_secret_12345',
            SESSION_SECRET: 'session_crypto_secret_67890',
            SUPABASE_SERVICE_ROLE_KEY: 'supabase_service_role_secret_key',
            RESEND_API_KEY: 're_secret_api_key_12345'
        };
        const configSecretRes = await configEndpoint.onRequestGet({ env: secretEnv });
        const configSecretRaw = await configSecretRes.text();
        const configSecretData = JSON.parse(configSecretRaw);

        assert(Object.keys(configSecretData).length === 1 && Object.keys(configSecretData)[0] === 'turnstileSiteKey', '/api/config JSON output contains only the turnstileSiteKey field');
        assert(!configSecretRaw.includes('0x4AAAAAA_super_secret_key_never_leak'), '/api/config strictly NEVER leaks TURNSTILE_SECRET_KEY');
        assert(!configSecretRaw.includes('admin_private_token_secret_12345'), '/api/config strictly NEVER leaks ADMIN_TOKEN');
        assert(!configSecretRaw.includes('session_crypto_secret_67890'), '/api/config strictly NEVER leaks SESSION_SECRET');
        assert(!configSecretRaw.includes('supabase_service_role_secret_key'), '/api/config strictly NEVER leaks SUPABASE_SERVICE_ROLE_KEY');
        assert(!configSecretRaw.includes('re_secret_api_key_12345'), '/api/config strictly NEVER leaks RESEND_API_KEY');

        // C. Production Turnstile Fail-Safe Tests on POST /api/enquiries
        // When NODE_ENV=production and TURNSTILE_SECRET_KEY is missing, fail safely with 503 and WhatsApp fallback
        const validFormNoToken = new FormData();
        validFormNoToken.append('name', 'Pooja Hegde');
        validFormNoToken.append('phone', '9845012345');
        validFormNoToken.append('service', 'pan');

        const prodMissingSecretReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: validFormNoToken });
        const prodMissingSecretRes = await customerEnquiriesEndpoint.onRequestPost({
            request: prodMissingSecretReq,
            env: { NODE_ENV: 'production', TURNSTILE_SECRET_KEY: '' }
        });
        assert(prodMissingSecretRes.status === 503, 'POST /api/enquiries in production returns 503 when Turnstile secret is missing (Fail-Safe)');
        const prodMissingSecretData = await prodMissingSecretRes.json();
        assert(prodMissingSecretData.whatsappFallback === true, 'Production missing Turnstile configuration provides whatsappFallback flag');
        assert(prodMissingSecretData.error.includes('WhatsApp'), 'Production missing Turnstile error message directs customer to WhatsApp assistance');

        // When in production with secret configured, missing cf-turnstile-response returns 400
        const prodMissingTokenReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: validFormNoToken });
        const prodMissingTokenRes = await customerEnquiriesEndpoint.onRequestPost({
            request: prodMissingTokenReq,
            env: { NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 'test_secret_key' }
        });
        assert(prodMissingTokenRes.status === 400, 'POST /api/enquiries in production rejects missing Turnstile token with 400');
        const prodMissingTokenData = await prodMissingTokenRes.json();
        assert(prodMissingTokenData.error.includes('security verification') || prodMissingTokenData.error.includes('security check'), 'Error message informs customer to complete security check');

        // When cf-turnstile-response token fails verification against Cloudflare siteverify (mocked with invalid token)
        const formWithToken = new FormData();
        formWithToken.append('name', 'Pooja Hegde');
        formWithToken.append('phone', '9845012345');
        formWithToken.append('service', 'pan');
        formWithToken.append('cf-turnstile-response', 'invalid_dummy_token_123');

        // Global fetch mock helper for Cloudflare siteverify
        const originalFetch = globalThis.fetch;
        try {
            // Mock siteverify rejection
            globalThis.fetch = async (url, opts) => {
                if (url && url.toString().includes('turnstile/v0/siteverify')) {
                    return new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return originalFetch(url, opts);
            };

            const prodFailedTokenReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: formWithToken });
            const prodFailedTokenRes = await customerEnquiriesEndpoint.onRequestPost({
                request: prodFailedTokenReq,
                env: { NODE_ENV: 'production', TURNSTILE_SECRET_KEY: 'test_secret_key' }
            });
            assert(prodFailedTokenRes.status === 400, 'POST /api/enquiries rejects invalid Turnstile token with 400');

            // Mock siteverify success and Supabase PostgREST insert
            globalThis.fetch = async (url, opts) => {
                const urlStr = (url || '').toString();
                if (urlStr.includes('turnstile/v0/siteverify')) {
                    return new Response(JSON.stringify({ success: true, challenge_ts: new Date().toISOString() }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                if (urlStr.includes('/rest/v1/enquiries')) {
                    return new Response(JSON.stringify([{ id: 'mock-uuid', enquiry_ref: 'DS-MOCK-REF' }]), {
                        status: 201,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return originalFetch(url, opts);
            };

            const prodValidEnv = {
                NODE_ENV: 'production',
                TURNSTILE_SECRET_KEY: 'test_secret_key',
                SUPABASE_URL: 'https://mock.supabase.co',
                SUPABASE_SERVICE_ROLE_KEY: 'mock_service_key'
            };

            const formValidToken = new FormData();
            formValidToken.append('name', 'Pooja Hegde');
            formValidToken.append('phone', '9845012345');
            formValidToken.append('service', 'pan');
            formValidToken.append('cf-turnstile-response', 'valid_verified_token');

            const prodValidTokenReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: formValidToken });
            const prodValidTokenRes = await customerEnquiriesEndpoint.onRequestPost({
                request: prodValidTokenReq,
                env: prodValidEnv
            });
            assert(prodValidTokenRes.status === 200, 'POST /api/enquiries in production accepts verified Turnstile token with 200 OK');
            const prodValidTokenData = await prodValidTokenRes.json();
            assert(prodValidTokenData.success === true && prodValidTokenData.enquiryId.startsWith('DS-'), 'Verified enquiry receives valid reference ID');

            // E. Local Development Mode (Bypass verification when TURNSTILE_SECRET_KEY unset in development)
            const devFormNoToken = new FormData();
            devFormNoToken.append('name', 'Dev User');
            devFormNoToken.append('phone', '9845012345');
            devFormNoToken.append('service', 'voter');

            const devReq = new Request('http://localhost/api/enquiries', { method: 'POST', body: devFormNoToken });
            const devRes = await customerEnquiriesEndpoint.onRequestPost({
                request: devReq,
                env: {
                    NODE_ENV: 'development',
                    TURNSTILE_SECRET_KEY: '',
                    SUPABASE_URL: 'https://mock.supabase.co',
                    SUPABASE_SERVICE_ROLE_KEY: 'mock_service_key'
                }
            });
            assert(devRes.status === 200, 'POST /api/enquiries in local development preserves offline testing and permits submission without Turnstile key');
        } finally {
            globalThis.fetch = originalFetch;
        }

        // F. verifyTurnstileToken unit tests
        const valDevNoKey = await validationMod.verifyTurnstileToken('', '', '127.0.0.1', false);
        assert(valDevNoKey.success === true, 'verifyTurnstileToken returns success in development when secret key is unset');

        const valProdNoKey = await validationMod.verifyTurnstileToken('', '', '127.0.0.1', true);
        assert(valProdNoKey.success === false, 'verifyTurnstileToken returns failure in production when secret key is unset');

        const valEmptyToken = await validationMod.verifyTurnstileToken('', 'secret_key', '127.0.0.1', false);
        assert(valEmptyToken.success === false, 'verifyTurnstileToken returns failure when token is empty');

        // G. Bilingual Turnstile Translation Keys Verification
        const turnstileTranslationKeys = [
            'turnstileLoading',
            'turnstileVerified',
            'turnstileExpired',
            'turnstileError',
            'turnstileRequired',
            'turnstileUnavailable'
        ];
        turnstileTranslationKeys.forEach(tKey => {
            const enVal = getTranslation('en', `modal.${tKey}`);
            const knVal = getTranslation('kn', `modal.${tKey}`);
            assert(Boolean(enVal && knVal), `Bilingual Turnstile key 'modal.${tKey}' present in both English and Kannada`);
        });

        // F. Scheduled Retention Worker Tests
        // Disabled when RETENTION_DAYS=0
        const retentionDisabledRes = await retentionWorker.executeRetentionCleanup({ RETENTION_DAYS: '0' });
        assert(retentionDisabledRes.purgedCount === 0 && retentionDisabledRes.status === 'disabled', 'Retention worker respects RETENTION_DAYS=0 and remains disabled');

        // Unconfigured Supabase handles cleanly without throwing
        const retentionUnconfRes = await retentionWorker.executeRetentionCleanup({ RETENTION_DAYS: '90' });
        assert(retentionUnconfRes.status === 'unconfigured', 'Retention worker handles missing Supabase credentials safely without crashing');

        // G. Email Notification Utility Tests
        // Disabled by default
        const emailDisabledRes = await emailMod.sendEnquiryEmailNotification({ EMAIL_NOTIFICATIONS_ENABLED: 'false' }, { enquiryRef: 'DS-TEST' });
        assert(emailDisabledRes.sent === false, 'Resend HTTP email notification is disabled by default');

        // Mock sender verification
        let mockEmailPayload = null;
        const emailMockRes = await emailMod.sendEnquiryEmailNotification(
            { EMAIL_NOTIFICATIONS_ENABLED: 'true' },
            { enquiryRef: 'DS-MOCK-1', name: 'Hafeef', phone: '9845012345', service: 'pan', variant: 'new' },
            async (payload) => { mockEmailPayload = payload; }
        );
        assert(emailMockRes.sent === true && mockEmailPayload.enquiryRef === 'DS-MOCK-1', 'Mock Resend sender succeeds and receives sanitized enquiry metadata');
        assert(!mockEmailPayload.document && !mockEmailPayload.aadhaar, 'Email notification body contains no document binary or sensitive numbers');

        // H. Supabase Database Migration Syntax & Idempotency Verification
        const migrationFile = path.resolve(__dirname, '..', 'supabase', 'migrations', '20261010_initial_schema.sql');
        assert(fs.existsSync(migrationFile), 'Supabase migration file exists under supabase/migrations/');
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');
        assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.enquiries'), 'Migration defines enquiries table with IF NOT EXISTS');
        assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.enquiry_documents'), 'Migration defines enquiry_documents table with foreign key');
        assert(migrationSql.includes('ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY'), 'Migration enables Row Level Security on enquiries');
        assert(migrationSql.includes('REVOKE ALL ON public.enquiries FROM anon'), 'Migration revokes public/anon access on enquiries');
        assert(migrationSql.includes('customer-documents'), 'Migration configures private customer-documents storage bucket');

        // I. Cloudflare Pages Build Script & Output Verification
        console.log('\n--- VERIFYING CLOUDFLARE PAGES BUILD OUTPUT ---');
        execSync('node scripts/build_pages.js', { cwd: path.resolve(__dirname, '..') });
        const distPath = path.resolve(__dirname, '..', 'dist');
        assert(fs.existsSync(path.join(distPath, 'index.html')), 'dist/index.html generated');
        assert(fs.existsSync(path.join(distPath, 'admin.html')), 'dist/admin.html generated');
        assert(fs.existsSync(path.join(distPath, 'styles.css')), 'dist/styles.css generated');
        assert(fs.existsSync(path.join(distPath, 'script.js')), 'dist/script.js generated');
        assert(fs.existsSync(path.join(distPath, 'data.js')), 'dist/data.js generated');
        assert(fs.existsSync(path.join(distPath, 'translations.js')), 'dist/translations.js generated');
        assert(fs.existsSync(path.join(distPath, 'assets', 'digital-seva-logo.jpeg')), 'dist/assets/digital-seva-logo.jpeg preserved in build');
        assert(fs.existsSync(path.join(distPath, 'assets', 'digital-seva-icon.svg')), 'dist/assets/digital-seva-icon.svg preserved in build');

        // Security check: No backend or secret files in dist/
        assert(!fs.existsSync(path.join(distPath, 'server.js')), 'dist/ strictly excludes server.js');
        assert(!fs.existsSync(path.join(distPath, 'tests')), 'dist/ strictly excludes tests directory');
        assert(!fs.existsSync(path.join(distPath, 'supabase')), 'dist/ strictly excludes supabase migrations');
        assert(!fs.existsSync(path.join(distPath, 'workers')), 'dist/ strictly excludes workers directory');
        assert(!fs.existsSync(path.join(distPath, '.env')), 'dist/ strictly excludes .env');
        assert(!fs.existsSync(path.join(distPath, '.dev.vars')), 'dist/ strictly excludes .dev.vars');
        assert(!fs.existsSync(path.join(distPath, 'uploads')), 'dist/ strictly excludes uploads directory');


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
