/**
 * Digital Seva — Global Middleware for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

export async function onRequest(context) {
    const { request, next } = context;

    // Handle preflight CORS OPTIONS requests cleanly
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    try {
        const response = await next();
        const newHeaders = new Headers(response.headers);

        // Security headers
        newHeaders.set('X-Content-Type-Options', 'nosniff');
        newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
        newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    } catch (err) {
        console.error('🚨 [MIDDLEWARE UNCAUGHT ERROR]', err);
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Internal server error. Please try again later.'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        }
        return new Response('Internal Server Error', { status: 500 });
    }
}
