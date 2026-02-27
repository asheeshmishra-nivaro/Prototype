const db = require('./db');
async function check() {
    const tables = [
        'whatsapp_templates',
        'whatsapp_automation_rules',
        'whatsapp_consent',
        'whatsapp_logs',
        'whatsapp_scheduled_messages',
        'whatsapp_messages',
        'whatsapp_campaigns'
    ];

    console.log("--- WHATSAPP DATA CHECK ---");
    for (const t of tables) {
        try {
            const res = await db.query(`SELECT COUNT(*) as count FROM ${t}`);
            console.log(`[OK] ${t}: ${res.rows[0].count} records.`);
        } catch (e) {
            console.log(`[ERROR] ${t}: ${e.message}`);
        }
    }
}
check();
