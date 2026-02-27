const db = require('./db');

async function check() {
    try {
        console.log('--- JOIN DIAGNOSIS ---');

        const p = await db.query("SELECT id, name, village_id FROM patients");
        console.log('Patients:', p.rows);

        const v = await db.query("SELECT id, name FROM villages");
        console.log('Villages:', v.rows);

        const join = await db.query(`
            SELECT p.name as patient, v.name as village
            FROM patients p
            JOIN villages v ON p.village_id = v.id
        `);
        console.log('Join Count:', join.rows.length);
        if (join.rows.length === 0) {
            console.log('FAILURE: Patient-Village join produced 0 rows.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
