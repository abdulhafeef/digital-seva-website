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
- **Default for New Visitors**: Light mode is the default; theme preference is saved in `localStorage`.
- **Anti-Flash Initialization**: Inline `<head>` script and `<meta name="darkreader-lock">` ensure immediate, consistent background rendering on refresh without flash or third-party tint distortion.
- **Bilingual Interface**: Instant in-place translation between **English (EN)** and natural, polite **Kannada (ಕನ್ನಡ)** with `localStorage` persistence.
- **Interactive Micro-Interactions**: Custom cursor follower with hover-scaling (automatically disabled on touch devices), magnetic buttons, and 3D card tilt.
- **Zero Distracting Clutter**: Clean typography using Google Fonts (Inter, Space Grotesk, Noto Sans Kannada), no fake ratings or artificial testimonials.

---

## 🔒 Customer Enquiry Flow & Security Architecture

Customers can choose between two equally clear options:

- **Option A — Submit an Enquiry Online**:
  - Name, 10-digit Indian mobile number, service, variant, optional notes.
  - **Clear Privacy & Consent Notice**: Informs applicants about data collection purpose, administrator access restrictions, and the 90-day retention schedule.
  - **Optional Individual Document Uploads**: Tailored upload slots per service variant (max 5 MB per file; allowed formats: `.pdf`, `.jpg`, `.jpeg`, `.png`).
  - **Client-Side & Server-Side Validation**: File extension check, size check, and binary **Magic Byte Signature Verification** (`%PDF`, JPEG `FF D8 FF`, PNG `89 50 4E 47`).
  - **Private Cryptographic Storage**: Uploaded files receive cryptographically random UUID names (`crypto.randomUUID()`) derived strictly from verified magic bytes.
  - **Privacy & Rate Limiting**: In-memory sliding window rate limiter protects against automated enquiry spam (max 8 submissions per 15 minutes per IP).
  - **Graceful Fallback**: If the backend server is offline or unreachable, an instant one-click WhatsApp fallback button is presented to the customer.

- **Option B — Contact Directly via WhatsApp**:
  - Skip uploading and connect directly via WhatsApp (`+91 8660847792`).
  - Clean prefilled URL generated with selected service and variant.
  - **No sensitive personal data, Aadhaar numbers, or documents are ever placed in URLs.**

---

## 🛡️ Business Owner Portal (`admin.html`) & Security Hardening

An authenticated, private dashboard for the business owner to review customer enquiries and securely retrieve documents:

- **Access URL**: `http://localhost:8000/admin.html`
- **Authentication**: Requires the `ADMIN_TOKEN` configured in environment variables.
- **Production Secret Enforcement**: In production (`NODE_ENV=production`), the server strictly refuses to start if `ADMIN_TOKEN` is missing, shorter than 32 characters, or matches development placeholders.
- **Timing-Safe Comparison**: All token evaluations use constant-time `crypto.timingSafeEqual` with unequal buffer length protection to prevent timing attacks.
- **Brute-Force Protection**: Admin login rate limiter restricts failed login attempts (max 5 failed attempts per 15 minutes per IP).
- **Bearer-Only Document Retrieval**: Access tokens are **never** passed in URL query parameters. Document retrieval requires an `Authorization: Bearer <token>` header, streaming the binary response safely into an in-memory blob without logging secrets in proxy or browser history.
- **Owner Deletion**: Enables the owner to permanently delete completed enquiry records and unlink physical files from storage.

---

## 💾 Persistent Storage Architecture & Corruption Protection

- **Configurable Storage Root**: Fully supports local paths (`STORAGE_DIR=uploads`) and absolute hosted mount paths (`STORAGE_DIR=/var/data`).
- **Atomic Writes**: Enquiry updates write to a temporary file (`enquiries.json.tmp.<uuid>`) before atomic rename, preventing file corruption or 0-byte truncation upon unexpected server termination.
- **Corruption Recovery**: If `enquiries.json` encounters a parse error, it creates a timestamped backup (`enquiries.corrupt.<timestamp>.json`) and halts unsafe writes rather than silently overwriting historical records.
- **Public URL Protection**: Storage files are strictly isolated outside public static routes and blocked with 403 Forbidden.

---

## ⏱️ Customer Record Retention Policy

- **Configured via `RETENTION_DAYS`**:
  - `RETENTION_DAYS=90` (Default): Automatically purges enquiry records and unlinks associated uploaded files older than 90 days.
  - `RETENTION_DAYS=0`: Disables automatic expiry; records remain permanently until manual deletion by the business owner.
- **Safe Purge**: Cleanup runs on server boot and every 24 hours. Files are strictly checked to ensure they reside beneath `STORAGE_DIR` before deletion.

---

## 📧 Automatic Email Notifications

Configurable notification service alerts the business owner whenever a new customer enquiry is submitted:

- **Target Address**: `digitalseva7051@gmail.com`
- **Provider**: Nodemailer integration with configurable SMTP.
- **Non-Blocking**: Notifications are sent asynchronously after the enquiry has been safely written to disk. An SMTP error never causes a customer enquiry to fail.
- **Privacy Conscious**: Notification emails include only reference ID, service type, variant, and submission timestamp. No Aadhaar numbers, customer notes, or document attachments are sent over email.
- **Default State**: Disabled by default (`EMAIL_NOTIFICATIONS_ENABLED=false`) until valid SMTP credentials are configured.

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher

```bash
# 1. Install dependencies (Nodemailer)
npm install

# 2. Configure local environment
cp .env.example .env

# 3. Run automated test suite
npm test

# 4. Start the server
npm start
```

The application will be live at:
- **Public Website**: `http://localhost:8000`
- **Owner Dashboard**: `http://localhost:8000/admin.html` (Use `ADMIN_TOKEN` configured in `.env`, or default dev key `ds_local_dev_only_key`)
- **Healthcheck Endpoint**: `http://localhost:8000/healthz`

---

## 🌐 Deploying to Render (Deployment Guide)

### 1. Service Type & Architecture
Deploy Digital Seva as a **Web Service** on Render (not a Static Site), because the Node.js backend handles enquiries, magic-byte file validation, authenticated document streams, and admin management.

> [!IMPORTANT]
> **Ephemeral Disk Warning & Persistent Disk Requirement**:
> Render's default web service containers have an ephemeral filesystem. Every deploy, restart, or sleep/wake cycle completely wipes the local container disk.
> To prevent customer records and uploaded documents from being lost upon redeployment, a **Render Persistent Disk** must be mounted.
> Persistent Disks require a Render paid plan (Starter tier at $7/month for the Web Service + $0.25/GB/month for the disk).

### 2. Render Web Service Settings

| Setting | Value |
| :--- | :--- |
| **Service Type** | Web Service |
| **Environment / Runtime** | `Node` |
| **Region** | `Singapore` (Recommended for low latency to users in India) |
| **Branch** | `main` |
| **Build Command** | `npm ci && npm test` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/healthz` |

### 3. Render Persistent Disk Settings
Under the **Disks** section in the Render Web Service dashboard:
- **Disk Name**: `digital-seva-storage`
- **Mount Path**: `/var/data`
- **Size**: `1 GB` (or `5 GB` depending on document volume)

### 4. Render Environment Variables
Configure the following in the **Environment** tab on Render:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enforces production security checks |
| `ADMIN_TOKEN` | *(Generate a 32+ char random string)* | Secret key for Owner Portal access |
| `STORAGE_DIR` | `/var/data` | Matches persistent disk mount path |
| `RETENTION_DAYS` | `90` | Purge completed records after 90 days (or `0` for permanent) |
| `EMAIL_NOTIFICATIONS_ENABLED` | `true` *(optional)* | Enable email alerts |
| `SMTP_HOST` | `smtp.gmail.com` *(optional)* | SMTP provider host |
| `SMTP_PORT` | `587` *(optional)* | SMTP TLS port |
| `SMTP_SECURE` | `false` *(optional)* | STARTTLS flag |
| `SMTP_USER` | `your_email@gmail.com` *(optional)* | SMTP username / address |
| `SMTP_PASS` | `your_gmail_app_password` *(optional)* | Google App Password (16 characters) |
| `EMAIL_FROM` | `"Digital Seva" <no-reply@example.com>` | Sender display name |
| `NOTIFICATION_EMAIL` | `digitalseva7051@gmail.com` | Business owner recipient email |

*(Note: `PORT` is assigned automatically by Render; do not hardcode it).*

---

## ⚙️ Environment Configuration Reference (`.env.example`)

| Variable | Description | Default / Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `PORT` | HTTP Server port | `8000` |
| `HOST` | Server bind interface | `0.0.0.0` |
| `ADMIN_TOKEN` | Secret key for Owner Portal access | Min 32 chars required in production |
| `STORAGE_DIR` | Storage root for enquiries and documents | `uploads` (local) or `/var/data` (Render) |
| `RETENTION_DAYS`| Record retention period in days | `90` (or `0` to disable) |
| `EMAIL_NOTIFICATIONS_ENABLED` | Enable email alerts for new enquiries | `false` |
| `NOTIFICATION_EMAIL` | Recipient address for notifications | `digitalseva7051@gmail.com` |

---

## 🧪 Automated Test Suite

Run the full test suite with:
```bash
npm test
```
The suite executes 135+ automated assertions covering data integrity, bilingual translations, production token rejection, timing-safe authentication, brute-force rate-limiting, magic-byte file validation, atomic file writes, crash persistence across server restart, retention purging, mock email notifications, and Git secret hygiene—all utilizing an isolated temporary storage sandbox.

---

## 📄 License & Attribution

- Application code, content, and design refinements: **Digital Seva**
- Base UI and interaction structure licensed under the **MIT License**.
- Original base template copyright &copy; 2025 **Kiran Badave** ([MIT License](LICENSE)).
