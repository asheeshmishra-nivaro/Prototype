const db = require('./db');
async function run() {
    try {
        const res = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables in DB:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
