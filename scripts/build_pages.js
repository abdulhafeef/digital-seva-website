/**
 * Digital Seva — Cloudflare Pages Static Build Script
 * Base template licensed under MIT License - Copyright (c) 2025 Kiran Badave
 *
 * Generates a clean, production-ready 'dist/' directory containing only public assets.
 * Strictly verifies no server-side secrets, databases, tests, or scripts leak into dist/.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('🚀 Starting Digital Seva Cloudflare Pages build...');

// 1. Clean or create dist/
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// 2. Define Public Assets to Copy
const PUBLIC_FILES = [
    'index.html',
    'admin.html',
    'styles.css',
    'script.js',
    'data.js',
    'translations.js',
    'robots.txt',
    'sitemap.xml',
    'LICENSE'
];

for (const file of PUBLIC_FILES) {
    const src = path.join(ROOT_DIR, file);
    const dest = path.join(DIST_DIR, file);
    if (!fs.existsSync(src)) {
        console.error(`🚨 [BUILD ERROR] Required public file missing: ${file}`);
        process.exit(1);
    }
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
}

// 3. Copy Assets directory
const srcAssets = path.join(ROOT_DIR, 'assets');
const destAssets = path.join(DIST_DIR, 'assets');
if (fs.existsSync(srcAssets)) {
    fs.mkdirSync(destAssets, { recursive: true });
    const assetFiles = fs.readdirSync(srcAssets);
    for (const aFile of assetFiles) {
        fs.copyFileSync(path.join(srcAssets, aFile), path.join(destAssets, aFile));
        console.log(`  ✓ Copied assets/${aFile}`);
    }
} else {
    console.error('🚨 [BUILD ERROR] assets/ directory missing!');
    process.exit(1);
}

// 4. Strict Security Audit of dist/ Directory
// Strictly verify NO backend, private, or sensitive files leaked into dist/
const FORBIDDEN_PATTERNS = [
    'server.js',
    'tests',
    'supabase',
    'workers',
    'uploads',
    '.env',
    '.dev.vars',
    'package.json',
    'package-lock.json',
    '.git'
];

const distContents = fs.readdirSync(DIST_DIR);
for (const item of distContents) {
    for (const forbidden of FORBIDDEN_PATTERNS) {
        if (item === forbidden || item.startsWith('.env') || item.startsWith('.dev.vars')) {
            console.error(`🚨 [SECURITY VIOLATION] Forbidden file leaked into public build: ${item}`);
            process.exit(1);
        }
    }
}

// Check logo integrity in build output
const builtLogo = path.join(DIST_DIR, 'assets', 'digital-seva-logo.jpeg');
if (!fs.existsSync(builtLogo) || fs.statSync(builtLogo).size === 0) {
    console.error('🚨 [BUILD ERROR] Official digital-seva-logo.jpeg missing from dist/assets/!');
    process.exit(1);
}

console.log('✅ Cloudflare Pages build complete. Output directory: dist/');
