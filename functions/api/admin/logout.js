/**
 * Digital Seva — Owner Logout Endpoint for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

import { clearSessionCookie } from '../../utils/auth.js';

export async function onRequestPost() {
    return new Response(JSON.stringify({
        success: true,
        message: 'Logged out successfully.'
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': clearSessionCookie()
        }
    });
}
