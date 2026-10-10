-- ========================================================
-- DIGITAL SEVA — SUPABASE POSTGRES SCHEMA MIGRATION
-- Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
--
-- Architecture:
-- 1. enquiries: Stores customer enquiry metadata & contact details.
-- 2. enquiry_documents: Stores private document metadata (files stored in private bucket).
-- 3. Row Level Security (RLS): Strictly denies public / anonymous access.
--    Only trusted backend (service_role) has access.
-- ========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- 1. Enquiries Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_ref VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    service VARCHAR(50) NOT NULL,
    variant VARCHAR(50) NOT NULL DEFAULT 'standard',
    notes TEXT,
    retention_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for fast lookups and retention queries
CREATE INDEX IF NOT EXISTS idx_enquiries_ref ON public.enquiries (enquiry_ref);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_retention ON public.enquiries (retention_status, created_at);

-- --------------------------------------------------------
-- 2. Enquiry Documents Table (Metadata only — files in Supabase Storage)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiry_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL UNIQUE,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
    slot_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for documents table
CREATE INDEX IF NOT EXISTS idx_enquiry_documents_enquiry_id ON public.enquiry_documents (enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_documents_path ON public.enquiry_documents (storage_path);

-- --------------------------------------------------------
-- 3. Row Level Security (RLS) Configuration
-- Strictly deny anonymous and public access to customer data
-- --------------------------------------------------------
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_documents ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke all permissions from public 'anon' role
REVOKE ALL ON public.enquiries FROM anon;
REVOKE ALL ON public.enquiry_documents FROM anon;

-- Grant all permissions to trusted 'service_role' (used by Cloudflare Pages Functions)
GRANT ALL ON public.enquiries TO service_role;
GRANT ALL ON public.enquiry_documents TO service_role;

-- Default Deny Policies for anon/authenticated (defense-in-depth)
DROP POLICY IF EXISTS "Deny anon access to enquiries" ON public.enquiries;
CREATE POLICY "Deny anon access to enquiries" ON public.enquiries
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anon access to documents" ON public.enquiry_documents;
CREATE POLICY "Deny anon access to documents" ON public.enquiry_documents
    FOR ALL
    TO anon
    USING (false)
    WITH CHECK (false);

-- --------------------------------------------------------
-- 4. Supabase Storage Bucket Configuration
-- Bucket: 'customer-documents' (Strictly Private)
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'customer-documents',
    'customer-documents',
    false,
    5242880, -- 5 MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

-- Storage RLS: Ensure only service_role can access customer-documents objects
DROP POLICY IF EXISTS "Deny anon access to customer-documents bucket" ON storage.objects;
CREATE POLICY "Deny anon access to customer-documents bucket" ON storage.objects
    FOR ALL
    TO anon
    USING (bucket_id = 'customer-documents' AND false)
    WITH CHECK (bucket_id = 'customer-documents' AND false);
