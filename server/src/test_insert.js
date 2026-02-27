const db = require('./db');

async function test() {
    try {
        console.log('[TEST] Checking current count...');
        const before = await db.query("SELECT COUNT(*) as count FROM patients");
        console.log('[TEST] Count before:', before.rows[0].count);

        console.log('[TEST] Inserting test patient...');
        await db.query("INSERT INTO patients (id, name, age, gender, phone, village_id) VALUES ($1, $2, $3, $4, $5, $6)",
            ['test-p-1', 'Test Patient', 30, 'M', '123', 'v1']);

        const after = await db.query("SELECT COUNT(*) as count FROM patients");
        console.log('[TEST] Count after insert:', after.rows[0].count);

        const rows = await db.query("SELECT * FROM patients WHERE id = 'test-p-1'");
        console.log('[TEST] Inserted Row:', rows.rows);

        process.exit(0);
    } catch (err) {
        console.error('[TEST-ERROR]', err);
        process.exit(1);
    }
}

test();
