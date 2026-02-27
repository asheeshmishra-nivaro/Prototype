const db = require('./db');
const whatsappService = require('./services/whatsappService');

async function verify() {
    try {
        console.log('[VERIFY] Starting clinical automation test...');

        // 1. Get a test patient
        const patient = await db.query("SELECT * FROM patients LIMIT 1");
        if (patient.rows.length === 0) throw new Error('No patient found for testing');
        const pId = patient.rows[0].id;

        // 2. Insert consent
        await db.query("INSERT OR REPLACE INTO whatsapp_consent (patient_id, consent_status) VALUES ($1, 'opted_in')", [pId]);
        console.log('[VERIFY] Consent granted for patient:', pId);

        // 3. Simulate Prescription (Trigger Automation)
        console.log('[VERIFY] Simulating prescription creation...');
        await whatsappService.triggerAutomation('prescription_created', pId);

        // 4. Verify scheduled messages
        const scheduled = await db.query("SELECT * FROM whatsapp_scheduled_messages WHERE patient_id = $1", [pId]);
        console.log(`[VERIFY] Scheduled messages found: ${scheduled.rows.length}`);
        scheduled.rows.forEach(m => console.log(` - ID: ${m.id}, Time: ${m.scheduled_time}, Status: ${m.status}`));

        // 5. Test Status Update
        console.log('[VERIFY] Testing delivery status update...');
        const logId = 'test-log-id';
        const metaId = 'meta-msg-001';
        await db.query("INSERT INTO whatsapp_logs (id, message_id, to_number, content, status) VALUES ($1, $2, '9199xxxxxx', 'Test message', 'sent')", [logId, metaId]);

        await whatsappService.updateMessageStatus(metaId, 'read', Math.floor(Date.now() / 1000).toString());

        const updatedLog = await db.query("SELECT * FROM whatsapp_logs WHERE id = $1", [logId]);
        console.log('[VERIFY] Log Status after update:', updatedLog.rows[0].status);
        console.log('[VERIFY] Log Read At:', updatedLog.rows[0].read_at);

        console.log('[VERIFY] Done.');
        process.exit(0);
    } catch (err) {
        console.error('[VERIFY] Error:', err);
        process.exit(1);
    }
}

verify();
