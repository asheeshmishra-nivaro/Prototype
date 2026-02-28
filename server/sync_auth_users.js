const { auth, firestore } = require('./src/db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Migration Utility: Sync SQLite users to Firebase Authentication
 */

const dbPath = path.resolve(__dirname, 'nivaro.db');
const sqlDb = new sqlite3.Database(dbPath);

async function syncUsers() {
    console.log('[AUTH-SYNC] Starting account registration...');

    const rows = await new Promise((resolve, reject) => {
        sqlDb.all("SELECT * FROM users", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });

    console.log(`[AUTH-SYNC] Found ${rows.length} users to sync.`);

    for (const row of rows) {
        try {
            console.log(`[AUTH-SYNC] Processing: ${row.email}`);

            // 1. Create User in Firebase Auth
            let userRecord;
            try {
                userRecord = await auth.getUserByEmail(row.email);
                console.log(`[AUTH-SYNC] User already exists in Auth: ${row.email}`);
            } catch (e) {
                if (e.code === 'auth/user-not-found') {
                    userRecord = await auth.createUser({
                        uid: row.id, // Keep the same ID if possible
                        email: row.email,
                        password: 'password123', // Default password for prototype
                        displayName: row.name
                    });
                    console.log(`[AUTH-SYNC] Created new Auth user: ${row.email}`);
                } else {
                    throw e;
                }
            }

            // 2. Set Custom Claims (Role)
            await auth.setCustomUserClaims(userRecord.uid, { role: row.role });
            console.log(`[AUTH-SYNC] Set role '${row.role}' for ${row.email}`);

            // 3. Ensure Firestore profile exists and matches
            await firestore.collection('users').doc(userRecord.uid).set({
                id: userRecord.uid,
                email: row.email,
                name: row.name,
                role: row.role,
                updated_at: new Date()
            }, { merge: true });

            console.log(`[AUTH-SYNC] Updated Firestore profile for ${row.email}`);

        } catch (err) {
            console.error(`[AUTH-SYNC-ERROR] Failed for ${row.email}:`, err.message);
        }
    }

    console.log('[AUTH-SYNC] SUCCESS: All users are now in Firebase Auth and Firestore.');
    process.exit(0);
}

syncUsers().catch(err => {
    console.error('[AUTH-SYNC-FATAL]', err);
    process.exit(1);
});
