const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function seedAnalytics() {
    try {
        console.log('[WA-SEED] Generating 4,000+ analytics records...');

        // 1. Clear existing messages (optional)
        await db.query("DELETE FROM whatsapp_messages");
        await db.query("DELETE FROM whatsapp_campaigns");

        const messageTypes = ['Appointment', 'Follow-up', 'Prescription', 'Emergency', 'Broadcast'];
        const statuses = ['sent', 'delivered', 'read', 'failed'];
        const nodes = ['Alpha', 'Beta', 'Gamma'];

        // 2. Create a mock campaign
        const campaignId = uuidv4();
        await db.query(
            "INSERT INTO whatsapp_campaigns (id, name, sent_count, delivered_count, read_count, clicked_count) VALUES ($1, $2, $3, $4, $5, $6)",
            [campaignId, 'Vitals Awareness Drive', 200, 192, 160, 42]
        );

        const records = [];
        const now = new Date();

        for (let i = 0; i < 4200; i++) {
            const id = uuidv4();
            const daysAgo = Math.floor(Math.random() * 30);
            const hoursAgo = Math.floor(Math.random() * 24);
            const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000)).toISOString();

            // Weighted distribution
            let typeIdx;
            const rType = Math.random();
            if (rType < 0.42) typeIdx = 0; // Appointment
            else if (rType < 0.69) typeIdx = 1; // Follow-up
            else if (rType < 0.87) typeIdx = 2; // Prescription
            else if (rType < 0.95) typeIdx = 3; // Emergency
            else typeIdx = 4; // Broadcast

            const message_type = messageTypes[typeIdx];
            const is_emergency = message_type === 'Emergency' ? 1 : 0;

            let status;
            const rStat = Math.random();
            if (rStat < 0.05) status = 'failed';
            else if (rStat < 0.20) status = 'sent';
            else if (rStat < 0.85) status = 'read';
            else status = 'delivered';

            const node_id = nodes[Math.floor(Math.random() * nodes.length)];
            const campaign = (message_type === 'Broadcast' && Math.random() > 0.5) ? campaignId : null;

            records.push({ id, message_type, status, is_emergency, timestamp, node_id, campaign_id: campaign });

            // Insert in batches of 100
            if (records.length >= 100) {
                const values = records.map(r => `('${r.id}', 'P-TEST', '${r.message_type}', '${r.status}', ${r.is_emergency}, '${r.timestamp}', '${r.node_id}', ${r.campaign_id ? `'${r.campaign_id}'` : 'NULL'})`).join(',');
                await db.query(`INSERT INTO whatsapp_messages (id, patient_id, message_type, status, is_emergency, timestamp, node_id, campaign_id) VALUES ${values}`);
                records.length = 0;
            }
        }

        console.log('[WA-SEED] Success. 4,200 records generated.');
        process.exit(0);
    } catch (err) {
        console.error('[WA-SEED] Error:', err);
        process.exit(1);
    }
}

seedAnalytics();
