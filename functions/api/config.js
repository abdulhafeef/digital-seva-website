/**
 * Digital Seva — Public Client Configuration Endpoint
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Exposes only safe, public configuration values (e.g. TURNSTILE_SITE_KEY).
 * Strictly forbids returning any secret tokens, private keys, or credentials.
 */

export async function onRequestGet(context) {
    const { env } = context;

    // Extract only the public Turnstile site key
    const turnstileSiteKey = (env.TURNSTILE_SITE_KEY || '').trim();

    return new Response(JSON.stringify({
        turnstileSiteKey: turnstileSiteKey
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff'
        }
    });
}
