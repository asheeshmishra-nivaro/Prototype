const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    console.log('[SEEDER] Starting Final Seeding...');

    const doctorId = 'doc-101';
    const operatorId = 'op-201';

    try {
        // Clear all
        await db.query("DELETE FROM consultations");
        await db.query("DELETE FROM patients");
        await db.query("DELETE FROM villages");
        await db.query("DELETE FROM users");

        // Villages
        await db.query(`INSERT INTO villages (id, name, district, state) VALUES 
            ('v1', 'Village Alpha', 'District X', 'State Y'),
            ('v2', 'Village Beta', 'District X', 'State Y'),
            ('v3', 'Village Gamma', 'District X', 'State Y')`);

        // Users
        await db.query(`INSERT INTO users (id, name, email, password_hash, role, village_id) VALUES 
            ('admin-001', 'Nivaro Admin', 'admin@nivaro.com', 'hash', 'admin', NULL),
            ('doc-101', 'Dr. Amartya Sen', 'doctor@nivaro.com', 'hash', 'doctor', NULL),
            ('op-201', 'Village Operator John', 'operator@nivaro.com', 'hash', 'operator', 'v1')`);

        // Patients
        const patients = [
            { id: 'p101', name: 'Rajesh Kumar', age: 45, gender: 'Male', phone: '9876543210', village_id: 'v1' },
            { id: 'p102', name: 'Sunita Devi', age: 38, gender: 'Female', phone: '9876543211', village_id: 'v1' },
            { id: 'p103', name: 'Amit Singh', age: 52, gender: 'Male', phone: '9876543212', village_id: 'v2' },
            { id: 'p104', name: 'Priya Sharma', age: 29, gender: 'Female', phone: '9876543213', village_id: 'v3' },
            { id: 'p105', name: 'Vijay Patel', age: 60, gender: 'Male', phone: '9876543214', village_id: 'v1' }
        ];

        for (const p of patients) {
            await db.query(
                "INSERT INTO patients (id, name, age, gender, phone, village_id) VALUES ($1, $2, $3, $4, $5, $6)",
                [p.id, p.name, p.age, p.gender, p.phone, p.village_id]
            );
        }

        // Consultations
        const today = new Date().toISOString();
        const consultations = [
            { id: uuidv4(), patient_id: 'p102', status: 'completed', vitals: { spo2: 98, bp_systolic: 120, bp_diastolic: 80, temp: 98.4, glucose: 95 }, fee: 150 },
            { id: uuidv4(), patient_id: 'p103', status: 'completed', vitals: { spo2: 97, bp_systolic: 130, bp_diastolic: 85, temp: 98.6, glucose: 110 }, fee: 150 },
            { id: uuidv4(), patient_id: 'p101', status: 'pending', vitals: { spo2: 95, bp_systolic: 122, bp_diastolic: 82, temp: 99.1, glucose: 145 }, fee: 0 },
            { id: uuidv4(), patient_id: 'p105', status: 'pending', vitals: { spo2: 88, bp_systolic: 110, bp_diastolic: 70, temp: 101.2, glucose: 92 }, fee: 0 },
            { id: uuidv4(), patient_id: 'p103', status: 'pending', vitals: { spo2: 96, bp_systolic: 155, bp_diastolic: 98, temp: 98.8, glucose: 115 }, fee: 0 }
        ];

        for (const c of consultations) {
            await db.query(
                `INSERT INTO consultations (id, patient_id, operator_id, doctor_id, vitals, status, fee, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [c.id, c.patient_id, operatorId, doctorId, JSON.stringify(c.vitals), c.status, c.fee, today]
            );
        }

        // Verification
        const pCount = await db.query("SELECT COUNT(*) as count FROM patients");
        const cCount = await db.query("SELECT COUNT(*) as count FROM consultations WHERE status='pending'");
        console.log(`[VERIFY] Patients: ${pCount.rows[0].count}`);
        console.log(`[VERIFY] Pending Consultations: ${cCount.rows[0].count}`);

        process.exit(0);
    } catch (err) {
        console.error('[SEEDER-ERROR]', err);
        process.exit(1);
    }
}

seed();
