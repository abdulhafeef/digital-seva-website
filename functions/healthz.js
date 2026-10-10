/**
 * Digital Seva — Healthcheck Endpoint for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

import { getSupabaseConfig } from './utils/supabase.js';

export async function onRequestGet(context) {
    const { env } = context;
    const { isConfigured } = getSupabaseConfig(env);

    return new Response(JSON.stringify({
        status: 'ok',
        service: 'Digital Seva',
        runtime: 'Cloudflare Pages Functions',
        storageBackend: isConfigured ? 'Supabase Postgres & Storage' : 'Awaiting Supabase configuration',
        timestamp: new Date().toISOString()
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff'
        }
    });
}
