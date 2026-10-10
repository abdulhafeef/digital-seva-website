/**
 * Digital Seva — Validation Utilities for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

const SIGNATURES = {
    pdf: {
        magic: [0x25, 0x50, 0x44, 0x46], // %PDF
        mime: 'application/pdf',
        ext: 'pdf'
    },
    jpg: {
        magic: [0xFF, 0xD8, 0xFF], // JPEG
        mime: 'image/jpeg',
        ext: 'jpg'
    },
    png: {
        magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
        mime: 'image/png',
        ext: 'png'
    }
};

/**
 * Validates binary file magic bytes from a Uint8Array or Buffer.
 * Rejects unsupported and spoofed files (e.g. text/exe files disguised as .pdf).
 *
 * @param {Uint8Array} bytes
 * @returns {{ magic: number[], mime: string, ext: string } | null}
 */
export function validateMagicBytes(bytes) {
    if (!bytes || bytes.length < 8) return null;

    // Check PNG
    const png = SIGNATURES.png.magic;
    let isPng = true;
    for (let i = 0; i < png.length; i++) {
        if (bytes[i] !== png[i]) { isPng = false; break; }
    }
    if (isPng) return SIGNATURES.png;

    // Check JPEG
    const jpg = SIGNATURES.jpg.magic;
    let isJpg = true;
    for (let i = 0; i < jpg.length; i++) {
        if (bytes[i] !== jpg[i]) { isJpg = false; break; }
    }
    if (isJpg) return SIGNATURES.jpg;

    // Check PDF
    const pdf = SIGNATURES.pdf.magic;
    let isPdf = true;
    for (let i = 0; i < pdf.length; i++) {
        if (bytes[i] !== pdf[i]) { isPdf = false; break; }
    }
    if (isPdf) return SIGNATURES.pdf;

    return null;
}

/**
 * Validates 10-digit Indian mobile number.
 *
 * @param {string} phone
 * @returns {boolean}
 */
export function validateIndianMobile(phone) {
    if (typeof phone !== 'string') return false;
    const clean = phone.trim().replace(/^(\+91|91|0)/, '');
    return /^[6-9]\d{9}$/.test(clean);
}

/**
 * Validates Cloudflare Turnstile CAPTCHA response token.
 * If secret key is not configured, validation passes (local development mode).
 *
 * @param {string} token - The cf-turnstile-response from form
 * @param {string} secretKey - TURNSTILE_SECRET_KEY
 * @param {string} [ip] - Remote client IP
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function verifyTurnstileToken(token, secretKey, ip, isProduction = false) {
    if (!secretKey || secretKey.trim() === '') {
        if (isProduction) {
            return {
                success: false,
                error: 'Turnstile secret key is not configured in production.'
            };
        }
        // Turnstile not configured -> allowed for local dev
        return { success: true };
    }

    if (!token || token.trim() === '') {
        return {
            success: false,
            error: 'Verification token is required. Please complete the security check.'
        };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        if (ip && ip !== 'unknown') formData.append('remoteip', ip);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const outcome = await res.json();
        if (outcome.success) {
            return { success: true };
        }
        return {
            success: false,
            error: 'Bot verification failed. Please complete the security check again.'
        };
    } catch (err) {
        return {
            success: false,
            error: 'Unable to reach verification service. Please try again or use WhatsApp.'
        };
    }
}
