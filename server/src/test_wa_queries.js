const db = require('./db');
async function test() {
    try {
        console.log("--- SQLITE DATE/TIME CONTEXT ---");
        const ctx = await db.query("SELECT date('now') as d_now, datetime('now') as dt_now");
        console.log(JSON.stringify(ctx.rows, null, 2));

        console.log("--- RECENT MESSAGES (LIMIT 5) ---");
        const msgs = await db.query("SELECT id, timestamp FROM whatsapp_messages ORDER BY timestamp DESC LIMIT 5");
        console.log(JSON.stringify(msgs.rows, null, 2));

        console.log("--- TODAY FILTER TEST ---");
        const res = await db.query("SELECT COUNT(*) as count FROM whatsapp_messages WHERE timestamp >= date('now')");
        console.log(`Count for timestamp >= date('now'): ${res.rows[0].count}`);

        console.log("--- ALTERNATIVE TODAY FILTER TEST ---");
        const res2 = await db.query("SELECT COUNT(*) as count FROM whatsapp_messages WHERE date(timestamp) = date('now')");
        console.log(`Count for date(timestamp) = date('now'): ${res2.rows[0].count}`);
    } catch (e) {
        console.error(e);
    }
}
test();
