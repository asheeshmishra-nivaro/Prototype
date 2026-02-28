const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'nivaro.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES ('admin-local', 'Local Admin', 'admin@nivaro.com', ?, 'admin')`, [passwordHash], (err) => {
        if (err) {
            console.error('[ERROR]', err);
        } else {
            console.log('[SUCCESS] Local admin user created/ensured: admin@nivaro.com / admin123');
        }
        db.close();
    });
});
