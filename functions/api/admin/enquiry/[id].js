/**
 * Digital Seva — Delete Customer Enquiry Endpoint
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

import { authenticateRequest } from '../../../utils/auth.js';
import { deleteEnquiryWithDocuments, getSupabaseConfig } from '../../../utils/supabase.js';

export async function onRequestDelete(context) {
    const { request, env, params } = context;

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

    const enquiryId = params.id;
    if (!enquiryId) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Enquiry identifier is required.'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Database is not configured.'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const result = await deleteEnquiryWithDocuments(env, enquiryId);
        return new Response(JSON.stringify({
            success: true,
            message: `Enquiry ${enquiryId} and ${result.deletedFilesCount} associated files were permanently deleted.`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('🚨 [DELETE ENQUIRY ERROR]', err.message);
        return new Response(JSON.stringify({
            success: false,
            error: err.message || 'Failed to delete enquiry.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
