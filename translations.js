/**
 * Translations for Digital Seva
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Complete Bilingual Dictionary: English (en) & Kannada (kn)
 */

const translations = {
    en: {
        site: {
            title: "Digital Seva | Online Application Assistance",
            name: "Digital Seva",
            tagline: "Online Application Assistance"
        },
        nav: {
            home: "Home",
            services: "Services",
            howItWorks: "How It Works",
            whyUs: "Why Digital Seva",
            about: "About",
            faq: "FAQ",
            contact: "Contact",
            themeToggle: "Toggle theme",
            themeToDark: "Switch to dark theme",
            themeToLight: "Switch to light theme",
            langSelector: "Language selector",
            ctaWhatsApp: "WhatsApp Assistance",
            menuToggle: "Toggle navigation menu"
        },
        hero: {
            greeting: "DIGITAL SEVA",
            name: "ONLINE APPLICATION ASSISTANCE",
            subtitle: "Your Online Applications, Made Simpler.",
            description: "Get assistance with essential online application processes from the convenience of your home. Review the documents you may need, choose how to contact us, and get guidance throughout the process.",
            ctaWhatsApp: "Get Assistance on WhatsApp",
            ctaServices: "Explore Services",
            contactDirect: "Helpline / WhatsApp",
            workflowTitle: "Application Workflow",
            step1: "Documents",
            step1Desc: "Review required checklist",
            step2: "Details",
            step2Desc: "Share details or upload files",
            step3: "Application Assistance",
            step3Desc: "Guided application filing",
            step4: "Confirmation",
            step4Desc: "Receive acknowledgement details",
            trustNotice: "Independent private application assistance. Official certificates and approvals are issued solely by competent government authorities.",
            scrollDown: "Scroll Down"
        },
        services: {
            tag: "Service Catalogue",
            title: "Citizen Application Services",
            subtitle: "Choose from our eight supported online assistance categories. Select any card to review document checklists or submit an enquiry.",
            searchPlaceholder: "Search services (e.g. PAN, Voter, Passport, Income, Caste)...",
            searchClear: "Clear search",
            filterAll: "All Services",
            filterIdentity: "Identity & Travel",
            filterCertificates: "Certificates",
            filterEducation: "Education & Welfare",
            emptyTitle: "No matching services found",
            emptyDesc: "We couldn't find any services matching your search query. Please try different keywords or reset filters.",
            emptyReset: "Reset Filters",
            viewDetailsBtn: "View Details & Checklist",
            whatsappBtn: "WhatsApp Help",
            variantsLabel: "Options",
            items: {
                pan: {
                    title: "PAN Card",
                    desc: "Assistance with new PAN card applications (Form 49A) and corrections or updates to existing PAN details (name, date of birth, photo, or signature)."
                },
                voter: {
                    title: "Voter ID",
                    desc: "Assistance with new voter registration (Form 6), shifting of residence, and correction of entries in the electoral roll (Form 8)."
                },
                aadhaar: {
                    title: "Aadhaar Address Correction Assistance",
                    desc: "Guidance and online application assistance for demographic address updates with authorized documents or standard certification."
                },
                passport: {
                    title: "Indian Passport",
                    desc: "Application assistance for fresh Indian passports, re-issue/renewals, document verification guidance, and appointment booking."
                },
                income: {
                    title: "Income Certificate Application Assistance",
                    desc: "Assistance for obtaining official state income certificates through civic portals for academic admissions, fee concessions, and welfare schemes."
                },
                caste: {
                    title: "Caste Certificate Application Assistance",
                    desc: "Application facilitation for category and caste certificates through state citizen portals for educational and official benefits."
                },
                scholarship: {
                    title: "Scholarship Applications",
                    desc: "Assistance with State Scholarship Portal (SSP) and National Scholarship Portal (NSP) applications for eligible students."
                },
                more: {
                    title: "More Online Applications",
                    desc: "Assistance with citizen service portals, driving licenses (LLR/DL), ration card corrections, and official online welfare submissions."
                }
            },
            variants: {
                pan: {
                    new: "New PAN Card (Form 49A)",
                    correction: "PAN Card Correction / Update"
                },
                voter: {
                    new: "New Voter Registration (Form 6)",
                    correction: "Voter ID Correction / Shifting (Form 8)"
                },
                aadhaar: {
                    address: "Address Correction Assistance"
                },
                passport: {
                    fresh: "Fresh Passport Application",
                    renewal: "Passport Correction / Renewal"
                },
                income: {
                    standard: "Income Certificate Application"
                },
                caste: {
                    standard: "Caste Certificate Application"
                },
                scholarship: {
                    standard: "SSP / NSP Scholarship Portal"
                },
                more: {
                    general: "General Online Citizen Portals"
                }
            }
        },
        docs: {
            sslcMarksCard: "SSLC marks card",
            aadhaarCard: "Aadhaar Card",
            passportPhoto: "Passport-size photograph",
            signature: "Applicant signature",
            existingPan: "Existing PAN Card",
            existingVoter: "Existing Voter ID",
            existingPassport: "Existing Passport",
            passportIdProofAlt: "PAN Card, Voter ID or Driving Licence (as applicable)",
            vaForm: "VA / Panchayat / Mukhiya-signed form",
            prevIncomeCasteCerts: "Previous Income Certificate and Caste Certificate",
            incomeCert: "Income Certificate",
            maForm: "MA / Municipal-signed form",
            scholarshipAdditional: "Additional scheme-specific documents (e.g. fee receipt, college admission, bank passbook)",
            generalSupportingDoc: "Relevant supporting document or prior application reference",
            mandatoryBadge: "Required",
            optionalBadge: "Optional",
            alternativeBadge: "Alternative Option"
        },
        notes: {
            sslcAltPan: "If SSLC marks card is unavailable, alternative supporting documents (such as birth certificate or transfer certificate) may be accepted where applicable. Please contact Digital Seva to confirm the appropriate alternative.",
            sslcAltVoter: "If SSLC marks card is unavailable, alternative age and identity supporting documents may be accepted where applicable. Contact us to verify eligible alternatives.",
            panGeneral: "Please ensure all details match the official supporting records to prevent rejection on the portal.",
            voterGeneral: "Voter registration is subject to verification by the relevant Electoral Registration Officer (ERO).",
            aadhaarGeneral: "UIDAI requires valid documentary proof for address updates. Online submission requires Aadhaar OTP verification.",
            maFormFlag: "Important note: The wording 'MA / Municipal-signed form' is pending confirmation with the service owner before being published as a definitive UIDAI requirement. Digital Seva does not claim any non-standard municipal form is accepted by UIDAI.",
            passportAltInfo: "Only one valid identity and address proof is required among PAN Card, Voter ID, or Driving Licence. Not all alternatives are required.",
            passportGeneral: "Passport issuance is subject to verification by the Regional Passport Office and police verification authorities.",
            incomeGeneral: "Ensure the revenue officer or panchayat verification details are clear and legible.",
            prevCertsNote: "According to the owner's checklist, attaching previous income and caste certificates helps expedite validation.",
            casteScopeNote: "Digital Seva currently offers this application assistance specifically for Muslim applicants. This represents our business's current service focus and scope, not a universal government eligibility rule.",
            scholarshipGeneral: "Scholarship verification relies on institutional verification followed by departmental approval.",
            scholarshipAltNote: "Specific documents depend on the specific scholarship scheme (pre-matric, post-matric, minority, merit) and category.",
            moreGeneral: "For unlisted online services, contact us with your requirement and we will advise on eligibility, checklists, and portal procedures."
        },
        modal: {
            titlePrefix: "Service Details & Checklist",
            variantLabel: "Application Variant",
            checklistHeading: "Required & Supporting Document Checklist",
            notesHeading: "Important Notes & Alternative Guidance",
            twoOptionsHeading: "Choose How You Wish to Proceed",
            optionATitle: "Option A — Submit an Enquiry Online",
            optionADesc: "Fill out your details below. You can optionally upload documents (max 5 MB each: PDF, JPG, PNG) or submit without uploading any files.",
            optionBTitle: "Option B — Contact Directly via WhatsApp",
            optionBDesc: "Prefer not to upload anything? You can skip the form entirely and discuss your application directly with our representative on WhatsApp.",
            optionBBtn: "Chat on WhatsApp (+91 8660847792)",
            formNameLabel: "Full Name",
            formNamePlaceholder: "e.g. Ramesh Kumar",
            formPhoneLabel: "Mobile Phone Number",
            formPhonePlaceholder: "10-digit mobile number (e.g. 9876543210)",
            formPhoneHelp: "We will contact you on this number to assist with your application.",
            formNotesLabel: "Message / Specific Requirements (Optional)",
            formNotesPlaceholder: "Any specific notes, questions, or alternative document details...",
            uploadsHeading: "Optional Document Uploads",
            uploadsNotice: "Uploading documents is entirely optional. Maximum 5 MB per file. Allowed formats: PDF, JPG, JPEG, PNG. Your files are stored securely and never made public.",
            fileSelectBtn: "Choose File",
            fileSelectedLabel: "Selected:",
            removeFileBtn: "Remove",
            submitBtn: "Submit Enquiry",
            submittingBtn: "Submitting Enquiry...",
            privacyConsentText: "I consent to Digital Seva collecting my name, phone number, and optional documents solely to assist with my civic application. Records are accessible only to authorized Digital Seva staff and are automatically purged after 90 days (or upon manual request). No data is shared with third parties.",
            successTitle: "Enquiry Received Successfully!",
            successMessage: "Thank you for contacting Digital Seva. Your enquiry has been safely received. A representative will review your request and get in touch with you shortly.",
            successRefPrefix: "Reference ID:",
            closeSuccessBtn: "Done",
            closeBtn: "Close Modal",
            errValidation: "Please correct the highlighted fields before submitting.",
            errPhone: "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).",
            errFileSize: "File exceeds the 5 MB limit. Please select a smaller file.",
            errFileType: "Unsupported format. Only PDF, JPG, JPEG, and PNG files are accepted.",
            errNetwork: "Unable to connect to the enquiry service. You can use the WhatsApp button below to contact us directly.",
            errConsent: "Please agree to the privacy notice before submitting.",
            fallbackWhatsAppBtn: "Send via WhatsApp Instead"
        },
        howItWorks: {
            tag: "Simple Process",
            title: "How It Works",
            subtitle: "Getting application assistance is transparent, remote, and straightforward.",
            step1Title: "01 — SELECT",
            step1Desc: "Choose the service you need and review its detailed document checklist and eligibility alternatives.",
            step2Title: "02 — SHARE",
            step2Desc: "Upload documents optionally through our website, or skip uploading and message DIGITAL SEVA directly via WhatsApp.",
            step3Title: "03 — ASSISTANCE",
            step3Desc: "Receive personal one-on-one guidance to complete and file your online application accurately on the applicable portal.",
            step4Title: "04 — FOLLOW UP",
            step4Desc: "Contact DIGITAL SEVA for follow-up guidance regarding your application acknowledgement, status checks, or download instructions.",
            disclaimer: "Note: DIGITAL SEVA is an application facilitation service. Government processing timelines, scrutiny, and approvals remain solely under the authority of official government departments."
        },
        whyUs: {
            tag: "Our Standards",
            title: "Why Digital Seva",
            subtitle: "We prioritize honest guidance, customer convenience, and respectful service.",
            item1Title: "Remote Assistance",
            item1Desc: "Get complete online guidance from the comfort of your home without visiting crowded computer centers.",
            item2Title: "A Convenient Process",
            item2Desc: "Clear checklist verification, tailored instructions, and hassle-free coordination over phone and WhatsApp.",
            item3Title: "Clear Communication",
            item3Desc: "Bilingual assistance in English and Kannada. We explain portal procedures simply without confusing technical jargon.",
            item4Title: "Confidential Handling",
            item4Desc: "Your personal details and documents are handled with strict privacy and never shared or exposed publicly.",
            item5Title: "Personal Assistance",
            item5Desc: "Dedicated human support that takes the time to understand your individual application requirements and alternative documents.",
            transparencyNotice: "Transparency Pledge: DIGITAL SEVA is an independent private application assistance initiative. We do not claim government affiliation, guarantee official approvals, or use deceptive testimonials."
        },
        about: {
            tag: "About Us",
            title: "About Digital Seva",
            desc1: "Digital Seva is a dedicated online application assistance and facilitation initiative based in Karnataka. We assist citizens in navigating complex digital portals, understanding required documentation, and submitting accurate online applications for essential civic services.",
            desc2: "From PAN cards and voter registrations to passport guidance, income certificates, and scholarship portals, our mission is to eliminate confusion and make digital governance accessible to every applicant.",
            desc3: "We respect your time and confidentiality. Whether you prefer to upload files online or communicate directly over WhatsApp, our objective is to provide attentive, courteous, and dependable service.",
            serviceTypeLabel: "Service Type",
            serviceTypeValue: "Online Citizen Application Assistance (Independent Private Initiative)",
            phoneLabel: "Phone Support",
            emailLabel: "Email Support",
            directContactLabel: "Instant Support",
            whatsappLink: "WhatsApp (+91 8660847792)",
            availabilityLabel: "Working Hours",
            availabilityValue: "Monday – Saturday: 9:00 AM – 8:00 PM"
        },
        faq: {
            tag: "Common Questions",
            title: "Frequently Asked Questions",
            subtitle: "Clear and straightforward answers about our online application assistance.",
            q1: "Do I need to visit an office in person?",
            a1: "No. Digital Seva provides remote online application assistance. You can review requirements, share details, and receive guidance from anywhere via WhatsApp and our website.",
            q2: "How do I start an application?",
            a2: "Explore our Services Catalogue, choose your service, and click 'View Details & Checklist'. You can then either submit an enquiry form with optional uploads, or click 'Chat on WhatsApp' to begin immediately.",
            q3: "What documents may be required?",
            a3: "Required documents vary by service. Common documents include Aadhaar Card, SSLC marks card, and passport-size photographs. Each service card contains a detailed, specific checklist.",
            q4: "Are document uploads compulsory on this website?",
            a4: "No, uploads are never compulsory. You can submit an enquiry without attaching any files, or choose Option B to coordinate directly with us over WhatsApp.",
            q5: "What file formats and sizes are accepted?",
            a5: "For optional uploads, we accept PDF, JPG, JPEG, and PNG files up to 5 MB per individual file. Larger files should be compressed before uploading.",
            q6: "Can I contact DIGITAL SEVA through WhatsApp?",
            a6: "Yes, absolutely! You can contact us directly on WhatsApp at +91 8660847792. We provide prefilled messages based on your selected service for quick assistance.",
            q7: "Can requirements vary by application type?",
            a7: "Yes. For example, a fresh Indian Passport requires different documentation than a renewal, and alternative identity proofs may be accepted if standard documents like SSLC are unavailable.",
            q8: "Is DIGITAL SEVA a government website?",
            a8: "No. Digital Seva is an independent, private online application facilitation initiative. We are not a government agency, and we do not issue official certificates or guarantee approvals.",
            q9: "How is uploaded information handled?",
            a9: "Uploaded documents are stored in private, access-controlled storage outside the public web root. Only authorized personnel can review your application, and documents are never shared publicly or indexed by search engines."
        },
        contact: {
            tag: "Get In Touch",
            title: "Contact Digital Seva",
            subtitle: "Have a question about an online application? Reach out to us directly through phone, WhatsApp, or email.",
            phoneTitle: "Phone Call",
            phoneSub: "+91 8660847792",
            whatsappTitle: "WhatsApp Support",
            whatsappSub: "+91 8660847792 (Instant Response)",
            emailTitle: "Email",
            emailSub: "digitalseva7051@gmail.com",
            hoursTitle: "Service Hours",
            hoursSub: "Mon – Sat: 9:00 AM – 8:00 PM IST",
            directActionWhatsApp: "Message on WhatsApp",
            directActionCall: "Call Directly",
            directActionEmail: "Send Email"
        },
        footer: {
            rights: "All rights reserved.",
            subtitle: "Online Application Assistance Portal",
            quickLinksTitle: "Quick Navigation",
            legalTitle: "Transparency & Legal",
            disclaimerTitle: "Official Disclaimer",
            disclaimerText: "Digital Seva is an independent private application facilitation initiative. We are NOT affiliated with, sponsored by, or endorsed by any government department or UIDAI. Official government decisions, verification, and certificate issuances remain solely with the respective government authorities.",
            privacyNotice: "Privacy Notice: Customer contact details and optional uploaded documents are collected solely to assist with civic application preparation. Records are held confidentially, accessible only to authorized personnel, and retained for up to 90 days before automatic deletion.",
            templateNotice: "Base UI template licensed under MIT License — Copyright © 2025 Kiran Badave.",
            attributionLink: "MIT License Notice"
        }
    },

    kn: {
        site: {
            title: "ಡಿಜಿಟಲ್ ಸೇವಾ | ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಹಾಯ ಕೇಂದ್ರ",
            name: "ಡಿಜಿಟಲ್ ಸೇವಾ",
            tagline: "ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಹಾಯ ಕೇಂದ್ರ"
        },
        nav: {
            home: "ಮುಖಪುಟ",
            services: "ಸೇವೆಗಳು",
            howItWorks: "ಕಾರ್ಯವಿಧಾನ",
            whyUs: "ಡಿಜಿಟಲ್ ಸೇವಾ ಏಕೆ?",
            about: "ನಮ್ಮ ಬಗ್ಗೆ",
            faq: "ಪ್ರಶ್ನೋತ್ತರಗಳು",
            contact: "ಸಂಪರ್ಕ",
            themeToggle: "ಥೀಮ್ ಬದಲಾಯಿಸಿ",
            themeToDark: "ಡಾರ್ಕ್ ಥೀಮ್‌ಗೆ ಬದಲಾಯಿಸಿ",
            themeToLight: "ಲೈಟ್ ಥೀಮ್‌ಗೆ ಬದಲಾಯಿಸಿ",
            langSelector: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
            ctaWhatsApp: "ವಾಟ್ಸಾಪ್ ಸಹಾಯ",
            menuToggle: "ಮೆನು ತೆರೆಯಿರಿ / ಮುಚ್ಚಿ"
        },
        hero: {
            greeting: "ಡಿಜಿಟಲ್ ಸೇವಾ",
            name: "ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಹಾಯ ಕೇಂದ್ರ",
            subtitle: "ನಿಮ್ಮ ಆನ್‌ಲೈನ್ ಅರ್ಜಿಗಳು, ಇನ್ನಷ್ಟು ಸುಲಭ ಮತ್ತು ಸರಳ.",
            description: "ಮನೆಯಲ್ಲೇ ಕುಳಿತು ಅಗತ್ಯ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆಗಳಿಗೆ ಸೂಕ್ತ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ. ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ನಿಮ್ಮ ಅನುಕೂಲಕ್ಕೆ ತಕ್ಕಂತೆ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ ಮತ್ತು ಪೂರ್ಣ ಪ್ರಕ್ರಿಯೆಯುದ್ದಕ್ಕೂ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.",
            ctaWhatsApp: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಸಹಾಯ ಪಡೆಯಿರಿ",
            ctaServices: "ಸೇವೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
            contactDirect: "ಸಹಾಯವಾಣಿ / ವಾಟ್ಸಾಪ್",
            workflowTitle: "ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆ ಹಂತಗಳು",
            step1: "ದಾಖಲೆಗಳು",
            step1Desc: "ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ",
            step2: "ವಿವರಗಳು",
            step2Desc: "ವಿವರ ಹಂಚಿಕೆ ಅಥವಾ ಅಪ್‌ಲೋಡ್",
            step3: "ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಸಹಾಯ",
            step3Desc: "ತಜ್ಞ ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಸಲ್ಲಿಕೆ",
            step4: "ದೃಢೀಕರಣ",
            step4Desc: "ಸ್ವೀಕೃತಿ ಮತ್ತು ರಶೀದಿ ವಿವರ",
            trustNotice: "ಸ್ವತಂತ್ರ ಖಾಸಗಿ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಹಾಯ ಕೇಂದ್ರ. ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರಗಳು ಮತ್ತು ಅನುಮೋದನೆಗಳು ಸಂಬಂಧಪಟ್ಟ ಸರ್ಕಾರಿ ಇಲಾಖೆಗಳಿಂದಲೇ ನೀಡಲ್ಪಡುತ್ತವೆ.",
            scrollDown: "ಕೆಳಗೆ ಸ್ಕ್ರಾಲ್ ಮಾಡಿ"
        },
        services: {
            tag: "ಸೇವಾ ಪಟ್ಟಿ",
            title: "ಆನ್‌ಲೈನ್ ನಾಗರಿಕ ಅರ್ಜಿ ಸೇವೆಗಳು",
            subtitle: "ನಾವು ಬೆಂಬಲಿಸುವ ಎಂಟು ಪ್ರಮುಖ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸೇವೆಗಳಿಂದ ಆಯ್ಕೆಮಾಡಿ. ದಾಖಲೆಗಳ ಪಟ್ಟಿ ನೋಡಲು ಅಥವಾ ವಿಚಾರಣೆ ಸಲ್ಲಿಸಲು ಯಾವುದೇ ಕಾರ್ಡ್ ಅನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            searchPlaceholder: "ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ (ಉದಾ: ಪ್ಯಾನ್, ವೋಟರ್, ಪಾಸ್‌ಪೋರ್ಟ್, ಆದಾಯ, ಜಾತಿ)...",
            searchClear: "ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ",
            filterAll: "ಎಲ್ಲ ಸೇವೆಗಳು",
            filterIdentity: "ಗುರುತು & ಪ್ರಯಾಣ",
            filterCertificates: "ಪ್ರಮಾಣಪತ್ರಗಳು",
            filterEducation: "ಶಿಕ್ಷಣ & ಕಲ್ಯಾಣ",
            emptyTitle: "ಯಾವುದೇ ಸೇವೆ ಕಂಡುಬಂದಿಲ್ಲ",
            emptyDesc: "ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ಸೇವೆ ದೊರೆತಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಪದಗಳನ್ನು ಬಳಸಿ ಅಥವಾ ಫಿಲ್ಟರ್ ಮರುಹೊಂದಿಸಿ.",
            emptyReset: "ಫಿಲ್ಟರ್ ಮರುಹೊಂದಿಸಿ",
            viewDetailsBtn: "ವಿವರಗಳು ಮತ್ತು ದಾಖಲೆಗಳ ಪಟ್ಟಿ",
            whatsappBtn: "ವಾಟ್ಸಾಪ್ ಸಹಾಯ",
            variantsLabel: "ಆಯ್ಕೆಗಳು",
            items: {
                pan: {
                    title: "ಪ್ಯಾನ್ ಕಾರ್ಡ್",
                    desc: "ಹೊಸ ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಅರ್ಜಿ (ಫಾರ್ಮ್ 49A) ಹಾಗೂ ಹೆಸರು, ಜನ್ಮ ದಿನಾಂಕ, ಭಾವಚಿತ್ರ ಮತ್ತು ಸಹಿ ತಿದ್ದುಪಡಿ ಸೇವೆಗಳಿಗೆ ಸಂಪೂರ್ಣ ಮಾರ್ಗದರ್ಶನ."
                },
                voter: {
                    title: "ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ",
                    desc: "ಹೊಸ ಮತದಾರರ ನೋಂದಣಿ (ಫಾರ್ಮ್ 6), ವಿಳಾಸ ಬದಲಾವಣೆ ಹಾಗೂ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ತಿದ್ದುಪಡಿ (ಫಾರ್ಮ್ 8) ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಸಹಾಯ."
                },
                aadhaar: {
                    title: "ಆಧಾರ್ ವಿಳಾಸ ತಿದ್ದುಪಡಿ ಸಹಾಯ",
                    desc: "ಮಾನ್ಯತೆ ಪಡೆದ ವಿಳಾಸ ಪುರಾವೆ ಅಥವಾ ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರದೊಂದಿಗೆ ಆನ್‌ಲೈನ್ ಆಧಾರ್ ವಿಳಾಸ ಬದಲಾವಣೆಗೆ ಮಾರ್ಗದರ್ಶನ."
                },
                passport: {
                    title: "ಭಾರತೀಯ ಪಾಸ್‌ಪೋರ್ಟ್",
                    desc: "ಹೊಸ ಪಾಸ್‌ಪೋರ್ಟ್ ಅರ್ಜಿ, ನವೀಕರಣ/ಮರುಪಡೆಯುವಿಕೆ, ದಾಖಲೆ ಪರಿಶೀಲನೆ ಮತ್ತು ಪಾಸ್‌ಪೋರ್ಟ್ ಸೇವಾ ಕೇಂದ್ರದ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕಿಂಗ್ ಸಹಾಯ."
                },
                income: {
                    title: "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಅರ್ಜಿ ಸಹಾಯ",
                    desc: "ಶೈಕ್ಷಣಿಕ ಪ್ರವೇಶ, ಶುಲ್ಕ ವಿನಾಯಿತಿ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಸೌಲಭ್ಯಕ್ಕಾಗಿ ಆನ್‌ಲೈನ್ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಅರ್ಜಿ ಸೇವೆ."
                },
                caste: {
                    title: "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಅರ್ಜಿ ಸಹಾಯ",
                    desc: "ವಿವಿಧ ವರ್ಗ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರಗಳಿಗಾಗಿ ನಾಡಕಚೇರಿ/ಸೇವಾ ಸಿಂಧು ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಸಹಾಯ."
                },
                scholarship: {
                    title: "ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಗಳು",
                    desc: "ಅರ್ಹ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (SSP) ಮತ್ತು ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (NSP) ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಸಹಾಯ."
                },
                more: {
                    title: "ಇತರ ಆನ್‌ಲೈನ್ ಅರ್ಜಿಗಳು",
                    desc: "ಚಾಲನಾ ಪರವಾನಗಿ (DL/LLR), ಪಡಿತರ ಚೀಟಿ ತಿದ್ದುಪಡಿ ಹಾಗೂ ವಿವಿಧ ಸರ್ಕಾರಿ ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್ ಅರ್ಜಿಗಳಿಗೆ ಸಹಾಯ."
                }
            },
            variants: {
                pan: {
                    new: "ಹೊಸ ಪ್ಯಾನ್ ಕಾರ್ಡ್ (ಫಾರ್ಮ್ 49A)",
                    correction: "ಪ್ಯಾನ್ ಕಾರ್ಡ್ ತಿದ್ದುಪಡಿ / ಬದಲಾವಣೆ"
                },
                voter: {
                    new: "ಹೊಸ ಮತದಾರರ ನೋಂದಣಿ (ಫಾರ್ಮ್ 6)",
                    correction: "ಮತದಾರರ ಚೀಟಿ ತಿದ್ದುಪಡಿ / ಸ್ಥಳ ಬದಲಾವಣೆ (ಫಾರ್ಮ್ 8)"
                },
                aadhaar: {
                    address: "ವಿಳಾಸ ತಿದ್ದುಪಡಿ ಸಹಾಯ"
                },
                passport: {
                    fresh: "ಹೊಸ ಪಾಸ್‌ಪೋರ್ಟ್ ಅರ್ಜಿ",
                    renewal: "ಪಾಸ್‌ಪೋರ್ಟ್ ತಿದ್ದುಪಡಿ / ನವೀಕರಣ"
                },
                income: {
                    standard: "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಅರ್ಜಿ"
                },
                caste: {
                    standard: "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಅರ್ಜಿ"
                },
                scholarship: {
                    standard: "SSP / NSP ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್"
                },
                more: {
                    general: "ಇತರ ಸಾರ್ವಜನಿಕ ಆನ್‌ಲೈನ್ ಪೋರ್ಟಲ್‌ಗಳು"
                }
            }
        },
        docs: {
            sslcMarksCard: "ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ (SSLC) ಅಂಕಪಟ್ಟಿ",
            aadhaarCard: "ಆಧಾರ್ ಕಾರ್ಡ್",
            passportPhoto: "ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಭಾವಚಿತ್ರ",
            signature: "ಅರ್ಜಿದಾರರ ಸಹಿ",
            existingPan: "ಹಾಲಿ ಪ್ಯಾನ್ ಕಾರ್ಡ್",
            existingVoter: "ಹಾಲಿ ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ",
            existingPassport: "ಹಾಲಿ ಪಾಸ್‌ಪೋರ್ಟ್",
            passportIdProofAlt: "ಪ್ಯಾನ್ ಕಾರ್ಡ್, ಮತದಾರರ ಚೀಟಿ ಅಥವಾ ಚಾಲನಾ ಪರವಾನಗಿ (ಯಾವುದಾದರೂ ಒಂದು)",
            vaForm: "ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿ (VA) / ಪಂಚಾಯತ್ / ಮುಖಿಯಾ ಸಹಿ ಮಾಡಿದ ನಮೂನೆ",
            prevIncomeCasteCerts: "ಹಿಂದಿನ ಆದಾಯ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ",
            incomeCert: "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ",
            maForm: "ಎಂ.ಎ (MA) / ಪುರಸಭೆ ದೃಢೀಕೃತ ನಮೂನೆ",
            scholarshipAdditional: "ಯೋಜನೆಗೆ ಸಂಬಂಧಿಸಿದ ಹೆಚ್ಚುವರಿ ದಾಖಲೆಗಳು (ಕಾಲೇಜು ಶುಲ್ಕ ರಶೀದಿ, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್)",
            generalSupportingDoc: "ಸಂಬಂಧಿತ ಪೂರಕ ದಾಖಲೆ ಅಥವಾ ಹಿಂದಿನ ಅರ್ಜಿ ವಿವರ",
            mandatoryBadge: "ಕಡ್ಡಾಯ",
            optionalBadge: "ಐಚ್ಛಿಕ",
            alternativeBadge: "ಪರ್ಯಾಯ ದಾಖಲೆ"
        },
        notes: {
            sslcAltPan: "ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ ಅಂಕಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲದಿದ್ದರೆ, ನಿಯಮಾನುಸಾರ ಪರ್ಯಾಯ ದಾಖಲೆಗಳನ್ನು (ಜನನ ಪ್ರಮಾಣಪತ್ರ ಇತ್ಯಾದಿ) ಸ್ವೀಕರಿಸಬಹುದು. ಸೂಕ್ತ ಪರ್ಯಾಯಕ್ಕಾಗಿ ಡಿಜಿಟಲ್ ಸೇವಾವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            sslcAltVoter: "ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ ಅಂಕಪಟ್ಟಿ ಲಭ್ಯವಿಲ್ಲದಿದ್ದಲ್ಲಿ ವಯಸ್ಸು ಮತ್ತು ಗುರುತಿನ ಪರ್ಯಾಯ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.",
            panGeneral: "ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ತಿರಸ್ಕೃತವಾಗದಂತೆ ಎಲ್ಲಾ ವಿವರಗಳು ಅಧಿಕೃತ ದಾಖಲೆಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
            voterGeneral: "ಮತದಾರರ ನೋಂದಣಿಯು ಚುನಾವಣಾ ನೋಂದಣಿ ಅಧಿಕಾರಿಗಳ (ERO) ಪರಿಶೀಲನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ.",
            aadhaarGeneral: "ವಿಳಾಸ ಬದಲಾವಣೆಗಾಗಿ UIDAI ನಿಯಮಾವಳಿ ಪ್ರಕಾರ ಮಾನ್ಯ ದಾಖಲೆ ಅಗತ್ಯ. ಆನ್‌ಲೈನ್ ಸಲ್ಲಿಕೆಗೆ ಆಧಾರ್ ಒಟಿಪಿ (OTP) ಅಗತ್ಯವಿರುತ್ತದೆ.",
            maFormFlag: "ವಿಶೇಷ ಗಮನಿಸಿ: 'MA / ಪುರಸಭೆ ಸಹಿ ಮಾಡಿದ ನಮೂನೆ' ಎಂಬ ಉಲ್ಲೇಖವು ಮಾಲೀಕರಿಂದ ದೃಢೀಕರಿಸಲ್ಪಡಬೇಕಾಗಿದೆ. ಯಾವುದೇ ಪುರಸಭಾ ನಮೂನೆಯನ್ನು UIDAI ಒಪ್ಪುತ್ತದೆ ಎಂದು ನಾವು ಭರವಸೆ ನೀಡುವುದಿಲ್ಲ; ಅಧಿಕೃತ ಸ್ವರೂಪವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುವುದು.",
            passportAltInfo: "ಪ್ಯಾನ್ ಕಾರ್ಡ್, ಮತದಾರರ ಚೀಟಿ ಅಥವಾ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಇವುಗಳಲ್ಲಿ ಯಾವುದಾದರೂ ಒಂದು ಮಾನ್ಯ ಗುರುತಿನ ಪುರಾವೆ ಸಾಕು. ಎಲ್ಲವೂ ಕಡ್ಡಾಯವಲ್ಲ.",
            passportGeneral: "ಪಾಸ್‌ಪೋರ್ಟ್ ವಿತರಣೆಯು ಪ್ರಾದೇಶಿಕ ಪಾಸ್‌ಪೋರ್ಟ್ ಕಚೇರಿ ಮತ್ತು ಪೊಲೀಸ್ ತನಿಖಾಧಿಕಾರಿಗಳ ಪರಿಶೀಲನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ.",
            incomeGeneral: "ಕಂದಾಯ ಅಧಿಕಾರಿ ಅಥವಾ ಪಂಚಾಯತ್ ಪರಿಶೀಲನೆಯ ವಿವರಗಳು ಸ್ಪಷ್ಟವಾಗಿರಬೇಕು.",
            prevCertsNote: "ಮಾಲೀಕರ ಸೂಚನೆ ಪ್ರಕಾರ, ಹಿಂದಿನ ಆದಾಯ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಲಗತ್ತಿಸುವುದರಿಂದ ಪರಿಶೀಲನೆ ಪ್ರಕ್ರಿಯೆ ಸುಲಭವಾಗುತ್ತದೆ.",
            casteScopeNote: "ಡಿಜಿಟಲ್ ಸೇವಾ ಪ್ರಸ್ತುತ ಮುಸ್ಲಿಂ ಅರ್ಜಿದಾರರಿಗೆ ಮಾತ್ರ ಈ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಸಹಾಯವನ್ನು ಒದಗಿಸುತ್ತಿದೆ. ಇದು ನಮ್ಮ ಸಂಸ್ಥೆಯ ಸದ್ಯದ ಸೇವಾ ವ್ಯಾಪ್ತಿಯಾಗಿದ್ದು, ಸಾರ್ವಜನಿಕ ಸರ್ಕಾರಿ ನಿಯಮವಲ್ಲ.",
            scholarshipGeneral: "ವಿದ್ಯಾರ್ಥಿವೇತನದ ಮಂಜೂರಾತಿಯು ಕಾಲೇಜು ಮತ್ತು ಸಂಬಂಧಿತ ಇಲಾಖೆಯ ಪರಿಶೀಲನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ.",
            scholarshipAltNote: "ಹೆಚ್ಚುವರಿ ದಾಖಲೆಗಳು ವಿದ್ಯಾರ್ಥಿವೇತನದ ಯೋಜನೆ (ಮೆಟ್ರಿಕ್ ಪೂರ್ವ, ಮೆಟ್ರಿಕ್ ನಂತರ, ಅಲ್ಪಸಂಖ್ಯಾತ) ಮತ್ತು ವರ್ಗವನ್ನು ಅವಲಂಬಿಸಿರುತ್ತದೆ.",
            moreGeneral: "ಇಲ್ಲಿ ಪಟ್ಟಿ ಮಾಡದ ಇತರ ಆನ್‌ಲೈನ್ ಸೇವೆಗಳಿಗಾಗಿ, ನಿಮ್ಮ ಅಗತ್ಯದೊಂದಿಗೆ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ. ನಾವು ಸೂಕ್ತ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇವೆ."
        },
        modal: {
            titlePrefix: "ಸೇವಾ ವಿವರಗಳು ಮತ್ತು ದಾಖಲೆಗಳ ಪಟ್ಟಿ",
            variantLabel: "ಅರ್ಜಿ ಪ್ರಕಾರ",
            checklistHeading: "ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",
            notesHeading: "ಪ್ರಮುಖ ಸೂಚನೆಗಳು ಮತ್ತು ಪರ್ಯಾಯ ದಾಖಲೆ ವಿವರ",
            twoOptionsHeading: "ನಿಮಗೆ ಸೂಕ್ತವಾದ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
            optionATitle: "ವಿಧಾನ ಎ — ಆನ್‌ಲೈನ್ ಮೂಲಕ ವಿಚಾರಣೆ ಸಲ್ಲಿಸಿ",
            optionADesc: "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಕೆಳಗೆ ಭರ್ತಿ ಮಾಡಿ. ನೀವು ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು (ಪ್ರತಿ ಕಡತ ಗರಿಷ್ಠ 5 MB: PDF, JPG, PNG) ಅಥವಾ ಯಾವುದೇ ಕಡತವಿಲ್ಲದೆಯೂ ಸಲ್ಲಿಸಬಹುದು.",
            optionBTitle: "ವಿಧಾನ ಬಿ — ನೇರವಾಗಿ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಸಂಪರ್ಕಿಸಿ",
            optionBDesc: "ದಾಖಲೆಗಳನ್ನು ಇಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಇಷ್ಟವಿಲ್ಲವೇ? ನೀವು ಫಾರ್ಮ್ ಅನ್ನು ಬಿಟ್ಟು ನೇರವಾಗಿ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ ಮಾತನಾಡಬಹುದು.",
            optionBBtn: "ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ (+91 8660847792)",
            formNameLabel: "ಪೂರ್ಣ ಹೆಸರು",
            formNamePlaceholder: "ಉದಾ: ರಮೇಶ್ ಕುಮಾರ್",
            formPhoneLabel: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
            formPhonePlaceholder: "10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಉದಾ: 9876543210)",
            formPhoneHelp: "ನಿಮ್ಮ ಅರ್ಜಿಗೆ ಸಹಾಯ ಮಾಡಲು ನಾವು ಈ ಸಂಖ್ಯೆಗೆ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ.",
            formNotesLabel: "ಸಂದೇಶ / ಹೆಚ್ಚುವರಿ ವಿವರಗಳು (ಐಚ್ಛಿಕ)",
            formNotesPlaceholder: "ಯಾವುದಾದರೂ ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ವಿವರಗಳಿದ್ದರೆ ಇಲ್ಲಿ ಬರೆಯಿರಿ...",
            uploadsHeading: "ದಾಖಲೆಗಳ ಅಪ್‌ಲೋಡ್ (ಐಚ್ಛಿಕ)",
            uploadsNotice: "ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದು ಸಂಪೂರ್ಣ ಐಚ್ಛಿಕ. ಪ್ರತಿ ಕಡತ ಗರಿಷ್ಠ 5 MB. ಮಾನ್ಯ ನಮೂನೆಗಳು: PDF, JPG, JPEG, PNG. ನಿಮ್ಮ ಕಡತಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ರಕ್ಷಿಸಲಾಗುತ್ತದೆ.",
            fileSelectBtn: "ಕಡತ ಆಯ್ಕೆಮಾಡಿ",
            fileSelectedLabel: "ಆಯ್ಕೆಯಾದ ಕಡತ:",
            removeFileBtn: "ತೆಗೆದುಹಾಕಿ",
            submitBtn: "ವಿಚಾರಣೆ ಸಲ್ಲಿಸಿ",
            submittingBtn: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...",
            privacyConsentText: "ನನ್ನ ಅರ್ಜಿ ಸಹಾಯಕ್ಕಾಗಿ ಮಾತ್ರ ನನ್ನ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಐಚ್ಛಿಕ ದಾಖಲೆಗಳನ್ನು ಡಿಜಿಟಲ್ ಸೇವಾ ಸಂಗ್ರಹಿಸಲು ನಾನು ಸಮ್ಮತಿಸುತ್ತೇನೆ. ಈ ವಿವರಗಳನ್ನು ಕೇವಲ ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಮಾತ್ರ ನಿರ್ವಹಿಸುತ್ತಾರೆ ಮತ್ತು 90 ದಿನಗಳ ನಂತರ (ಅಥವಾ ವಿನಂತಿಯ ಮೇರೆಗೆ) ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅಳಿಸಲಾಗುತ್ತದೆ. ಯಾವುದೇ ಮಾಹಿತಿಯನ್ನು ಇತರರಿಗೆ ಹಂಚಿಕೊಳ್ಳಲಾಗುವುದಿಲ್ಲ.",
            successTitle: "ವಿಚಾರಣೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!",
            successMessage: "ಡಿಜಿಟಲ್ ಸೇವಾವನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ನಮ್ಮ ಪ್ರತಿನಿಧಿ ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.",
            successRefPrefix: "ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ:",
            closeSuccessBtn: "ಮುಗಿಯಿತು",
            closeBtn: "ಮುಚ್ಚಿ",
            errValidation: "ದಯವಿಟ್ಟು ಅಗತ್ಯವಿರುವ ವಿವರಗಳನ್ನು ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಿ.",
            errPhone: "ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (6, 7, 8 ಅಥವಾ 9 ರಿಂದ ಪ್ರಾರಂಭವಾಗಬೇಕು).",
            errFileSize: "ಕಡತದ ಗಾತ್ರ 5 MB ಮಿತಿಗಿಂತ ಹೆಚ್ಚಾಗಿದೆ. ದಯವಿಟ್ಟು ಚಿಕ್ಕ ಕಡತವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            errFileType: "ಅಮಾನ್ಯ ಕಡತ ನಮೂನೆ. PDF, JPG, JPEG ಮತ್ತು PNG ಕಡತಗಳನ್ನು ಮಾತ್ರ ಸ್ವೀಕರಿಸಲಾಗುತ್ತದೆ.",
            errNetwork: "ಸರ್ವರ್ ಸಂಪರ್ಕ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ಕೆಳಗಿನ ವಾಟ್ಸಾಪ್ ಬಟನ್ ಬಳಸಿ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.",
            errConsent: "ಸಲ್ಲಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ಗೌಪ್ಯತೆ ಸಮ್ಮತಿಯನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ.",
            fallbackWhatsAppBtn: "ವಾಟ್ಸಾಪ್ ಮೂಲಕವೇ ಕಳುಹಿಸಿ"
        },
        howItWorks: {
            tag: "ಸರಳ ಹಂತಗಳು",
            title: "ಕಾರ್ಯವಿಧಾನ",
            subtitle: "ಮನೆಯಲ್ಲೇ ಕುಳಿತು ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಹಾಯ ಪಡೆಯುವುದು ಅತ್ಯಂತ ಸರಳ ಮತ್ತು ಪಾರದರ್ಶಕ.",
            step1Title: "01 — ಆಯ್ಕೆಮಾಡಿ",
            step1Desc: "ನಿಮಗೆ ಬೇಕಾದ ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಅದರ ವಿವರವಾದ ದಾಖಲೆಗಳ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
            step2Title: "02 — ಹಂಚಿಕೊಳ್ಳಿ",
            step2Desc: "ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ದಾಖಲೆಗಳನ್ನು ಐಚ್ಛಿಕವಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಅಥವಾ ನೇರವಾಗಿ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಡಿಜಿಟಲ್ ಸೇವಾವನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            step3Title: "03 — ಅರ್ಜಿ ಸಹಾಯ",
            step3Desc: "ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ನಿಖರವಾಗಿ ಭರ್ತಿ ಮಾಡಲು ಮತ್ತು ಸಲ್ಲಿಸಲು ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.",
            step4Title: "04 — ಮುಂದುವರಿದ ನೆರವು",
            step4Desc: "ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯ ನಂತರ ಸ್ವೀಕೃತಿ ರಶೀದಿ (Acknowledgement), ಸ್ಥಿತಿ ಪರಿಶೀಲನೆ ಅಥವಾ ಡೌನ್‌ಲೋಡ್ ಸಹಾಯಕ್ಕಾಗಿ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            disclaimer: "ಗಮನಿಸಿ: ಡಿಜಿಟಲ್ ಸೇವಾ ಕೇವಲ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಸಹಾಯ ಕೇಂದ್ರವಾಗಿದೆ. ಅರ್ಜಿ ಪರಿಶೀಲನೆ ಮತ್ತು ಅನುಮೋದನೆಗಳು ಸಂಬಂಧಪಟ್ಟ ಸರ್ಕಾರಿ ಪ್ರಾಧಿಕಾರಗಳ ವ್ಯಾಪ್ತಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ."
        },
        whyUs: {
            tag: "ನಮ್ಮ ಗುಣಮಟ್ಟ",
            title: "ಡಿಜಿಟಲ್ ಸೇವಾ ಏಕೆ?",
            subtitle: "ಪ್ರಾಮಾಣಿಕ ಮಾರ್ಗದರ್ಶನ, ಗ್ರಾಹಕರ ಗೌಪ್ಯತೆ ಮತ್ತು ನಂಬಿಕಸ್ಥ ಸೇವೆಯೇ ನಮ್ಮ ಆದ್ಯತೆ.",
            item1Title: "ಮನೆಯಿಂದಲೇ ಸಹಾಯ",
            item1Desc: "ಗಂಟೆಗಟ್ಟಲೆ ಸರತಿಯಲ್ಲಿ ನಿಲ್ಲದೆ, ಕಚೇರಿಗಳಿಗೆ ಅಲೆಯದೆ ಮನೆಯಲ್ಲೇ ಕುಳಿತು ಸಂಪೂರ್ಣ ಆನ್‌ಲೈನ್ ನೆರವು ಪಡೆಯಿರಿ.",
            item2Title: "ಸುಲಭ ಮತ್ತು ಅನುಕೂಲಕರ",
            item2Desc: "ಸ್ಪಷ್ಟ ದಾಖಲೆ ಪರಿಶೀಲನೆ ಮತ್ತು ಫೋನ್ ಅಥವಾ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಸುಲಭ ಸಮನ್ವಯ.",
            item3Title: "ಸ್ಪಷ್ಟ ಸಂವಹನ",
            item3Desc: "ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸುಲಭವಾಗಿ ಅರ್ಥವಾಗುವ ಮಾಹಿತಿ. ಗೊಂದಲವಿಲ್ಲದ ನೇರ ಮಾರ್ಗದರ್ಶನ.",
            item4Title: "ಗೌಪ್ಯತೆ ಮತ್ತು ಸುರಕ್ಷತೆ",
            item4Desc: "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಅತ್ಯಂತ ಜವಾಬ್ದಾರಿಯುತವಾಗಿ ಮತ್ತು ಗೌಪ್ಯವಾಗಿ ರಕ್ಷಿಸಲಾಗುತ್ತದೆ.",
            item5Title: "ವೈಯಕ್ತಿಕ ಕಾಳಜಿ",
            item5Desc: "ಪ್ರತಿಯೊಬ್ಬ ಅರ್ಜಿದಾರರ ದಾಖಲೆಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಪರ್ಯಾಯ ದಾಖಲೆಗಳಿಗೂ ಸೂಕ್ತ ಪರಿಹಾರ ಒದಗಿಸುವ ಕಾಳಜಿ.",
            transparencyNotice: "ಪಾರದರ್ಶಕತೆಯ ಭರವಸೆ: ಡಿಜಿಟಲ್ ಸೇವಾ ಸ್ವತಂತ್ರ ಖಾಸಗಿ ಆನ್‌ಲೈನ್ ಸೇವಾ ಕೇಂದ್ರವಾಗಿದೆ. ನಾವು ಯಾವುದೇ ಸುಳ್ಳು ಭರವಸೆಗಳು ಅಥವಾ ಸರ್ಕಾರಿ ಪ್ರಾಧಿಕಾರದ ಸೋಗು ಹಾಕುವುದಿಲ್ಲ."
        },
        about: {
            tag: "ಪರಿಚಯ",
            title: "ಡಿಜಿಟಲ್ ಸೇವಾ ಬಗ್ಗೆ",
            desc1: "ಡಿಜಿಟಲ್ ಸೇವಾ ಕರ್ನಾಟಕದ ನಾಗರಿಕರಿಗೆ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಲ್ಲಿ ನೆರವಾಗುವ ಸಮರ್ಪಿತ ಖಾಸಗಿ ಸೇವಾ ಕೇಂದ್ರವಾಗಿದೆ. ಸಂಕೀರ್ಣ ಡಿಜಿಟಲ್ ಪೋರ್ಟಲ್‌ಗಳನ್ನು ಬಳಸಲು, ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಮತ್ತು ನಿಖರವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ನಾವು ನೆರವಾಗುತ್ತೇವೆ.",
            desc2: "ಪ್ಯಾನ್ ಕಾರ್ಡ್, ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ, ಪಾಸ್‌ಪೋರ್ಟ್ ಮಾರ್ಗದರ್ಶನ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಹಾಗೂ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಗಳು ಹೀಗೆ ಪ್ರತಿಯೊಂದು ಸೇವೆಗೂ ನಾವು ಹಂತ-ಹಂತದ ನೆರವು ನೀಡುತ್ತೇವೆ.",
            desc3: "ನಿಮ್ಮ ಸಮಯ ಮತ್ತು ಗೌಪ್ಯತೆಯನ್ನು ನಾವು ಗೌರವಿಸುತ್ತೇವೆ. ವೆಬ್‌ಸೈಟ್ ಮೂಲಕವಾಗಲಿ ಅಥವಾ ವಾಟ್ಸಾಪ್ ಮೂಲಕವಾಗಲಿ, ವಿಶ್ವಾಸಾರ್ಹ ಮತ್ತು ಸೌಜನ್ಯದ ಸೇವೆಯನ್ನು ಒದಗಿಸುವುದೇ ನಮ್ಮ ಗುರಿ.",
            serviceTypeLabel: "ಸೇವಾ ಪ್ರಕಾರ",
            serviceTypeValue: "ಆನ್‌ಲೈನ್ ನಾಗರಿಕ ಅರ್ಜಿ ಸಹಾಯ (ಸ್ವತಂತ್ರ ಖಾಸಗಿ ಉಪಕ್ರಮ)",
            phoneLabel: "ದೂರವಾಣಿ ಸಹಾಯ",
            emailLabel: "ಇಮೇಲ್ ಸಹಾಯ",
            directContactLabel: "ನೇರ ಸಹಾಯ",
            whatsappLink: "ವಾಟ್ಸಾಪ್ (+91 8660847792)",
            availabilityLabel: "ಸೇವಾ ಸಮಯ",
            availabilityValue: "ಸೋಮವಾರ – ಶನಿವಾರ: ಬೆಳಗ್ಗೆ 9:00 ರಿಂದ ರಾತ್ರಿ 8:00 ರವರೆಗೆ"
        },
        faq: {
            tag: "ಪ್ರಶ್ನೋತ್ತರಗಳು",
            title: "ಸಾಮಾನ್ಯವಾಗಿ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು",
            subtitle: "ನಮ್ಮ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಹಾಯದ ಬಗ್ಗೆ ಸ್ಪಷ್ಟ ಮತ್ತು ನೇರ ಉತ್ತರಗಳು.",
            q1: "ನಾನು ಕಚೇರಿಗೆ ಖುದ್ದಾಗಿ ಭೇಟಿ ನೀಡಬೇಕೇ?",
            a1: "ಅಗತ್ಯವಿಲ್ಲ. ಡಿಜಿಟಲ್ ಸೇವಾ ದೂರಸಂಪರ್ಕದ ಮೂಲಕ ಸಂಪೂರ್ಣ ಆನ್‌ಲೈನ್ ನೆರವು ನೀಡುತ್ತದೆ. ನೀವು ಮನೆಯಲ್ಲೇ ಕುಳಿತು ವೆಬ್‌ಸೈಟ್ ಮತ್ತು ವಾಟ್ಸಾಪ್ ಮೂಲಕವೇ ಎಲ್ಲ ವಿವರಗಳನ್ನು ಪಡೆಯಬಹುದು.",
            q2: "ಅರ್ಜಿಯನ್ನು ಪ್ರಾರಂಭಿಸುವುದು ಹೇಗೆ?",
            a2: "ನಮ್ಮ ಸೇವಾ ಪಟ್ಟಿಯನ್ನು ವೀಕ್ಷಿಸಿ, ನಿಮಗೆ ಬೇಕಾದ ಸೇವೆಯ ಕಾರ್ಡ್‌ನಲ್ಲಿ 'ವಿವರಗಳು ಮತ್ತು ದಾಖಲೆಗಳ ಪಟ್ಟಿ' ಕ್ಲಿಕ್ ಮಾಡಿ. ಅಲ್ಲಿ ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಬಹುದು ಅಥವಾ 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ' ಕ್ಲಿಕ್ ಮಾಡಿ ನೇರವಾಗಿ ಪ್ರಾರಂಭಿಸಬಹುದು.",
            q3: "ಯಾವ ದಾಖಲೆಗಳು ಬೇಕಾಗಬಹುದು?",
            a3: "ಅಗತ್ಯ ದಾಖಲೆಗಳು ಸೇವೆಗೆ ತಕ್ಕಂತೆ ಬದಲಾಗುತ್ತವೆ. ಸಾಮಾನ್ಯವಾಗಿ ಆಧಾರ್ ಕಾರ್ಡ್, ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ ಅಂಕಪಟ್ಟಿ ಮತ್ತು ಭಾವಚಿತ್ರ ಅಗತ್ಯವಿರುತ್ತದೆ. ಪ್ರತಿ ಸೇವೆಗೂ ಪ್ರತ್ಯೇಕ ದಾಖಲೆ ಪಟ್ಟಿ ನೀಡಲಾಗಿದೆ.",
            q4: "ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದು ಕಡ್ಡಾಯವೇ?",
            a4: "ಖಂಡಿತ ಇಲ್ಲ! ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡುವುದು ಕಡ್ಡಾಯವಲ್ಲ. ನೀವು ಯಾವುದೇ ಕಡತ ಲಗತ್ತಿಸದೆಯೂ ವಿಚಾರಣೆ ಸಲ್ಲಿಸಬಹುದು ಅಥವಾ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಬಹುದು.",
            q5: "ಯಾವ ಕಡತ ನಮೂನೆ ಮತ್ತು ಗಾತ್ರ ಸ್ವೀಕಾರಾರ್ಹ?",
            a5: "ಐಚ್ಛಿಕ ಅಪ್‌ಲೋಡ್‌ಗಾಗಿ PDF, JPG, JPEG ಮತ್ತು PNG ಕಡತಗಳನ್ನು ಸ್ವೀಕರಿಸಲಾಗುತ್ತದೆ. ಪ್ರತಿ ಕಡತದ ಗರಿಷ್ಠ ಗಾತ್ರ 5 MB ಮೀರಬಾರದು.",
            q6: "ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಡಿಜಿಟಲ್ ಸೇವಾವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದೇ?",
            a6: "ಹೌದು, ಖಂಡಿತವಾಗಿ! ನೀವು +91 8660847792 ಸಂಖ್ಯೆಗೆ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ನೇರವಾಗಿ ಸಂದೇಶ ಕಳುಹಿಸಬಹುದು. ತಕ್ಷಣದ ಸಹಾಯಕ್ಕಾಗಿ ಪೂರ್ವ-ಸಿದ್ಧಪಡಿಸಿದ ಸಂದೇಶದೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಬಹುದು.",
            q7: "ಅರ್ಜಿ ಪ್ರಕಾರ ದಾಖಲೆಗಳು ಬದಲಾಗಬಹುದೇ?",
            a7: "ಹೌದು. ಉದಾಹರಣೆಗೆ, ಹೊಸ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಬೇಕಾಗುವ ದಾಖಲೆಗಳು ನವೀಕರಣಕ್ಕಿಂತ ಭಿನ್ನವಾಗಿರುತ್ತವೆ. ಹಾಗೂ SSLC ಇಲ್ಲದಿದ್ದಾಗ ಪರ್ಯಾಯ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.",
            q8: "ಡಿಜಿಟಲ್ ಸೇವಾ ಸರ್ಕಾರಿ ಜಾಲತಾಣವೇ?",
            a8: "ಅಲ್ಲ. ಡಿಜಿಟಲ್ ಸೇವಾ ಸ್ವತಂತ್ರ ಖಾಸಗಿ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ನೆರವು ಕೇಂದ್ರವಾಗಿದೆ. ನಾವು ಸರ್ಕಾರಿ ಇಲಾಖೆಯಲ್ಲ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ನಾವು ನೇರವಾಗಿ ನೀಡುವುದಿಲ್ಲ.",
            q9: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ?",
            a9: "ಗ್ರಾಹಕರು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳನ್ನು ಸಾರ್ವಜನಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲದಂತೆ ಸುರಕ್ಷಿತ ಖಾಸಗಿ ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಇರಿಸಲಾಗುತ್ತದೆ. ಕೇವಲ ಅಧಿಕೃತ ಪರಿಶೀಲನೆಗೆ ಮಾತ್ರ ಬಳಸಲಾಗುವುದು."
        },
        contact: {
            tag: "ಸಂಪರ್ಕಿಸಿ",
            title: "ಡಿಜಿಟಲ್ ಸೇವಾವನ್ನು ಸಂಪರ್ಕಿಸಿ",
            subtitle: "ಆನ್‌ಲೈನ್ ಅರ್ಜಿಗಳ ಕುರಿತು ಯಾವುದೇ ಮಾಹಿತಿ ಅಥವಾ ಸಹಾಯಕ್ಕಾಗಿ ನೇರವಾಗಿ ಕರೆ, ವಾಟ್ಸಾಪ್ ಅಥವಾ ಇಮೇಲ್ ಮಾಡಿ.",
            phoneTitle: "ದೂರವಾಣಿ ಕರೆ",
            phoneSub: "+91 8660847792",
            whatsappTitle: "ವಾಟ್ಸಾಪ್ ಸಹಾಯ",
            whatsappSub: "+91 8660847792 (ತಕ್ಷಣದ ಸ್ಪಂದನೆ)",
            emailTitle: "ಇಮೇಲ್",
            emailSub: "digitalseva7051@gmail.com",
            hoursTitle: "ಸೇವಾ ಸಮಯ",
            hoursSub: "ಸೋಮ – ಶನಿ: ಬೆಳಗ್ಗೆ 9:00 – ರಾತ್ರಿ 8:00",
            directActionWhatsApp: "ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಕಳುಹಿಸಿ",
            directActionCall: "ನೇರ ಕರೆ ಮಾಡಿ",
            directActionEmail: "ಇಮೇಲ್ ಕಳುಹಿಸಿ"
        },
        footer: {
            rights: "ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.",
            subtitle: "ಆನ್‌ಲೈನ್ ನಾಗರಿಕ ಅರ್ಜಿ ಸಹಾಯ ಕೇಂದ್ರ",
            quickLinksTitle: "ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು",
            legalTitle: "ಪಾರದರ್ಶಕತೆ ಮತ್ತು ನಿಯಮಗಳು",
            disclaimerTitle: "ಅಧಿಕೃತ ಸ್ಪಷ್ಟೀಕರಣ",
            disclaimerText: "ಡಿಜಿಟಲ್ ಸೇವಾ ಸ್ವತಂತ್ರ ಖಾಸಗಿ ನಾಗರಿಕ ಅರ್ಜಿ ಸಹಾಯ ಕೇಂದ್ರವಾಗಿದೆ. ನಾವು ಯಾವುದೇ ಸರ್ಕಾರಿ ಇಲಾಖೆ ಅಥವಾ UIDAI ನೊಂದಿಗೆ ಸಂಯೋಜಿತವಾಗಿಲ್ಲ. ಅಧಿಕೃತ ಸರ್ಕಾರಿ ನಿರ್ಧಾರಗಳು, ದಾಖಲೆ ಪರಿಶೀಲನೆ ಮತ್ತು ಪ್ರಮಾಣಪತ್ರ ವಿತರಣೆಗಳು ಸಂಬಂಧಪಟ್ಟ ಸರ್ಕಾರಿ ಪ್ರಾಧಿಕಾರಗಳ ಅಧೀನದಲ್ಲಿರುತ್ತವೆ.",
            privacyNotice: "ಗೌಪ್ಯತೆ ಸೂಚನೆ: ನಾಗರಿಕ ಸೇವಾ ಅರ್ಜಿಗಳ ತಯಾರಿಗಾಗಿ ಮಾತ್ರ ಗ್ರಾಹಕರ ವಿವರಗಳು ಮತ್ತು ಐಚ್ಛಿಕ ದಾಖಲೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ. ವಿವರಗಳನ್ನು ಗೌಪ್ಯವಾಗಿ ರಕ್ಷಿಸಲಾಗುತ್ತದೆ ಮತ್ತು 90 ದಿನಗಳವರೆಗೆ ಮಾತ್ರ ಸಂಗ್ರಹಿಸಿ ನಂತರ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅಳಿಸಲಾಗುತ್ತದೆ.",
            templateNotice: "ಮೂಲ UI ಟೆಂಪ್ಲೇಟ್ MIT ಪರವಾನಗಿ ಅಡಿಯಲ್ಲಿ ಪರವಾನಗಿ ಪಡೆದಿದೆ — ಕೃತಿಸ್ವಾಮ್ಯ © 2025 ಕಿರಣ್ ಬಡವೆ.",
            attributionLink: "MIT ಲೈಸೆನ್ಸ್ ವಿವರ"
        }
    }
};

/**
 * Helper to safely resolve dot-notated translation keys (e.g. 'hero.greeting')
 */
function getTranslation(lang, key) {
    if (!translations[lang]) lang = 'en';
    const keys = key.split('.');
    let current = translations[lang];
    for (let i = 0; i < keys.length; i++) {
        if (current && typeof current === 'object' && keys[i] in current) {
            current = current[keys[i]];
        } else {
            // Fallback to English if translation key is missing in target language
            let fallback = translations['en'];
            for (let j = 0; j < keys.length; j++) {
                if (fallback && typeof fallback === 'object' && keys[j] in fallback) {
                    fallback = fallback[keys[j]];
                } else {
                    return undefined;
                }
            }
            return fallback;
        }
    }
    return current;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, getTranslation };
}
