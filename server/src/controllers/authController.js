const { auth, firestore: db } = require('../db');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password, token: idToken } = req.body;

        // FAIL FAST: Check if Firebase is initialized
        if (!auth || !db) {
            console.error('[AUTH-FATAL] Firebase Auth or Firestore is not initialized. Check Env Vars!');
            return res.status(500).json({
                error: 'Authentication service unavailable',
                details: 'Firebase services not initialized on server. Check Vercel Environment Variables.'
            });
        }

        console.log(`[AUTH] Firebase Login attempt for: ${email}`);

        let user;
        let token = idToken;

        if (idToken) {
            // Verify Client-side Firebase ID Token
            const decodedToken = await auth.verifyIdToken(idToken).catch(e => {
                console.error('[AUTH] Token verification failed:', e.message);
                throw e;
            });

            const userDoc = await db.collection('users').doc(decodedToken.uid).get();
            if (userDoc.exists) {
                user = { id: decodedToken.uid, ...userDoc.data() };
            } else {
                console.warn(`[AUTH] User ${decodedToken.uid} has no profile in Firestore.`);
            }
        } else {
            // Fallback: This usually happens on the client, but for API tests:
            // In a real Firebase app, the client signs in and sends the ID Token.
            return res.status(400).json({ error: 'Firebase ID Token required for backend verification' });
        }

        if (!user) {
            return res.status(401).json({ error: 'User not found in Firestore' });
        }

        // We can still issue a custom JWT if needed for other services, 
        // but typically Firebase ID token is enough.
        res.json({ token, user });
    } catch (err) {
        console.error('[AUTH-ERROR] Firebase Login failed:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

const getDoctors = async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'doctor').get();
        const doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(doctors);
    } catch (err) {
        console.error('[AUTH-ERROR] getDoctors failed:', err);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
};

module.exports = { login, getDoctors };
