/**
 * Digital Seva Data
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

const digitalSevaData = {
    organization: {
        name: "Digital Seva",
        tagline: "Online Application Assistance",
        phone: "+91 8660847792",
        email: "digitalseva7051@gmail.com",
        whatsapp: "https://wa.me/918660847792"
    },

    // Confirmed Citizen Services (mapped to translation keys)
    services: [
        {
            id: "pan",
            icon: "💳",
            key: "services.items.pan"
        },
        {
            id: "voter",
            icon: "🗳️",
            key: "services.items.voter"
        },
        {
            id: "aadhaar",
            icon: "🆔",
            key: "services.items.aadhaar"
        },
        {
            id: "passport",
            icon: "🛂",
            key: "services.items.passport"
        },
        {
            id: "income",
            icon: "📜",
            key: "services.items.income"
        },
        {
            id: "caste",
            icon: "📑",
            key: "services.items.caste"
        },
        {
            id: "scholarship",
            icon: "🎓",
            key: "services.items.scholarship"
        },
        {
            id: "more",
            icon: "💻",
            key: "services.items.more"
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = digitalSevaData;
}
