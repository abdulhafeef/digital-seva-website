/**
 * Digital Seva Data
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Comprehensive Service Catalogue, Checklists, Application Variants & Upload Configurations
 */

const digitalSevaData = {
    organization: {
        name: "Digital Seva",
        tagline: "Online Application Assistance",
        phone: "+91 8660847792",
        displayPhone: "+91 8660847792",
        email: "digitalseva7051@gmail.com",
        whatsappNumber: "918660847792",
        whatsappBaseUrl: "https://wa.me/918660847792"
    },

    categories: [
        { id: "all", key: "services.filterAll" },
        { id: "identity", key: "services.filterIdentity" },
        { id: "certificates", key: "services.filterCertificates" },
        { id: "education", key: "services.filterEducation" }
    ],

    // The eight confirmed citizen service categories
    services: [
        {
            id: "pan",
            category: "identity",
            icon: "💳",
            key: "services.items.pan",
            variants: [
                {
                    id: "new",
                    key: "services.variants.pan.new",
                    checklist: [
                        { id: "sslc", key: "docs.sslcMarksCard", mandatory: true, hasAlt: true, altNoteKey: "notes.sslcAltPan" },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "photo", key: "docs.passportPhoto", mandatory: true },
                        { id: "signature", key: "docs.signature", mandatory: true }
                    ],
                    uploadSlots: ["sslc", "aadhaar", "photo", "signature"]
                },
                {
                    id: "correction",
                    key: "services.variants.pan.correction",
                    checklist: [
                        { id: "existing_pan", key: "docs.existingPan", mandatory: true },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "photo", key: "docs.passportPhoto", mandatory: true },
                        { id: "signature", key: "docs.signature", mandatory: true }
                    ],
                    uploadSlots: ["existing_pan", "aadhaar", "photo", "signature"]
                }
            ],
            notesKey: "notes.panGeneral"
        },
        {
            id: "voter",
            category: "identity",
            icon: "🗳️",
            key: "services.items.voter",
            variants: [
                {
                    id: "new",
                    key: "services.variants.voter.new",
                    checklist: [
                        { id: "sslc", key: "docs.sslcMarksCard", mandatory: true, hasAlt: true, altNoteKey: "notes.sslcAltVoter" },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "photo", key: "docs.passportPhoto", mandatory: true }
                    ],
                    uploadSlots: ["sslc", "aadhaar", "photo"]
                },
                {
                    id: "correction",
                    key: "services.variants.voter.correction",
                    checklist: [
                        { id: "existing_voter", key: "docs.existingVoter", mandatory: true },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true }
                    ],
                    uploadSlots: ["existing_voter", "aadhaar"]
                }
            ],
            notesKey: "notes.voterGeneral"
        },
        {
            id: "aadhaar",
            category: "identity",
            icon: "🆔",
            key: "services.items.aadhaar",
            variants: [
                {
                    id: "address",
                    key: "services.variants.aadhaar.address",
                    checklist: [
                        { id: "ma_form", key: "docs.maForm", mandatory: true, isFlagged: true, flagKey: "notes.maFormFlag" },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true }
                    ],
                    uploadSlots: ["ma_form", "aadhaar"]
                }
            ],
            notesKey: "notes.aadhaarGeneral"
        },
        {
            id: "passport",
            category: "identity",
            icon: "🛂",
            key: "services.items.passport",
            variants: [
                {
                    id: "fresh",
                    key: "services.variants.passport.fresh",
                    checklist: [
                        { id: "sslc", key: "docs.sslcMarksCard", mandatory: true },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "id_proof", key: "docs.passportIdProofAlt", mandatory: false, isAlternative: true, altNoteKey: "notes.passportAltInfo" }
                    ],
                    uploadSlots: ["sslc", "aadhaar", "id_proof"]
                },
                {
                    id: "renewal",
                    key: "services.variants.passport.renewal",
                    checklist: [
                        { id: "existing_passport", key: "docs.existingPassport", mandatory: true },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "id_proof", key: "docs.passportIdProofAlt", mandatory: false, isAlternative: true, altNoteKey: "notes.passportAltInfo" }
                    ],
                    uploadSlots: ["existing_passport", "aadhaar", "id_proof"]
                }
            ],
            notesKey: "notes.passportGeneral"
        },
        {
            id: "income",
            category: "certificates",
            icon: "📜",
            key: "services.items.income",
            variants: [
                {
                    id: "standard",
                    key: "services.variants.income.standard",
                    checklist: [
                        { id: "va_form", key: "docs.vaForm", mandatory: true },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "sslc", key: "docs.sslcMarksCard", mandatory: true },
                        { id: "prev_certs", key: "docs.prevIncomeCasteCerts", mandatory: false, isAlternative: true, altNoteKey: "notes.prevCertsNote" },
                        { id: "photo", key: "docs.passportPhoto", mandatory: true }
                    ],
                    uploadSlots: ["va_form", "aadhaar", "sslc", "prev_certs", "photo"]
                }
            ],
            notesKey: "notes.incomeGeneral"
        },
        {
            id: "caste",
            category: "certificates",
            icon: "📑",
            key: "services.items.caste",
            variants: [
                {
                    id: "standard",
                    key: "services.variants.caste.standard",
                    checklist: [
                        { id: "va_form", key: "docs.vaForm", mandatory: true },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "sslc", key: "docs.sslcMarksCard", mandatory: true },
                        { id: "prev_certs", key: "docs.prevIncomeCasteCerts", mandatory: false, isAlternative: true, altNoteKey: "notes.prevCertsNote" },
                        { id: "photo", key: "docs.passportPhoto", mandatory: true }
                    ],
                    uploadSlots: ["va_form", "aadhaar", "sslc", "prev_certs", "photo"]
                }
            ],
            notesKey: "notes.casteScopeNote"
        },
        {
            id: "scholarship",
            category: "education",
            icon: "🎓",
            key: "services.items.scholarship",
            variants: [
                {
                    id: "standard",
                    key: "services.variants.scholarship.standard",
                    checklist: [
                        { id: "sslc", key: "docs.sslcMarksCard", mandatory: true },
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "income_cert", key: "docs.incomeCert", mandatory: true },
                        { id: "scheme_docs", key: "docs.scholarshipAdditional", mandatory: false, isAlternative: true, altNoteKey: "notes.scholarshipAltNote" }
                    ],
                    uploadSlots: ["sslc", "aadhaar", "income_cert", "scheme_docs"]
                }
            ],
            notesKey: "notes.scholarshipGeneral"
        },
        {
            id: "more",
            category: "education",
            icon: "💻",
            key: "services.items.more",
            variants: [
                {
                    id: "general",
                    key: "services.variants.more.general",
                    checklist: [
                        { id: "aadhaar", key: "docs.aadhaarCard", mandatory: true },
                        { id: "supporting_docs", key: "docs.generalSupportingDoc", mandatory: false, isAlternative: true }
                    ],
                    uploadSlots: ["aadhaar", "supporting_docs"]
                }
            ],
            notesKey: "notes.moreGeneral"
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = digitalSevaData;
}
