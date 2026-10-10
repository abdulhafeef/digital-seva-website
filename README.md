# Digital Seva — Online Citizen Application Assistance Portal

A modern, accessible, and privacy-focused online application assistance platform built for **Digital Seva**. It provides guided support for citizens in Karnataka and across India to prepare documentation and navigate online portals for essential civic services from home.

---

## 🌟 Confirmed Services Catalogue

The platform features eight citizen application assistance categories with precise document checklists, alternative document guidance, and optional document upload workflows:

1. **PAN Card**
   - *New (Form 49A)*: SSLC marks card, Aadhaar Card, Passport-size photo, Signature. (*If SSLC is unavailable, alternative birth/identity records may be accepted upon review.*)
   - *Correction / Update*: Existing PAN Card, Aadhaar Card, Passport-size photo, Signature.
2. **Voter ID**
   - *New Registration (Form 6)*: SSLC marks card, Aadhaar Card, Passport-size photo. (*Alternative age proofs accepted if SSLC is unavailable.*)
   - *Correction / Shifting (Form 8)*: Existing Voter ID, Aadhaar Card.
3. **Aadhaar Address Correction Assistance**
   - *Address Update*: Aadhaar Card, standard supporting address proof or certification.
   - *Note on MA Form*: The owner's initial checklist noted "MA / Municipal-signed form". This specific wording requires owner confirmation before being published as an official UIDAI rule; official UIDAI standard format verification is required.
4. **Indian Passport**
   - *Fresh Application*: SSLC marks card, Aadhaar Card, Supporting ID/Proof (one among PAN Card, Voter ID, or Driving Licence).
   - *Renewal / Re-issue*: Existing Passport, Aadhaar Card, Supporting ID/Proof (one among PAN Card, Voter ID, or Driving Licence).
5. **Income Certificate Application Assistance**
   - *Portal Application*: VA / Panchayat / Mukhiya-signed form, Aadhaar Card, SSLC marks card, Previous Income & Caste Certificates, Passport-size photo.
6. **Caste Certificate Application Assistance**
   - *Portal Application*: VA / Panchayat / Mukhiya-signed form, Aadhaar Card, SSLC marks card, Previous Income & Caste Certificates, Passport-size photo.
   - *Service Scope*: Digital Seva currently provides this assistance specifically for Muslim applicants as part of the business's current service focus and scope (not a universal government eligibility rule).
7. **Scholarship Applications**
   - *SSP / NSP Portals*: SSLC marks card, Aadhaar Card, Income Certificate, scheme-specific documents (college fee receipt, bank passbook, previous marks).
8. **More Online Applications**
   - *General Civic Portals*: Guidance for Driving Licence (LLR/DL), ration card corrections, and official online welfare schemes.

---

## 🎨 Design System & Aesthetics

- **Light & Dark Themes**: Fully designed dual-theme architecture. The light theme features a warm, very light near-white palette (`#faf9f5`) with royal sapphire blue (`#1e40af`) and warm saffron amber (`#d97706`). The dark theme features deep midnight navy-slate (`#0a101d`) with crisp, high-contrast surfaces.
- **Official Digital Seva Logo**: Exact official logo (`assets/digital-seva-logo.jpeg`) integrated in header, footer, and owner portal with theme-aware badge framing.
- **Default for New Visitors**: Light mode is the default; theme preference is saved in `localStorage`.
- **Anti-Flash Initialization**: Inline `<head>` script and `<meta name="darkreader-lock">` ensure immediate, consistent background rendering on refresh without flash or third-party tint distortion.
- **Bilingual Interface**: Instant in-place translation between **English (EN)** and natural, polite **Kannada (ಕನ್ನಡ)** with `localStorage` persistence.
- **Interactive Micro-Interactions**: Custom cursor follower with hover-scaling (automatically disabled on touch devices), magnetic buttons, and 3D card tilt.
- **Zero Distracting Clutter**: Clean typography using Google Fonts (Inter, Space Grotesk, Noto Sans Kannada), no fake ratings or artificial testimonials.

---

## ☁️ Production Architecture: Cloudflare Pages + Supabase (₹0 / Month Free Tier)

Digital Seva has been architected to run permanently on free-tier infrastructure with zero monthly hosting costs:

```
[ Citizen / Browser ]
        │
        ▼ (HTTPS)
┌────────────────────────────────────────────────────────┐
│ Cloudflare Pages                                       │
│ • Static Assets: index.html, admin.html, CSS, JS, Logo │
│                                                        │
│ Cloudflare Pages Functions (/functions/api/...)       │
│ • GET /healthz                                         │
│ • POST /api/enquiries (Rate limit + Magic bytes check) │
│ • POST /api/admin/login (HttpOnly Session Cookie)      │
│ • POST /api/admin/logout                               │
│ • GET /api/admin/enquiries (Owner authenticated)       │
│ • DELETE /api/admin/enquiry/:id                        │
│ • GET /api/admin/document/:documentId                  │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        (Private REST)             (Private REST)
               ▼                          ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│ Supabase Postgres (Free) │    │ Supabase Storage (Free)      │
│ • public.enquiries       │    │ • bucket: customer-documents │
│ • public.enquiry_docs    │    │ • Private: public = false    │
│ • Row Level Security     │    │ • Max 5 MB per file          │
│ • Anon access DENIED     │    │ • Anon access DENIED         │
└──────────────────────────┘    └──────────────────────────────┘
```

### Free-Tier Services Breakdown

| Component | Provider & Tier | Monthly Cost | Generous Free Quota |
| :--- | :--- | :--- | :--- |
| **Public Website & Admin Portal** | Cloudflare Pages (Free) | **₹0** | Unlimited bandwidth, 500 builds/month |
| **Serverless Backend APIs** | Cloudflare Pages Functions | **₹0** | 100,000 requests per day |
| **Database & Metadata** | Supabase Postgres (Free Tier) | **₹0** | 500 MB database, 2 free projects |
| **Private Document Storage** | Supabase Storage (Free Tier) | **₹0** | 1 GB storage, 2 GB egress/month |
| **Bot Protection (Optional)** | Cloudflare Turnstile (Free) | **₹0** | Unlimited challenges/month |
| **Email Alerts (Optional)** | Resend HTTP API (Free Tier) | **₹0** | 3,000 emails/month (100/day) |

---

## 🛠️ Supabase Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project (select region: **South Asia - Mumbai** for lowest Indian latency).
2. Note your **Project URL** and **API Keys** under **Project Settings -> API**:
   - `Project URL`: `https://your-ref.supabase.co`
   - `anon public key`: used for client validation
   - `service_role secret key`: **Keep strictly confidential; only configure in Cloudflare dashboard!**

### 2. Apply Database Migrations & Storage Setup
Open the **SQL Editor** in your Supabase dashboard and run the version-controlled script located at:
`supabase/migrations/20261010_initial_schema.sql`

This single idempotent SQL migration sets up:
1. `public.enquiries`: Customer contact and service details.
2. `public.enquiry_documents`: Document metadata with cascade foreign keys.
3. **Row Level Security (RLS)**: Enforces strict default-deny policies against anonymous public access (`REVOKE ALL ON public.enquiries FROM anon`).
4. **Private Storage Bucket**: Creates the `customer-documents` bucket (`public = false`, 5 MB file size limit, PDF/JPEG/PNG whitelist) and configures strict storage access policies.

---

## 🚀 Cloudflare Pages Deployment Guide

### 1. Build Settings
In the Cloudflare Dashboard, navigate to **Workers & Pages -> Create Application -> Pages -> Connect to Git**:

| Setting | Value |
| :--- | :--- |
| **Project Name** | `digital-seva` |
| **Framework preset** | `None` |
| **Build Command** | `npm ci && npm test && npm run build:pages` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (root) |

### 2. Configure Environment Variables & Secrets
Under **Pages Project Settings -> Environment Variables**, configure the following variables (choose **Encrypt** for all secret tokens):

| Variable Name | Type | Value / Guidance |
| :--- | :--- | :--- |
| `NODE_ENV` | Plaintext | `production` |
| `SUPABASE_URL` | Plaintext | `https://your-project-ref.supabase.co` |
| `SUPABASE_ANON_KEY` | Plaintext | `ey...` (Supabase anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Encrypted** | `ey...` (Supabase service_role secret key) |
| `ADMIN_TOKEN` | **Encrypted** | Random 32+ character string for Owner Portal login |
| `SESSION_SECRET` | **Encrypted** | Random 32+ character string for HMAC-SHA256 session cookies |
| `RETENTION_DAYS` | Plaintext | `90` (or `0` to disable auto-expiry) |
| `TURNSTILE_SITE_KEY` | Plaintext *(optional)* | Cloudflare Turnstile public key |
| `TURNSTILE_SECRET_KEY` | **Encrypted** *(optional)* | Cloudflare Turnstile secret key |
| `EMAIL_NOTIFICATIONS_ENABLED` | Plaintext *(optional)* | `false` (default) or `true` |
| `RESEND_API_KEY` | **Encrypted** *(optional)* | `re_...` (Resend API key) |
| `EMAIL_FROM` | Plaintext *(optional)* | `"Digital Seva" <onboarding@resend.dev>` |
| `NOTIFICATION_EMAIL` | Plaintext *(optional)* | `digitalseva7051@gmail.com` |

---

## ⏱️ Scheduled 90-Day Retention Worker (`workers/retention-worker.js`)

Because Cloudflare Pages Functions are stateless request handlers, automated customer record cleanup is provided via a dedicated scheduled Cloudflare Worker.

### How It Works:
- Runs once daily at `03:00 UTC` (`08:30 AM IST`) via Cron Trigger (`0 3 * * *`).
- Respects `RETENTION_DAYS=90`: identifies enquiries older than 90 days.
- If `RETENTION_DAYS=0`: logs that retention is disabled and exits safely.
- Safely unlinks associated storage objects from bucket `customer-documents`.
- Deletes enquiry records from Postgres (cascading foreign keys remove document metadata).
- Handles retries on temporary storage errors so data is never prematurely corrupted.
- Strict security guard: refuses to delete files outside the `customer-documents` bucket.

### Deployment Instructions:
```bash
cd workers
# Configure secrets
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_TOKEN

# Deploy scheduled worker
npx wrangler deploy
```

---

## 💻 Local Development Options

### Option 1: Native Node.js Server (Quick Local Dev)
Runs the lightweight Node.js development server:
```bash
# 1. Install dependencies
npm install

# 2. Configure local environment
cp .env.example .env

# 3. Start server
npm start
```
Access at `http://localhost:8000`.

### Option 2: Cloudflare Wrangler Pages Functions Local Emulation
Emulates the exact Cloudflare Pages and Edge runtime locally:
```bash
# 1. Build public assets
npm run build:pages

# 2. Configure local Wrangler environment bindings
cp .env.example .dev.vars
# (Edit .dev.vars with test keys)

# 3. Run Pages Functions locally
npx wrangler pages dev dist
```

---

## 🧪 Automated Test Suite

Run the comprehensive test suite with:
```bash
npm test
```
The suite executes **204+ automated assertions** covering:
- Bilingual English and Kannada dictionaries & checklists for all 8 civic services.
- Magic byte binary signatures (`%PDF`, JPEG `FF D8 FF`, PNG `89 50 4E 47`) and rejection of spoofed files.
- Indian mobile number validation and Turnstile CAPTCHA verification.
- Timing-safe authentication and production token length enforcement.
- Cryptographically signed HMAC-SHA256 session tokens, HttpOnly cookie generation, and session expiration.
- Edge API endpoints: `/healthz`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/enquiries`, `/api/admin/document/[[path]]`, `/api/admin/enquiry/[id]`, `/api/enquiries`.
- Strict prohibition of URL query-string authentication tokens.
- Storage upload rollback on database failure.
- Scheduled 90-day retention worker logic.
- Resend HTTP email notification sender (mocked).
- Supabase SQL migration syntax and Row Level Security verification.
- Cloudflare Pages static build validation: guarantees `dist/` contains public assets only and strictly excludes server scripts, tests, `.env`, `.dev.vars`, and database exports.
- Git hygiene verification: confirms `.env*`, `.dev.vars*`, and customer files remain excluded from Git.

---

## 📄 License & Attribution

- Application code, content, and design refinements: **Digital Seva**
- Base UI and interaction structure licensed under the **MIT License**.
- Original base template copyright &copy; 2025 **Kiran Badave** ([MIT License](LICENSE)).
