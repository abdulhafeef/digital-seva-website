/**
 * Digital Seva JavaScript
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Comprehensive Controller:
 * - Theme & Bilingual Language Switcher (EN & KN)
 * - Real-Time Service Catalogue Search & Category Filtering
 * - Accessible Service Details & Document Checklist Modal
 * - Dynamic Uploads with Client-Side Type & Size Validation
 * - Robust Enquiry Submission with Offline Fallback
 * - WhatsApp URL Prefilled Link Generator
 * - FAQ Accordion, Mobile Drawer, GSAP & Motion Interactions
 */

// ========================================================
// 1. Accessibility & Motion Preferences
// ========================================================
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ========================================================
// 2. Theme Management (Light / Dark)
// ========================================================
// Requirement: Light mode should be the default for new visitors
let currentTheme = 'light';
try {
    currentTheme = localStorage.getItem('theme') || 'light';
} catch (e) {
    currentTheme = 'light';
}

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {}

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const isDark = theme === 'dark';
        themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
}

// Apply on initial script load
applyTheme(currentTheme);

// ========================================================
// 3. Bilingual Foundation (English / Kannada)
// ========================================================
let currentLang = localStorage.getItem('language') || 'en';
let activeServiceId = null;
let activeVariantId = null;
let selectedFilesMap = new Map(); // slotId -> File

function applyLanguage(lang) {
    if (typeof translations === 'undefined' || !translations[lang]) {
        lang = 'en';
    }
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('language', lang);

    // Update active states on segmented switcher buttons
    const enBtn = document.getElementById('lang-en');
    const knBtn = document.getElementById('lang-kn');

    if (enBtn && knBtn) {
        if (lang === 'en') {
            enBtn.classList.add('active');
            enBtn.setAttribute('aria-pressed', 'true');
            knBtn.classList.remove('active');
            knBtn.setAttribute('aria-pressed', 'false');
        } else {
            knBtn.classList.add('active');
            knBtn.setAttribute('aria-pressed', 'true');
            enBtn.classList.remove('active');
            enBtn.setAttribute('aria-pressed', 'false');
        }
    }

    // Update Document Title
    const siteTitle = getTranslation(lang, 'site.title');
    if (siteTitle) {
        document.title = siteTitle;
    }

    // Translate all [data-i18n] text nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = getTranslation(lang, key);
        if (translated !== undefined) {
            el.textContent = translated;
        }
    });

    // Translate all [data-i18n-attr] attributes (e.g. placeholder, aria-label, title)
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const specs = el.getAttribute('data-i18n-attr').split(',');
        specs.forEach(spec => {
            const parts = spec.trim().split(':');
            const attr = parts[0];
            const key = parts[1];
            if (attr && key) {
                const translated = getTranslation(lang, key);
                if (translated !== undefined) {
                    el.setAttribute(attr, translated);
                }
            }
        });
    });

    // Re-filter services to update search match and language rendering
    filterServices();

    // If modal is currently open, refresh its content in current language
    if (activeServiceId) {
        renderModalContent(activeServiceId, activeVariantId);
    }
}

// ========================================================
// 4. Services Catalogue Search & Category Filtering
// ========================================================
let activeCategory = 'all';

function filterServices() {
    const searchInput = document.getElementById('serviceSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
    }

    const cards = document.querySelectorAll('.skill-category');
    let visibleCount = 0;

    cards.forEach(card => {
        const serviceId = card.getAttribute('data-service-id');
        const category = card.getAttribute('data-category');

        // Check category match
        const matchesCategory = activeCategory === 'all' || category === activeCategory;

        // Search text matching in current language
        const titleText = (getTranslation(currentLang, `services.items.${serviceId}.title`) || '').toLowerCase();
        const descText = (getTranslation(currentLang, `services.items.${serviceId}.desc`) || '').toLowerCase();

        // Also match English fallbacks
        const enTitle = (getTranslation('en', `services.items.${serviceId}.title`) || '').toLowerCase();
        const enDesc = (getTranslation('en', `services.items.${serviceId}.desc`) || '').toLowerCase();

        const matchesQuery = query === '' ||
            titleText.includes(query) || descText.includes(query) ||
            enTitle.includes(query) || enDesc.includes(query);

        if (matchesCategory && matchesQuery) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const emptyState = document.getElementById('servicesEmptyState');
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

// ========================================================
// 5. Service Details & Document Checklist Modal
// ========================================================
const modalBackdrop = document.getElementById('serviceModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
let lastFocusedElement = null;

function openServiceModal(serviceId, preferredVariantId = null) {
    activeServiceId = serviceId;
    lastFocusedElement = document.activeElement;

    const serviceData = digitalSevaData.services.find(s => s.id === serviceId);
    if (!serviceData) return;

    activeVariantId = preferredVariantId || serviceData.variants[0].id;
    renderModalContent(serviceId, activeVariantId);

    if (modalBackdrop) {
        modalBackdrop.style.display = 'flex';
        // Trigger reflow for smooth CSS opacity transition
        void modalBackdrop.offsetWidth;
        modalBackdrop.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Focus close button for accessibility
        if (modalCloseBtn) modalCloseBtn.focus();
    }
}

function closeServiceModal() {
    if (modalBackdrop) {
        modalBackdrop.classList.remove('open');
        setTimeout(() => {
            modalBackdrop.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    }
    activeServiceId = null;
    activeVariantId = null;
    selectedFilesMap.clear();

    const alertBox = document.getElementById('formStatusAlert');
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.textContent = '';
    }

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

function renderModalContent(serviceId, variantId) {
    const serviceData = digitalSevaData.services.find(s => s.id === serviceId);
    if (!serviceData) return;

    const variant = serviceData.variants.find(v => v.id === variantId) || serviceData.variants[0];
    activeVariantId = variant.id;

    // Header Title & Icon
    const modalIcon = document.getElementById('modalServiceIcon');
    const modalTitle = document.getElementById('modalServiceTitle');
    const modalCategoryTag = document.getElementById('modalCategoryTag');

    if (modalIcon) modalIcon.textContent = serviceData.icon;
    if (modalTitle) modalTitle.textContent = getTranslation(currentLang, `services.items.${serviceId}.title`) || serviceId;
    if (modalCategoryTag) {
        const catKey = `services.filter${serviceData.category.charAt(0).toUpperCase() + serviceData.category.slice(1)}`;
        modalCategoryTag.textContent = getTranslation(currentLang, catKey) || serviceData.category;
    }

    // Hidden form fields
    const formServiceId = document.getElementById('formServiceId');
    const formVariantId = document.getElementById('formVariantId');
    if (formServiceId) formServiceId.value = serviceId;
    if (formVariantId) formVariantId.value = variant.id;

    // Variant Switcher Tabs
    const variantWrap = document.getElementById('modalVariantWrap');
    const variantTabs = document.getElementById('modalVariantTabs');
    if (variantTabs) {
        if (serviceData.variants.length > 1) {
            variantWrap.style.display = 'flex';
            variantTabs.innerHTML = serviceData.variants.map(v => {
                const isActive = v.id === variant.id;
                const vTitle = getTranslation(currentLang, v.key) || v.id;
                return `<button type="button" class="variant-tab-btn ${isActive ? 'active' : ''}"
                                onclick="switchModalVariant('${serviceId}', '${v.id}')">${vTitle}</button>`;
            }).join('');
        } else {
            variantWrap.style.display = 'none';
        }
    }

    // Document Checklist Items
    const checklistList = document.getElementById('modalChecklistItems');
    if (checklistList) {
        checklistList.innerHTML = variant.checklist.map(item => {
            const docName = getTranslation(currentLang, item.key) || item.id;
            let badgeClass = 'badge-mandatory';
            let badgeText = getTranslation(currentLang, 'docs.mandatoryBadge') || 'Required';

            if (item.isAlternative) {
                badgeClass = 'badge-alt';
                badgeText = getTranslation(currentLang, 'docs.alternativeBadge') || 'Alternative Option';
            } else if (!item.mandatory) {
                badgeClass = 'badge-optional';
                badgeText = getTranslation(currentLang, 'docs.optionalBadge') || 'Optional';
            }

            let altNoteHtml = '';
            if (item.hasAlt && item.altNoteKey) {
                const note = getTranslation(currentLang, item.altNoteKey);
                if (note) altNoteHtml = `<div class="checklist-alt-note">ℹ️ ${note}</div>`;
            }
            if (item.isFlagged && item.flagKey) {
                const flagNote = getTranslation(currentLang, item.flagKey);
                if (flagNote) altNoteHtml = `<div class="checklist-alt-note" style="color: var(--accent-gold);">⚠️ ${flagNote}</div>`;
            }

            return `
                <li class="checklist-item">
                    <div class="checklist-item-left">
                        <span class="checklist-check">✓</span>
                        <div>
                            <span class="checklist-doc-name">${docName}</span>
                            ${altNoteHtml}
                        </div>
                    </div>
                    <span class="${badgeClass}">${badgeText}</span>
                </li>
            `;
        }).join('');
    }

    // Notes & Scope Guidance Box
    const notesBox = document.getElementById('modalNotesBox');
    const notesText = document.getElementById('modalNotesText');
    if (notesBox && notesText) {
        const note = getTranslation(currentLang, serviceData.notesKey);
        if (note) {
            notesBox.style.display = 'block';
            notesText.textContent = note;
        } else {
            notesBox.style.display = 'none';
        }
    }

    // WhatsApp Prefilled Link for Option B
    const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
    if (modalWhatsAppBtn) {
        const serviceName = getTranslation(currentLang, `services.items.${serviceId}.title`) || serviceId;
        const variantName = getTranslation(currentLang, variant.key) || variant.id;
        const prefilledText = encodeURIComponent(
            `Hello Digital Seva, I would like assistance with ${serviceName} (${variantName}).`
        );
        modalWhatsAppBtn.href = `https://wa.me/918660847792?text=${prefilledText}`;
    }

    // Render Dynamic Upload Slots
    renderUploadSlots(variant.uploadSlots);
}

function switchModalVariant(serviceId, variantId) {
    activeVariantId = variantId;
    renderModalContent(serviceId, variantId);
}

// ========================================================
// 6. Dynamic Upload Slots & Client-Side File Validation
// ========================================================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

function renderUploadSlots(slots) {
    const container = document.getElementById('dynamicUploadSlots');
    if (!container) return;

    if (!slots || slots.length === 0) {
        container.innerHTML = `<p style="font-size:0.84rem; color:var(--text-muted);">No document uploads specified for this option.</p>`;
        return;
    }

    container.innerHTML = slots.map(slotId => {
        const docKey = getDocKeyForSlot(slotId);
        const docTitle = getTranslation(currentLang, docKey) || slotId;
        const chooseBtnText = getTranslation(currentLang, 'modal.fileSelectBtn') || 'Choose File';
        const existingFile = selectedFilesMap.get(slotId);

        const statusText = existingFile
            ? `📄 ${existingFile.name} (${formatBytes(existingFile.size)})`
            : `Allowed: PDF, JPG, PNG (Max 5 MB)`;

        return `
            <div class="upload-slot-card" id="slotCard_${slotId}">
                <div class="upload-slot-info">
                    <span class="upload-slot-label">${docTitle}</span>
                    <span class="upload-file-status" id="fileStatus_${slotId}">${statusText}</span>
                </div>
                <div class="upload-slot-controls">
                    <label class="file-choose-label" for="fileInput_${slotId}">${chooseBtnText}</label>
                    <input type="file" id="fileInput_${slotId}" class="file-hidden-input"
                           accept=".pdf,.jpg,.jpeg,.png" onchange="handleFileSelected(event, '${slotId}')">
                    <button type="button" class="btn-file-remove" id="removeBtn_${slotId}"
                            style="display: ${existingFile ? 'block' : 'none'};"
                            onclick="removeSelectedFile('${slotId}')">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

function getDocKeyForSlot(slotId) {
    const slotMap = {
        sslc: 'docs.sslcMarksCard',
        aadhaar: 'docs.aadhaarCard',
        photo: 'docs.passportPhoto',
        signature: 'docs.signature',
        existing_pan: 'docs.existingPan',
        existing_voter: 'docs.existingVoter',
        existing_passport: 'docs.existingPassport',
        id_proof: 'docs.passportIdProofAlt',
        va_form: 'docs.vaForm',
        prev_certs: 'docs.prevIncomeCasteCerts',
        income_cert: 'docs.incomeCert',
        ma_form: 'docs.maForm',
        scheme_docs: 'docs.scholarshipAdditional',
        supporting_docs: 'docs.generalSupportingDoc'
    };
    return slotMap[slotId] || `docs.${slotId}`;
}

function handleFileSelected(event, slotId) {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) return;

    // Size Validation
    if (file.size > MAX_FILE_SIZE) {
        const sizeErr = getTranslation(currentLang, 'modal.errFileSize') || 'File exceeds the 5 MB limit. Please select a smaller file.';
        alert(sizeErr);
        input.value = '';
        return;
    }

    // Extension Validation
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        const typeErr = getTranslation(currentLang, 'modal.errFileType') || 'Unsupported format. Only PDF, JPG, JPEG, and PNG files are accepted.';
        alert(typeErr);
        input.value = '';
        return;
    }

    // Store valid file
    selectedFilesMap.set(slotId, file);

    const statusEl = document.getElementById(`fileStatus_${slotId}`);
    const removeBtn = document.getElementById(`removeBtn_${slotId}`);

    if (statusEl) {
        statusEl.textContent = `📄 ${file.name} (${formatBytes(file.size)})`;
        statusEl.style.color = 'var(--primary-color)';
    }
    if (removeBtn) {
        removeBtn.style.display = 'block';
    }
}

function removeSelectedFile(slotId) {
    selectedFilesMap.delete(slotId);
    const input = document.getElementById(`fileInput_${slotId}`);
    if (input) input.value = '';

    const statusEl = document.getElementById(`fileStatus_${slotId}`);
    const removeBtn = document.getElementById(`removeBtn_${slotId}`);

    if (statusEl) {
        statusEl.textContent = `Allowed: PDF, JPG, PNG (Max 5 MB)`;
        statusEl.style.color = 'var(--text-muted)';
    }
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ========================================================
// 7. Customer Enquiry Form Submission (Option A)
// ========================================================
const enquiryForm = document.getElementById('enquiryForm');
const submitEnquiryBtn = document.getElementById('submitEnquiryBtn');
const formStatusAlert = document.getElementById('formStatusAlert');
const successModal = document.getElementById('successModal');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');

if (enquiryForm) {
    enquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('applicantName');
        const phoneInput = document.getElementById('applicantPhone');
        const notesInput = document.getElementById('applicantNotes');
        const consentInput = document.getElementById('privacyConsent');

        const name = nameInput.value.trim();
        const rawPhone = phoneInput.value.trim().replace(/[\s\-\+]/g, '');
        const phone = rawPhone.slice(-10);
        const notes = notesInput.value.trim();

        // Validation
        if (!name || name.length < 2) {
            showFormAlert(getTranslation(currentLang, 'modal.errValidation') || 'Please enter your full name.', 'error');
            nameInput.focus();
            return;
        }

        if (!/^[6-9]\d{9}$/.test(phone)) {
            showFormAlert(getTranslation(currentLang, 'modal.errPhone') || 'Please enter a valid 10-digit Indian mobile number.', 'error');
            phoneInput.focus();
            return;
        }

        if (consentInput && !consentInput.checked) {
            showFormAlert(getTranslation(currentLang, 'modal.errConsent') || 'Please agree to the privacy notice before submitting.', 'error');
            return;
        }

        // Prepare FormData
        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('service', activeServiceId || 'general');
        formData.append('variant', activeVariantId || 'standard');
        formData.append('notes', notes);

        // Attach optional selected files
        selectedFilesMap.forEach((file, slotId) => {
            formData.append(slotId, file);
        });

        // Set Loading State
        setSubmittingState(true);

        try {
            const response = await fetch('/api/enquiries', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Submission Successful
                closeServiceModal();
                showSuccessModal(result.enquiryId, name, phone);
                enquiryForm.reset();
                selectedFilesMap.clear();
            } else {
                // Server validation error
                showFormAlert(result.error || 'Failed to submit enquiry.', 'error');
            }
        } catch (networkError) {
            console.warn('[OFFLINE FALLBACK TRIGGERED]', networkError);
            // If backend is offline, gracefully provide one-click WhatsApp fallback!
            const serviceName = getTranslation(currentLang, `services.items.${activeServiceId}.title`) || activeServiceId;
            const waFallbackText = encodeURIComponent(
                `Hello Digital Seva, I am submitting an enquiry:\nName: ${name}\nPhone: ${phone}\nService: ${serviceName}\nNotes: ${notes}`
            );
            const waUrl = `https://wa.me/918660847792?text=${waFallbackText}`;

            formStatusAlert.style.display = 'block';
            formStatusAlert.className = 'form-status-alert error';
            formStatusAlert.innerHTML = `
                <p>${getTranslation(currentLang, 'modal.errNetwork') || 'Backend service is currently offline.'}</p>
                <div style="margin-top: 10px;">
                    <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-whatsapp" style="width:100%;">
                        💬 ${getTranslation(currentLang, 'modal.fallbackWhatsAppBtn') || 'Send via WhatsApp Instead'}
                    </a>
                </div>
            `;
        } finally {
            setSubmittingState(false);
        }
    });
}

function showFormAlert(message, type) {
    if (!formStatusAlert) return;
    formStatusAlert.style.display = 'block';
    formStatusAlert.className = `form-status-alert ${type}`;
    formStatusAlert.textContent = message;
}

function setSubmittingState(isSubmitting) {
    if (!submitEnquiryBtn) return;
    const submitText = submitEnquiryBtn.querySelector('.submit-text');
    const spinner = submitEnquiryBtn.querySelector('.submit-spinner');

    submitEnquiryBtn.disabled = isSubmitting;
    if (isSubmitting) {
        if (submitText) submitText.textContent = getTranslation(currentLang, 'modal.submittingBtn') || 'Submitting...';
        if (spinner) spinner.style.display = 'inline-block';
    } else {
        if (submitText) submitText.textContent = getTranslation(currentLang, 'modal.submitBtn') || 'Submit Enquiry';
        if (spinner) spinner.style.display = 'none';
    }
}

function showSuccessModal(refId, name, phone) {
    if (!successModal) return;
    const refIdEl = document.getElementById('successRefId');
    if (refIdEl) refIdEl.textContent = refId || 'DS-CONFIRMED';

    const waBtn = document.getElementById('successWhatsAppFollowupBtn');
    if (waBtn) {
        const text = encodeURIComponent(`Hello Digital Seva, I submitted enquiry Ref ID: ${refId}. Please assist.`);
        waBtn.href = `https://wa.me/918660847792?text=${text}`;
    }

    successModal.style.display = 'flex';
    void successModal.offsetWidth;
    successModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
        successModal.classList.remove('open');
        setTimeout(() => {
            successModal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);
    });
}

// ========================================================
// 8. FAQ Accordion Logic
// ========================================================
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const isActive = item.classList.contains('active');

        // Close other items
        document.querySelectorAll('.accordion-item').forEach(other => {
            if (other !== item) {
                other.classList.remove('active');
                const btn = other.querySelector('.accordion-header');
                const content = other.querySelector('.accordion-content');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                if (content) content.style.maxHeight = null;
            }
        });

        // Toggle current item
        if (isActive) {
            item.classList.remove('active');
            header.setAttribute('aria-expanded', 'false');
            const content = item.querySelector('.accordion-content');
            if (content) content.style.maxHeight = null;
        } else {
            item.classList.add('active');
            header.setAttribute('aria-expanded', 'true');
            const content = item.querySelector('.accordion-content');
            if (content) content.style.maxHeight = content.scrollHeight + 'px';
        }
    });
});

// ========================================================
// 9. Mobile Navigation Drawer & Smooth Scroll
// ========================================================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        const spans = navToggle.querySelectorAll('span');
        if (spans.length >= 3) {
            if (isOpen) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(6px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            const spans = navToggle.querySelectorAll('span');
            if (spans.length >= 3) {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    });
}

// Smooth scrolling with sticky navbar offset
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 75;
                window.scrollTo({
                    top: offsetTop,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });
            }
        }
    });
});

// Sticky nav background shadow on scroll
const nav = document.querySelector('.nav');
if (nav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// ========================================================
// 10. GSAP Animations & Interactive Motion
// ========================================================
if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
}

// Custom Cursor (Only on Desktop with Fine Pointer)
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

if (cursorDot && cursorOutline && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 350, fill: "forwards" });
    });

    const hoverElements = document.querySelectorAll('a, button, .skill-category, .contact-item, .lang-btn, .step-card, .pillar-card');
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1.6)';
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.4)';
            cursorOutline.style.borderColor = 'var(--primary-color)';
        });

        element.addEventListener('mouseleave', () => {
            cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
            cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    });
}

// Magnetic Buttons
if (typeof gsap !== 'undefined' && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(button, {
                x: x * 0.22,
                y: y * 0.22,
                duration: 0.25,
                ease: 'power2.out'
            });
        });

        button.addEventListener('mouseleave', () => {
            gsap.to(button, {
                x: 0,
                y: 0,
                duration: 0.45,
                ease: 'elastic.out(1, 0.4)'
            });
        });
    });
}

// Scroll Progress Indicator Bar
const progressBar = document.createElement('div');
progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-gold));
    z-index: 9999;
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 0.05s linear;
`;
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (windowHeight > 0) {
        const scrolled = (window.pageYOffset / windowHeight);
        progressBar.style.transform = `scaleX(${scrolled})`;
    }
});

// ========================================================
// 11. DOM Ready Event Bindings
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Listener
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }

    // Language Switcher Listeners
    const enBtn = document.getElementById('lang-en');
    const knBtn = document.getElementById('lang-kn');

    if (enBtn) enBtn.addEventListener('click', () => applyLanguage('en'));
    if (knBtn) knBtn.addEventListener('click', () => applyLanguage('kn'));

    // Search Input Listener
    const searchInput = document.getElementById('serviceSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterServices);
    }

    // Clear Search Button
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                filterServices();
                searchInput.focus();
            }
        });
    }

    // Category Filter Chips
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-selected', 'false');
            });
            chip.classList.add('active');
            chip.setAttribute('aria-selected', 'true');
            activeCategory = chip.getAttribute('data-category');
            filterServices();
        });
    });

    // Reset Filters Button in Empty State
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            activeCategory = 'all';
            chips.forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-category') === 'all');
                c.setAttribute('aria-selected', c.getAttribute('data-category') === 'all' ? 'true' : 'false');
            });
            filterServices();
        });
    }

    // Modal Close Button & Backdrop Click
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeServiceModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                closeServiceModal();
            }
        });
    }

    // Escape Key to Close Modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalBackdrop && modalBackdrop.classList.contains('open')) {
                closeServiceModal();
            }
            if (successModal && successModal.classList.contains('open')) {
                successModal.classList.remove('open');
                successModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    });

    // Apply Language
    applyLanguage(currentLang);
});

// Console Branding
console.log('%c🏛️ DIGITAL SEVA | Online Application Assistance', 'color: #1e40af; font-size: 14px; font-weight: bold;');
