/**
 * Comprehensive Automated Test Suite for Digital Seva
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TEST_PORT = 8011;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Load data and translations
const data = require('../data.js');
const { translations, getTranslation } = require('../translations.js');

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

async function runTests() {
    console.log('\n--- 1. DATA & TRANSLATION INTEGRITY TESTS ---');

    // 1. Exactly 8 services
    assert(data.services && data.services.length === 8, 'Exactly 8 services configured in data.js');

    const expectedServices = ['pan', 'voter', 'aadhaar', 'passport', 'income', 'caste', 'scholarship', 'more'];
    const serviceIds = data.services.map(s => s.id);
    assert(
        expectedServices.every(id => serviceIds.includes(id)),
        `All 8 expected services present: ${expectedServices.join(', ')}`
    );

    // 2. Check bilingual dictionary coverage
    expectedServices.forEach(sId => {
        const enTitle = getTranslation('en', `services.items.${sId}.title`);
        const knTitle = getTranslation('kn', `services.items.${sId}.title`);
        assert(Boolean(enTitle && knTitle), `Service '${sId}' has both English and Kannada titles`);

        const enDesc = getTranslation('en', `services.items.${sId}.desc`);
        const knDesc = getTranslation('kn', `services.items.${sId}.desc`);
        assert(Boolean(enDesc && knDesc), `Service '${sId}' has both English and Kannada descriptions`);
    });

    // 3. Check checklists for all variants
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

    // 4. Verify specific requirements
    // PAN Alternative note
    assert(Boolean(getTranslation('en', 'notes.sslcAltPan')), 'PAN SSLC alternative note exists');
    // Voter ID Alternative note
    assert(Boolean(getTranslation('en', 'notes.sslcAltVoter')), 'Voter ID SSLC alternative note exists');
    // Caste Certificate Muslim applicant business scope note
    const casteNoteEn = getTranslation('en', 'notes.casteScopeNote');
    assert(casteNoteEn && casteNoteEn.includes('Muslim applicants'), 'Caste Certificate scope note specifies Muslim applicants as current business scope');
    // Aadhaar Address Correction MA form flag
    const maFlagEn = getTranslation('en', 'notes.maFormFlag');
    assert(maFlagEn && maFlagEn.includes('MA / Municipal-signed form'), 'Aadhaar Address Correction flags MA form for owner confirmation');

    console.log('\n--- 2. SERVER & API INTEGRATION TESTS ---');

    // Spawn server on TEST_PORT
    const serverProcess = spawn('node', ['server.js'], {
        env: {
            ...process.env,
            PORT: TEST_PORT.toString(),
            ADMIN_TOKEN: 'test_admin_secret_key_123'
        },
        cwd: path.resolve(__dirname, '..')
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
        // Test 1: Static index.html delivery
        const indexRes = await httpGet('/');
        assert(indexRes.statusCode === 200, 'GET / returns 200 OK');
        assert(indexRes.body.includes('DIGITAL SEVA'), 'GET / contains "DIGITAL SEVA"');
        assert(indexRes.body.includes('translations.js'), 'GET / links translations.js');

        // Test 2: Static asset delivery
        const iconRes = await httpGet('/assets/digital-seva-icon.svg');
        assert(iconRes.statusCode === 200, 'GET /assets/digital-seva-icon.svg returns 200 OK');

        // Test 3: Blocked private file access
        const uploadBlockRes = await httpGet('/uploads/enquiries.json');
        assert(uploadBlockRes.statusCode === 403, 'GET /uploads/enquiries.json is blocked with 403 Forbidden');

        // Test 4: Directory traversal protection
        const traversalRes = await httpGet('/../package.json');
        assert(traversalRes.statusCode === 403, 'Directory traversal /../package.json is blocked with 403');

        // Test 5: Customer Enquiry submission (JSON payload, no files)
        const enquiryRes = await httpPost('/api/enquiries', {
            'Content-Type': 'application/json'
        }, JSON.stringify({
            name: 'Praveen Gowda',
            phone: '9845012345',
            service: 'pan',
            variant: 'new',
            notes: 'Test automated submission without files',
            consent: 'true'
        }));
        assert(enquiryRes.statusCode === 200, 'POST /api/enquiries returns 200 OK');
        const enquiryJson = JSON.parse(enquiryRes.body);
        assert(enquiryJson.success === true && enquiryJson.enquiryId.startsWith('DS-'), 'POST /api/enquiries returns success and DS- ID');
        const createdEnquiryId = enquiryJson.enquiryId;

        // Test 6: Validation: Invalid phone number
        const invalidPhoneRes = await httpPost('/api/enquiries', {
            'Content-Type': 'application/json'
        }, JSON.stringify({
            name: 'Praveen Gowda',
            phone: '12345', // Invalid Indian phone
            service: 'pan',
            variant: 'new'
        }));
        assert(invalidPhoneRes.statusCode === 400, 'POST /api/enquiries with invalid phone returns 400 Bad Request');

        // Test 7: Multipart file upload with valid PDF magic bytes
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const pdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

        let multipartBody = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nAnita Devi\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n8660847792\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="service"\r\n\r\nvoter\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="variant"\r\n\r\nnew\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="aadhaar"; filename="aadhaar_test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
            pdfHeader,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const uploadRes = await httpPostRaw('/api/enquiries', {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        }, multipartBody);

        assert(uploadRes.statusCode === 200, 'POST /api/enquiries multipart with valid PDF returns 200 OK');
        const uploadJson = JSON.parse(uploadRes.body.toString('utf8'));
        assert(uploadJson.success === true && uploadJson.filesCount === 1, 'Upload confirmed with 1 file saved');
        const uploadEnquiryId = uploadJson.enquiryId;

        // Test 8: Magic bytes validation rejects fake PDF
        const fakePdfBody = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nTest User\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n8660847792\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="service"\r\n\r\npan\r\n`),
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="aadhaar"; filename="spoofed.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
            Buffer.from('THIS IS NOT A VALID PDF FILE BUFFER'),
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const fakeUploadRes = await httpPostRaw('/api/enquiries', {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        }, fakePdfBody);
        assert(fakeUploadRes.statusCode === 400, 'POST /api/enquiries rejects fake PDF magic bytes with 400 Bad Request');

        // Test 9: Admin Authentication
        const adminLoginFail = await httpPost('/api/admin/login', { 'Content-Type': 'application/json' }, JSON.stringify({ password: 'wrong' }));
        assert(adminLoginFail.statusCode === 401, 'POST /api/admin/login with wrong key returns 401 Unauthorized');

        const adminLoginSuccess = await httpPost('/api/admin/login', { 'Content-Type': 'application/json' }, JSON.stringify({ password: 'test_admin_secret_key_123' }));
        assert(adminLoginSuccess.statusCode === 200, 'POST /api/admin/login with valid key returns 200 OK');
        const token = JSON.parse(adminLoginSuccess.body).token;

        // Test 10: Authenticated Admin enquiries list
        const adminListRes = await httpGet('/api/admin/enquiries', {
            'Authorization': `Bearer ${token}`
        });
        assert(adminListRes.statusCode === 200, 'GET /api/admin/enquiries with Bearer token returns 200 OK');
        const adminListData = JSON.parse(adminListRes.body);
        assert(Array.isArray(adminListData.enquiries) && adminListData.enquiries.length >= 2, 'Admin receives enquiries array');

        // Test 11: Document retrieval via authenticated admin stream
        const uploadedEnquiry = adminListData.enquiries.find(e => e.enquiryId === uploadEnquiryId);
        assert(Boolean(uploadedEnquiry && uploadedEnquiry.files.length > 0), 'Found uploaded enquiry in admin list');

        if (uploadedEnquiry && uploadedEnquiry.files[0]) {
            const fileDoc = uploadedEnquiry.files[0];
            const docRes = await httpGet(`/api/admin/document/${uploadEnquiryId}/${fileDoc.storedFilename}`, {
                'Authorization': `Bearer ${token}`
            });
            assert(docRes.statusCode === 200, 'GET /api/admin/document/... returns 200 OK with authorized stream');
            assert(docRes.headers['content-type'] === 'application/pdf', 'Document Content-Type is application/pdf');
        }

        // Test 12: Delete enquiry
        const deleteRes = await httpDelete(`/api/admin/enquiry/${createdEnquiryId}`, {
            'Authorization': `Bearer ${token}`
        });
        assert(deleteRes.statusCode === 200, 'DELETE /api/admin/enquiry/... returns 200 OK');

    } finally {
        serverProcess.kill('SIGTERM');
    }

    console.log('\n=============================================');
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('=============================================\n');

    process.exit(failCount === 0 ? 0 : 1);
}

// Helpers
function httpGet(endpoint, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
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
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
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

runTests().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
});
