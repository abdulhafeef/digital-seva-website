/**
 * Digital Seva — Authenticated Owner Enquiries List Endpoint
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

import { authenticateRequest } from '../../utils/auth.js';
import { listEnquiries, getSupabaseConfig } from '../../utils/supabase.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    // 1. Authenticate Owner
    const auth = await authenticateRequest(request, env);
    if (!auth.authenticated) {
        return new Response(JSON.stringify({
            success: false,
            error: auth.error || 'Unauthorized. Owner access required.'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Fetch from Supabase
    const { isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        return new Response(JSON.stringify({
            success: true,
            enquiries: [],
            notice: 'Supabase database is not yet configured.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const enquiries = await listEnquiries(env);
        return new Response(JSON.stringify({
            success: true,
            enquiries: enquiries
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
        });
    } catch (err) {
        console.error('🚨 [LIST ENQUIRIES ERROR]', err.message);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to retrieve enquiries from database.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
