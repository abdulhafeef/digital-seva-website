/**
 * Digital Seva — Authentication & Session Utilities for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

const DEV_FALLBACK_TOKEN = 'ds_local_dev_only_key';
const DEV_FALLBACK_SESSION_SECRET = 'dev_session_secret_local_use_only_32_chars_min';

const KNOWN_PLACEHOLDER_TOKENS = [
    'ds_local_dev_only_key',
    'dev_session_secret_local_use_only_32_chars_min',
    'your_secure_admin_password_or_token_here',
    'your_secure_random_admin_token_minimum_32_characters_here',
    'your_secure_session_secret_minimum_32_characters_here',
    'admin',
    'password',
    'changeme',
    '12345678',
    'test_admin_secret_key_123'
];

/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const aLen = a.length;
    const bLen = b.length;
    let mismatch = aLen === bLen ? 0 : 1;
    const maxLen = Math.max(aLen, bLen);

    for (let i = 0; i < maxLen; i++) {
        const charA = i < aLen ? a.charCodeAt(i) : 0;
        const charB = i < bLen ? b.charCodeAt(i) : 0;
        mismatch |= (charA ^ charB);
    }

    return mismatch === 0;
}

/**
 * Validates production environment secrets.
 * Throws or returns an error string if missing, weak, or known placeholder.
 *
 * @param {object} env
 * @returns {{ valid: boolean, error?: string, adminToken: string, sessionSecret: string }}
 */
export function validateProductionSecrets(env = {}) {
    const isProd = (env.NODE_ENV || '').toLowerCase() === 'production';
    const adminToken = (env.ADMIN_TOKEN || env.ADMIN_SECRET_KEY || '').trim();
    const sessionSecret = (env.SESSION_SECRET || '').trim();

    if (isProd) {
        if (!adminToken) {
            return { valid: false, error: 'ADMIN_TOKEN is missing in production.' };
        }
        if (adminToken.length < 32) {
            return { valid: false, error: 'ADMIN_TOKEN must be at least 32 characters in production.' };
        }
        if (KNOWN_PLACEHOLDER_TOKENS.includes(adminToken)) {
            return { valid: false, error: 'Refusing to use known development or placeholder ADMIN_TOKEN in production.' };
        }

        if (!sessionSecret) {
            return { valid: false, error: 'SESSION_SECRET is missing in production.' };
        }
        if (sessionSecret.length < 32) {
            return { valid: false, error: 'SESSION_SECRET must be at least 32 characters in production.' };
        }
        if (KNOWN_PLACEHOLDER_TOKENS.includes(sessionSecret)) {
            return { valid: false, error: 'Refusing to use known placeholder SESSION_SECRET in production.' };
        }
    }

    return {
        valid: true,
        adminToken: adminToken || DEV_FALLBACK_TOKEN,
        sessionSecret: sessionSecret || DEV_FALLBACK_SESSION_SECRET
    };
}

/**
 * Base64URL encode a Uint8Array or string.
 */
function base64UrlEncode(input) {
    let str;
    if (typeof input === 'string') {
        str = btoa(input);
    } else {
        str = btoa(String.fromCharCode(...new Uint8Array(input)));
    }
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL decode to string.
 */
function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return atob(base64);
}

/**
 * Generates an HMAC-SHA256 signature using Web Crypto API.
 */
async function hmacSign(dataString, secretString) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretString);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoder.encode(dataString)
    );
    return base64UrlEncode(signature);
}

/**
 * Creates a signed, expiring session token.
 *
 * @param {string} secret - SESSION_SECRET
 * @param {number} [ttlSeconds=43200] - Default 12 hours
 * @returns {Promise<string>} - sessionToken
 */
export async function createSessionToken(secret, ttlSeconds = 43200) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        role: 'owner',
        iat: now,
        exp: now + ttlSeconds,
        nonce: Math.random().toString(36).slice(2)
    };
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const signature = await hmacSign(payloadEncoded, secret);
    return `${payloadEncoded}.${signature}`;
}

/**
 * Verifies and decodes a session token.
 *
 * @param {string} token
 * @param {string} secret - SESSION_SECRET
 * @returns {Promise<{ valid: boolean, role?: string, error?: string }>}
 */
export async function verifySessionToken(token, secret) {
    if (!token || typeof token !== 'string') {
        return { valid: false, error: 'Token missing' };
    }
    const parts = token.split('.');
    if (parts.length !== 2) {
        return { valid: false, error: 'Malformed token structure' };
    }
    const [payloadEncoded, signature] = parts;

    // Verify signature
    const expectedSignature = await hmacSign(payloadEncoded, secret);
    if (!safeCompare(signature, expectedSignature)) {
        return { valid: false, error: 'Invalid token signature' };
    }

    try {
        const payloadJson = base64UrlDecode(payloadEncoded);
        const payload = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);

        if (!payload.exp || payload.exp < now) {
            return { valid: false, error: 'Session expired' };
        }
        if (payload.role !== 'owner') {
            return { valid: false, error: 'Invalid role' };
        }

        return { valid: true, role: payload.role };
    } catch {
        return { valid: false, error: 'Corrupt payload' };
    }
}

/**
 * Parses cookies from Request header.
 *
 * @param {Request} request
 * @returns {Record<string, string>}
 */
export function parseCookies(request) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = {};
    cookieHeader.split(';').forEach(c => {
        const [k, ...v] = c.trim().split('=');
        if (k) cookies[k] = decodeURIComponent(v.join('='));
    });
    return cookies;
}

/**
 * Builds an HttpOnly, SameSite=Strict Set-Cookie header.
 *
 * @param {string} token
 * @param {boolean} isProd
 * @param {number} [maxAge=43200]
 * @returns {string}
 */
export function createSessionCookie(token, isProd, maxAge = 43200) {
    const secureFlag = isProd ? '; Secure' : '';
    return `ds_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureFlag}`;
}

/**
 * Builds a clear cookie header.
 *
 * @returns {string}
 */
export function clearSessionCookie() {
    return `ds_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/**
 * In-memory sliding-window rate limiter for Cloudflare Pages Functions isolate.
 */
const loginAttemptMap = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

export function isLoginRateLimited(ip) {
    const now = Date.now();
    const attempts = (loginAttemptMap.get(ip) || []).filter(ts => now - ts < LOGIN_WINDOW_MS);
    loginAttemptMap.set(ip, attempts);
    return attempts.length >= MAX_LOGIN_ATTEMPTS;
}

export function recordLoginFailure(ip) {
    const now = Date.now();
    const attempts = (loginAttemptMap.get(ip) || []).filter(ts => now - ts < LOGIN_WINDOW_MS);
    attempts.push(now);
    loginAttemptMap.set(ip, attempts);
}

export function clearLoginFailures(ip) {
    loginAttemptMap.delete(ip);
}

/**
 * Authenticates an incoming request using HttpOnly cookie OR Authorization: Bearer header.
 * Strictly disallows query string tokens.
 *
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<{ authenticated: boolean, error?: string }>}
 */
export async function authenticateRequest(request, env) {
    const { valid, error, adminToken, sessionSecret } = validateProductionSecrets(env);
    if (!valid) {
        return { authenticated: false, error: `Configuration error: ${error}` };
    }

    // 1. Check HttpOnly cookie 'ds_session'
    const cookies = parseCookies(request);
    const cookieToken = cookies['ds_session'];
    if (cookieToken) {
        const verifyRes = await verifySessionToken(cookieToken, sessionSecret);
        if (verifyRes.valid) {
            return { authenticated: true };
        }
    }

    // 2. Check Authorization Bearer header
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.slice(7).trim();
        // Check if it's a signed session token
        const verifyRes = await verifySessionToken(bearerToken, sessionSecret);
        if (verifyRes.valid) {
            return { authenticated: true };
        }
        // Also support direct ADMIN_TOKEN (timing-safe) for automated scripts / testing
        if (safeCompare(bearerToken, adminToken)) {
            return { authenticated: true };
        }
    }

    return { authenticated: false, error: 'Unauthorized. Owner authentication required.' };
}
