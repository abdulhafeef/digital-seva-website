/**
 * Digital Seva — Owner Login Endpoint for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

import {
    safeCompare,
    validateProductionSecrets,
    createSessionToken,
    createSessionCookie,
    isLoginRateLimited,
    recordLoginFailure,
    clearLoginFailures
} from '../../utils/auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    const clientIp = request.headers.get('cf-connecting-ip')
        || request.headers.get('x-forwarded-for')
        || 'unknown';

    // 1. Rate limiting check
    if (isLoginRateLimited(clientIp)) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
        }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Validate production configuration
    const { valid, error: configError, adminToken, sessionSecret } = validateProductionSecrets(env);
    if (!valid) {
        console.error('🚨 [LOGIN CONFIG ERROR]', configError);
        return new Response(JSON.stringify({
            success: false,
            error: 'Server security configuration error. Please contact the administrator.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 3. Parse credentials
    let password = '';
    try {
        const body = await request.json();
        password = (body.password || body.token || '').toString().trim();
    } catch {
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid request body. JSON expected.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!password) {
        recordLoginFailure(clientIp);
        return new Response(JSON.stringify({
            success: false,
            error: 'Secret key is required.'
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Timing-safe password verification
    const isMatch = safeCompare(password, adminToken);

    if (!isMatch) {
        recordLoginFailure(clientIp);
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid administrator credentials.'
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. Success -> Clear login failures and generate session token
    clearLoginFailures(clientIp);
    const isProd = (env.NODE_ENV || '').toLowerCase() === 'production';
    const sessionToken = await createSessionToken(sessionSecret, 43200); // 12 hours
    const cookieHeader = createSessionCookie(sessionToken, isProd, 43200);

    return new Response(JSON.stringify({
        success: true,
        message: 'Owner authentication successful.',
        token: sessionToken
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookieHeader
        }
    });
}
