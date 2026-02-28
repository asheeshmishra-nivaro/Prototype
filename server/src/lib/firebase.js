const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db;
let auth;

// Priority 1: Environment Variables (Production/Vercel)
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
        console.log('[FIREBASE] Starting initialization via Environment Variables...');

        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // Clean private key (remove extra quotes if present)
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || 'nivaro-health',
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });
        db = admin.firestore();
        auth = admin.auth();
        console.log('[FIREBASE] SUCCESS: Admin SDK Initialized via Env');
    } catch (err) {
        console.error('[FIREBASE-FATAL] Initialization failed:', err.message);
    }
}
// Priority 2: Local JSON Key (Development)
else {
    const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        auth = admin.auth();
        console.log('[FIREBASE] Admin SDK Initialized via Local JSON');
    } else {
        console.warn('[FIREBASE-WARN] No Firebase credentials found (Env or JSON).');
        console.warn('[FIREBASE-WARN] Checked path:', serviceAccountPath);
    }
}

module.exports = { admin, db, auth };
