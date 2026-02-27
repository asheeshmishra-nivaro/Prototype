const db = require('./db');
async function run() {
    try {
        const res = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Full Table List:");
        res.rows.forEach(r => console.log(` - ${r.name}`));
    } catch (e) {
        console.error(e);
    }
}
run();
