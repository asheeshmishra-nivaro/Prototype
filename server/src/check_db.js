const db = require('./db');

async function check() {
    try {
        const tables = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.rows.map(t => t.name));

        for (const table of tables.rows) {
            const count = await db.query(`SELECT COUNT(*) as count FROM ${table.name}`);
            console.log(`${table.name}: ${count.rows[0].count}`);
        }

        const users = await db.query("SELECT id, name, role FROM users");
        console.log('Users:', users.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
