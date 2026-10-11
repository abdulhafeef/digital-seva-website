/**
 * Digital Seva — Scheduled 90-Day Retention & Deletion Worker
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Cloudflare Scheduled Worker:
 * - Runs once daily via Cron Trigger (e.g. 0 3 * * * = 03:00 UTC)
 * - Identifies expired enquiries (created_at older than RETENTION_DAYS)
 * - Deletes private storage objects from 'customer-documents'
 * - Deletes corresponding Postgres enquiry & metadata records
 * - RETENTION_DAYS=0 disables automatic cleanup
 */

const STORAGE_BUCKET = 'customer-documents';

/**
 * Core retention cleanup logic.
 *
 * @param {object} env
 * @returns {Promise<{ purgedCount: number, status: string, details?: Array<object> }>}
 */
export async function executeRetentionCleanup(env) {
    const rawRetention = env.RETENTION_DAYS !== undefined ? env.RETENTION_DAYS : '90';
    const retentionDays = parseInt(rawRetention, 10);

    if (isNaN(retentionDays) || retentionDays <= 0) {
        console.log(`ℹ️ [RETENTION WORKER] Retention automatic purge disabled (RETENTION_DAYS=${retentionDays}).`);
        return { purgedCount: 0, status: 'disabled', message: 'Retention automatic cleanup is disabled.' };
    }

    const url = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!url || !serviceRoleKey) {
        console.error('🚨 [RETENTION WORKER] Supabase URL or Service Role Key missing.');
        return { purgedCount: 0, status: 'unconfigured', message: 'Supabase credentials missing.' };
    }

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    console.log(`🧹 [RETENTION WORKER] Checking for enquiries created before ${cutoffDate} (${retentionDays} days threshold)...`);

    // 1. Query expired enquiries
    const endpoint = `${url}/rest/v1/enquiries?created_at=lt.${cutoffDate}&select=id,enquiry_ref,created_at,enquiry_documents(storage_path)`;
    const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
        }
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to query expired records from Supabase (${res.status}): ${err}`);
    }

    const expiredList = await res.json();
    console.log(`ℹ️ [RETENTION WORKER] Found ${expiredList.length} expired enquiries.`);

    let purgedCount = 0;
    const results = [];

    // 2. Safely purge each expired record and its storage objects
    for (const item of expiredList) {
        const docs = item.enquiry_documents || [];
        let filesDeleted = 0;
        let storageError = null;

        for (const doc of docs) {
            const storagePath = doc.storage_path;
            // Strict safety check: Never delete outside customer-documents bucket
            if (!storagePath || storagePath.includes('..') || storagePath.startsWith('/')) {
                console.warn(`[SAFETY CHECK] Skipping suspicious storage path: ${storagePath}`);
                continue;
            }

            try {
                const cleanStoragePath = String(storagePath).replace(/%2F/gi, '/').split('/').filter(Boolean).map(encodeURIComponent).join('/');
                const delRes = await fetch(`${url}/storage/v1/object/${STORAGE_BUCKET}/${cleanStoragePath}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': serviceRoleKey,
                        'Authorization': `Bearer ${serviceRoleKey}`
                    }
                });
                if (delRes.ok || delRes.status === 404) {
                    filesDeleted++;
                } else {
                    storageError = `Storage HTTP ${delRes.status}`;
                }
            } catch (err) {
                storageError = err.message;
            }
        }

        // Only delete DB record if files were successfully unlinked or already absent
        if (!storageError) {
            const dbDelRes = await fetch(`${url}/rest/v1/enquiries?id=eq.${item.id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`
                }
            });

            if (dbDelRes.ok) {
                purgedCount++;
                results.push({ id: item.id, ref: item.enquiry_ref, status: 'purged', files: filesDeleted });
            } else {
                results.push({ id: item.id, ref: item.enquiry_ref, status: 'db_error' });
            }
        } else {
            console.error(`🚨 [RETENTION WORKER] Retrying later: Storage error on ${item.enquiry_ref}: ${storageError}`);
            results.push({ id: item.id, ref: item.enquiry_ref, status: 'storage_error', error: storageError });
        }
    }

    console.log(`✅ [RETENTION WORKER] Completed cleanup: ${purgedCount} records purged.`);
    return { purgedCount, status: 'success', details: results };
}

export default {
    /**
     * Cron Trigger execution
     */
    async scheduled(event, env, ctx) {
        ctx.waitUntil(executeRetentionCleanup(env));
    },

    /**
     * Manual invocation / test endpoint
     * Requires Authorization: Bearer <ADMIN_TOKEN>
     */
    async fetch(request, env) {
        const authHeader = request.headers.get('Authorization') || '';
        const adminToken = (env.ADMIN_TOKEN || '').trim();

        if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const outcome = await executeRetentionCleanup(env);
            return new Response(JSON.stringify(outcome), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};
