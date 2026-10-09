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
- **Bilingual Interface**: Instant in-place translation between **English (EN)** and natural, polite **Kannada (ಕನ್ನಡ)** with `localStorage` persistence.
- **Interactive Micro-Interactions**: Custom cursor follower with hover-scaling (automatically disabled on touch devices), magnetic buttons, and 3D card tilt.
- **Workflow Graphic**: Refined 4-stage visual representing *Documents → Details → Application Assistance → Confirmation*.
- **Zero Distracting Clutter**: Clean typography using Google Fonts (Inter, Space Grotesk, Noto Sans Kannada), no fake ratings or artificial testimonials.

---

## 🔒 Customer Enquiry Flow & Security Architecture

Customers can choose between two equally clear options:

- **Option A — Submit an Enquiry Online**:
  - Name, 10-digit Indian mobile number, service, variant, optional notes.
  - **Optional Individual Document Uploads**: Tailored upload slots per service variant (max 5 MB per file; allowed formats: `.pdf`, `.jpg`, `.jpeg`, `.png`).
  - **Client-Side & Server-Side Validation**: File extension check, size check, and binary **Magic Byte Signature Verification** (`%PDF`, JPEG `FF D8 FF`, PNG `89 50 4E 47`).
  - **Private Storage**: Stored outside the public web root in `uploads/` (strictly excluded in `.gitignore`). Files receive cryptographically random UUID names to prevent path disclosure.
  - **Privacy & Rate Limiting**: In-memory sliding window rate limiter protects against automated spam.
  - **Graceful Fallback**: If the backend server is offline or unreachable, an instant one-click WhatsApp fallback button is presented to the customer.

- **Option B — Contact Directly via WhatsApp**:
  - Skip uploading and connect directly via WhatsApp (`+91 8660847792`).
  - Clean prefilled URL generated with selected service and variant.
  - **No sensitive personal data, Aadhaar numbers, or documents are ever placed in URLs.**

---

## 🛡️ Business Owner Portal (`admin.html`)

An authenticated, private dashboard for the business owner to review customer enquiries and securely retrieve documents:

- Access URL: `http://localhost:8000/admin.html`
- Requires the `ADMIN_TOKEN` configured in environment variables.
- Enables the owner to view customer contact numbers, review application notes, download uploaded PDF/image documents securely via authenticated streams, and delete completed records.

---

## 🚀 Running the Project Locally

### Option 1: Full-Featured Mode with Upload Backend (Recommended)
Node.js v18+ is supported with zero external dependencies (pure Node.js standard library):

```bash
# 1. Set environment variables (optional, defaults provided for dev)
cp .env.example .env

# 2. Start the secure server
node server.js
```
The application will be live at:
- Public Website: `http://localhost:8000`
- Owner Dashboard: `http://localhost:8000/admin.html` (Authenticate with your configured `ADMIN_TOKEN`)

### Option 2: Static Preview Only
If serving statically (e.g. via `python3 -m http.server 8000` or GitHub Pages):
- The frontend will load all services, filters, checklists, themes, and translations.
- If a visitor submits an enquiry, the frontend detects that the API is offline and offers an immediate, prefilled WhatsApp contact action.

---

## ⚙️ Environment Variables (`.env.example`)

| Variable | Description | Default / Requirement |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `8000` |
| `HOST` | Server bind address | `0.0.0.0` |
| `ADMIN_TOKEN` | Secret key for Owner Portal access | Required in production (set in `.env`) |
| `STORAGE_DIR` | Private uploads directory | `uploads` |
| `RETENTION_DAYS`| Record retention period in days | `90` |

---

## 📄 License & Attribution

- Application code, content, and design refinements: **Digital Seva**
- Base UI and interaction structure licensed under the **MIT License**.
- Original base template copyright &copy; 2025 **Kiran Badave** ([MIT License](LICENSE)).
