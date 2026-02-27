const db = require('./db');

async function seed() {
    try {
        console.log('[WA-SEED] Inserting mock templates and rules...');

        // 1. Templates
        const templates = [
            { id: 't1', name: 'Follow-up Day 3', content: 'Hi {{name}}, checking in on Day 3. How are you feeling?', category: 'Reminder' },
            { id: 't2', name: 'Follow-up Day 7', content: 'Hi {{name}}, it is Day 7. Is your recovery on track?', category: 'Reminder' },
            { id: 't3', name: 'BP Check Reminder', content: 'Hi {{name}}, time for your weekly BP check.', category: 'Alert' },
            { id: 't4', name: 'Medicine Reminder', content: 'Hi {{name}}, time to take your dose of {{med}}.', category: 'Reminder' }
        ];

        for (const t of templates) {
            await db.query(
                "INSERT OR REPLACE INTO whatsapp_templates (id, name, content, category, status) VALUES ($1, $2, $3, $4, 'approved')",
                [t.id, t.name, t.content, t.category]
            );
        }

        // 2. Automation Rules
        const rules = [
            { id: 'r1', trigger: 'prescription_created', delay: 3, template: 't1' },
            { id: 'r2', trigger: 'prescription_created', delay: 7, template: 't2' },
            { id: 'r3', trigger: 'chronic_bp_detected', delay: 7, template: 't3' }
        ];

        for (const r of rules) {
            await db.query(
                "INSERT OR REPLACE INTO whatsapp_automation_rules (id, trigger_event, delay_days, template_id, is_active) VALUES ($1, $2, $3, $4, 1)",
                [r.id, r.trigger, r.delay, r.template]
            );
        }

        console.log('[WA-SEED] Success.');
        process.exit(0);
    } catch (err) {
        console.error('[WA-SEED] Error:', err);
        process.exit(1);
    }
}

seed();
