/**
 * Digital Seva — HTTP Email Notification Client for Cloudflare Pages Functions
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Uses Resend REST API (compatible with Edge/Cloudflare runtime, zero TCP SMTP reliance).
 * Notifications are disabled by default.
 */

const DEFAULT_NOTIFICATION_EMAIL = 'digitalseva7051@gmail.com';
const DEFAULT_FROM = 'Digital Seva Notifications <onboarding@resend.dev>';

/**
 * Sends an optional business notification email when a new customer enquiry arrives.
 *
 * @param {object} env
 * @param {object} enquiry - { enquiryRef, name, phone, service, variant, createdAt }
 * @param {Function} [mockSender] - Optional mock injector for automated test suites
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendEnquiryEmailNotification(env = {}, enquiry = {}, mockSender = null) {
    if (mockSender && typeof mockSender === 'function') {
        try {
            await mockSender(enquiry);
            return { sent: true };
        } catch (mockErr) {
            return { sent: false, error: mockErr.message };
        }
    }

    const enabled = (env.EMAIL_NOTIFICATIONS_ENABLED || '').toLowerCase() === 'true';
    if (!enabled) {
        return { sent: false, error: 'Email notifications are disabled.' };
    }

    const apiKey = (env.RESEND_API_KEY || '').trim();
    if (!apiKey) {
        console.warn('⚠️ [EMAIL NOTIFICATIONS] Enabled but RESEND_API_KEY is not configured.');
        return { sent: false, error: 'RESEND_API_KEY is not configured.' };
    }

    const recipient = (env.NOTIFICATION_EMAIL || DEFAULT_NOTIFICATION_EMAIL).trim();
    const fromAddress = (env.EMAIL_FROM || DEFAULT_FROM).trim();

    const istTime = enquiry.createdAt
        ? new Date(enquiry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const subject = `New Digital Seva Enquiry: ${enquiry.enquiryRef} - ${(enquiry.service || 'Service').toUpperCase()}`;

    const textBody = `
New customer enquiry received on Digital Seva:

Reference ID: ${enquiry.enquiryRef}
Customer Name: ${enquiry.name}
Phone Number: +91 ${enquiry.phone}
Service: ${(enquiry.service || '').toUpperCase()}
Application Variant: ${enquiry.variant || 'Standard'}
Submitted At (IST): ${istTime}

View enquiry and uploaded documents securely in the Owner Portal:
https://digitalseva.pages.dev/admin.html
`.trim();

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromAddress,
                to: [recipient],
                subject: subject,
                text: textBody
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`🚨 [EMAIL NOTIFICATION FAILED] Status ${res.status}: ${errText}`);
            return { sent: false, error: `Provider error (${res.status}): ${errText}` };
        }

        const data = await res.json();
        console.log(`📧 [EMAIL NOTIFICATION SENT] Ref: ${enquiry.enquiryRef} ID: ${data.id}`);
        return { sent: true };
    } catch (err) {
        console.error(`🚨 [EMAIL NOTIFICATION ERROR] Network failure: ${err.message}`);
        return { sent: false, error: err.message };
    }
}
