/**
 * Digital Seva — Authenticated Document Retrieval Endpoint
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Supports both:
 * 1. GET /api/admin/document/:documentId
 * 2. GET /api/admin/document/:enquiryId/:storedFilename
 *
 * Strictly requires owner authentication (cookie or Bearer). Query-string tokens strictly rejected.
 */

import { authenticateRequest } from '../../../utils/auth.js';
import {
    downloadStorageDocument,
    getDocumentMetadata,
    getSupabaseConfig
} from '../../../utils/supabase.js';

export async function onRequestGet(context) {
    const { request, env, params } = context;

    // 1. Strict Query-String Token Prohibition
    const url = new URL(request.url);
    if (url.searchParams.has('token') || url.searchParams.has('admin_token') || url.searchParams.has('key')) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Authentication tokens in query parameters are strictly forbidden. Use Bearer header or session cookie.'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. Authenticate Owner
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

    // 3. Resolve Document Storage Path
    const pathSegments = params.path || [];
    if (pathSegments.length === 0) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Document identifier missing in request path.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let storagePath = '';
    let displayFilename = 'document';
    let mimeType = 'application/octet-stream';

    if (pathSegments.length === 1) {
        // Look up by document UUID or storage path
        const docIdentifier = pathSegments[0];
        const docMeta = await getDocumentMetadata(env, docIdentifier);
        if (docMeta) {
            storagePath = docMeta.storage_path;
            displayFilename = docMeta.original_name || 'document';
            mimeType = docMeta.mime_type || 'application/octet-stream';
        } else {
            // Treat as direct storage path if formatted as ref/filename
            storagePath = docIdentifier;
        }
    } else {
        // Multiple segments: /api/admin/document/:enquiryId/:filename
        const enquiryRef = pathSegments[0];
        const filename = pathSegments.slice(1).join('/');
        storagePath = `${enquiryRef}/${filename}`;

        // Attempt metadata lookup for original display filename
        const docMeta = await getDocumentMetadata(env, storagePath);
        if (docMeta) {
            displayFilename = docMeta.original_name || filename;
            mimeType = docMeta.mime_type || mimeType;
        } else {
            displayFilename = filename;
            if (filename.endsWith('.pdf')) mimeType = 'application/pdf';
            else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mimeType = 'image/jpeg';
            else if (filename.endsWith('.png')) mimeType = 'image/png';
        }
    }

    // Prevent directory traversal
    if (storagePath.includes('..') || storagePath.startsWith('/')) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Invalid storage path.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { isConfigured } = getSupabaseConfig(env);
    if (!isConfigured) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Storage backend is not configured.'
        }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Download file from private Supabase Storage
    try {
        const storageRes = await downloadStorageDocument(env, storagePath);
        if (!storageRes.ok) {
            return new Response(JSON.stringify({
                success: false,
                error: `Document not found in storage (${storageRes.status}).`
            }), {
                status: storageRes.status === 404 ? 404 : 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const safeFilename = displayFilename.replace(/[^\w.-]/g, '_');
        const headers = new Headers();
        headers.set('Content-Type', mimeType || storageRes.headers.get('content-type') || 'application/octet-stream');
        headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);
        headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        headers.set('X-Content-Type-Options', 'nosniff');

        return new Response(storageRes.body, {
            status: 200,
            headers: headers
        });
    } catch (err) {
        console.error('🚨 [DOCUMENT RETRIEVAL ERROR]', err.message);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to retrieve document from storage.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
