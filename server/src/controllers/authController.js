const { auth, firestore: db } = require('../db');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password, token: idToken } = req.body;
        console.log(`[AUTH] Firebase Login attempt for: ${email}`);

        let user;
        let token = idToken;

        if (idToken) {
            // Verify Client-side Firebase ID Token
            const decodedToken = await auth.verifyIdToken(idToken);
            const userDoc = await db.collection('users').doc(decodedToken.uid).get();
            user = { id: decodedToken.uid, ...userDoc.data() };
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
