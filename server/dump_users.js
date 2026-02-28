const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'nivaro.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, email, role, name FROM users", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Users in nivaro.db:', JSON.stringify(rows, null, 2));
    }
    db.close();
});
