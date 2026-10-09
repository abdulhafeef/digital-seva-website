/**
 * Digital Seva JavaScript
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 */

// ===================================
// 1. Accessibility & Motion Preferences
// ===================================
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===================================
// 2. Theme Management (Light / Dark)
// ===================================
let currentTheme = localStorage.getItem('theme');
if (!currentTheme) {
    currentTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const isDark = theme === 'dark';
        themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
}

// Apply on initial load
applyTheme(currentTheme);

// ===================================
// 3. Bilingual Foundation (English / Kannada)
// ===================================
let currentLang = localStorage.getItem('language') || 'en';

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
            if (el.classList.contains('hero-name')) {
                el.textContent = translated;
                if (!prefersReducedMotion && typeof splitTextIntoSpans === 'function') {
                    splitTextIntoSpans('.hero-name');
                }
            } else {
                el.textContent = translated;
            }
        }
    });

    // Translate all [data-i18n-attr] attributes (e.g. aria-label, title)
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
}

// ===================================
// 4. DOM Ready Initializations
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme Toggle Button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }

    // Initialize Language Switcher Buttons
    const enBtn = document.getElementById('lang-en');
    const knBtn = document.getElementById('lang-kn');
    
    if (enBtn) {
        enBtn.addEventListener('click', () => applyLanguage('en'));
    }
    if (knBtn) {
        knBtn.addEventListener('click', () => applyLanguage('kn'));
    }

    // Apply saved or default language
    applyLanguage(currentLang);
});

// ===================================
// 5. GSAP Initialization
// ===================================
if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }
}

// ===================================
// 6. Custom Cursor
// ===================================
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

// Only enable cursor tracking on desktop fine-pointer devices
if (cursorDot && cursorOutline && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;
        
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;
        
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 400, fill: "forwards" });
    });

    // Cursor hover scaling on clickable/interactive items
    const hoverElements = document.querySelectorAll('a, button, .skill-category, .contact-item, .lang-btn');
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

// ===================================
// 7. Mobile Navigation Drawer
// ===================================
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        
        // Animate hamburger lines
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

    // Close menu when clicking any nav link
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

// ===================================
// 8. Smooth Scrolling with Offset
// ===================================
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

// ===================================
// 9. Sticky Nav Scrolled Effect
// ===================================
const nav = document.querySelector('.nav');
if (nav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// ===================================
// 10. GSAP Animations & Motion Control
// ===================================
if (typeof gsap !== 'undefined' && !prefersReducedMotion) {
    // Hero Entrance Animations
    window.addEventListener('load', () => {
        const profileImageWrapper = document.querySelector('.profile-image-wrapper');
        const profileImage = document.querySelector('.profile-image');

        if (profileImageWrapper) {
            gsap.from(profileImageWrapper, {
                opacity: 0,
                scale: 0.85,
                duration: 0.9,
                delay: 0.2,
                ease: 'power2.out'
            });

            // Gentle floating loop
            gsap.to(profileImageWrapper, {
                y: -10,
                duration: 3.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: 1.2
            });
        }

        if (profileImage) {
            gsap.from(profileImage, {
                opacity: 0.8,
                scale: 0.9,
                duration: 0.8,
                delay: 0.3,
                ease: 'power2.out'
            });
        }
    });

    if (document.querySelector('.hero-greeting')) {
        gsap.from('.hero-greeting', { opacity: 0, y: 20, duration: 0.7, delay: 0.2 });
    }

    if (document.querySelector('.hero-subtitle')) {
        gsap.from('.hero-subtitle', { opacity: 0, y: 20, duration: 0.7, delay: 0.5 });
    }

    if (document.querySelector('.hero-description')) {
        gsap.from('.hero-description', { opacity: 0, y: 20, duration: 0.7, delay: 0.7 });
    }

    if (document.querySelector('.hero-cta')) {
        gsap.from('.hero-cta', { opacity: 0, y: 20, duration: 0.7, delay: 0.9 });
    }

    if (document.querySelector('.scroll-indicator')) {
        gsap.from('.scroll-indicator', { opacity: 0, duration: 0.9, delay: 1.2 });
    }

    // ScrollTrigger-based Animations
    if (typeof ScrollTrigger !== 'undefined') {
        // Section Headers
        gsap.utils.toArray('.section-header').forEach(header => {
            const tag = header.querySelector('.section-tag');
            const title = header.querySelector('.section-title');
            if (tag) {
                gsap.from(tag, {
                    scrollTrigger: {
                        trigger: header,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    },
                    opacity: 0,
                    y: 20,
                    duration: 0.5
                });
            }
            if (title) {
                gsap.from(title, {
                    scrollTrigger: {
                        trigger: header,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    },
                    opacity: 0,
                    y: 25,
                    duration: 0.5,
                    delay: 0.15
                });
            }
        });

        // About Content
        if (document.querySelector('.about-content')) {
            gsap.from('.about-description', {
                scrollTrigger: {
                    trigger: '.about-content',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 20,
                duration: 0.6,
                stagger: 0.15
            });

            gsap.from('.about-info', {
                scrollTrigger: {
                    trigger: '.about-info',
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 20,
                duration: 0.6
            });
        }

        // Service Cards Staggered Entrance
        gsap.utils.toArray('.skill-category').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 35,
                duration: 0.6,
                delay: (index % 4) * 0.08
            });
        });

        // Contact Cards Staggered Entrance
        gsap.utils.toArray('.contact-item').forEach((item, index) => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 25,
                duration: 0.5,
                delay: index * 0.1
            });
        });
    }
}

// ===================================
// 11. Subtle Parallax for Background Orbs
// ===================================
if (!prefersReducedMotion) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.gradient-orb');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.25 + (index * 0.08);
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// ===================================
// 12. Active Navigation Link on Scroll
// ===================================
const sections = document.querySelectorAll('section[id]');

function highlightNavigation() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink?.classList.add('active');
        } else {
            navLink?.classList.remove('active');
        }
    });
}

window.addEventListener('scroll', highlightNavigation);

// ===================================
// 13. Magnetic Button Interaction
// ===================================
const buttons = document.querySelectorAll('.btn');
if (typeof gsap !== 'undefined' && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(button, {
                x: x * 0.25,
                y: y * 0.25,
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

// ===================================
// 14. 3D Tilt for Emblem & Cards
// ===================================
const profileImage = document.querySelector('.profile-image-wrapper');
if (profileImage && typeof gsap !== 'undefined' && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    profileImage.addEventListener('mousemove', (e) => {
        const rect = profileImage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 18;
        const rotateY = (centerX - x) / 18;
        
        gsap.to(profileImage, {
            rotationX: rotateX,
            rotationY: rotateY,
            duration: 0.4,
            ease: 'power2.out',
            transformPerspective: 900
        });
    });
    
    profileImage.addEventListener('mouseleave', () => {
        gsap.to(profileImage, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.5,
            ease: 'power2.out'
        });
    });
}

const skillCategories = document.querySelectorAll('.skill-category');
if (typeof gsap !== 'undefined' && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    skillCategories.forEach(category => {
        category.addEventListener('mousemove', (e) => {
            const rect = category.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 14;
            const rotateY = (centerX - x) / 14;
            
            gsap.to(category, {
                rotationX: rotateX,
                rotationY: rotateY,
                duration: 0.4,
                ease: 'power2.out',
                transformPerspective: 900
            });
        });
        
        category.addEventListener('mouseleave', () => {
            gsap.to(category, {
                rotationX: 0,
                rotationY: 0,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    });
}

// ===================================
// 15. Text Split Animation for Hero
// ===================================
function splitTextIntoSpans(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        const text = element.textContent.trim();
        const splitText = text.split('').map(char => {
            return char === ' ' ? ' ' : `<span class="char">${char}</span>`;
        }).join('');
        element.innerHTML = splitText;
    });
}

if (document.querySelector('.hero-name') && typeof gsap !== 'undefined' && !prefersReducedMotion) {
    splitTextIntoSpans('.hero-name');
    
    gsap.from('.hero-name .char', {
        opacity: 0,
        y: 35,
        rotationX: -60,
        stagger: 0.02,
        duration: 0.8,
        delay: 0.4,
        ease: 'back.out(1.5)'
    });
}

// ===================================
// 16. Scroll Progress Indicator Bar
// ===================================
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

// ===================================
// 17. Console Greeting
// ===================================
console.log('%c🏛️ Digital Seva | Online Application Assistance', 'color: #1e40af; font-size: 15px; font-weight: bold;');
