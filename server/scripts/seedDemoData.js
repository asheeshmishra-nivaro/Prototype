const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.resolve(__dirname, '../nivaro.db');
const db = new sqlite3.Database(dbPath);

const medicines = [
    { name: 'Amoxicillin', strength: '500mg', sku: 'AMX-500', cost: 45, price: 80 },
    { name: 'Paracetamol', strength: '650mg', sku: 'PCM-650', cost: 12, price: 25 },
    { name: 'Cetirizine', strength: '10mg', sku: 'CTZ-10', cost: 18, price: 35 },
    { name: 'Metformin', strength: '500mg', sku: 'MET-500', cost: 30, price: 60 },
    { name: 'Amlodipine', strength: '5mg', sku: 'AML-05', cost: 25, price: 55 },
    { name: 'Azithromycin', strength: '250mg', sku: 'AZI-250', cost: 85, price: 160 },
    { name: 'Omeprazole', strength: '20mg', sku: 'OMP-20', cost: 40, price: 75 },
    { name: 'Ibuprofen', strength: '400mg', sku: 'IBU-400', cost: 20, price: 45 },
    { name: 'Salbutamol', strength: '100mcg', sku: 'SAL-100', cost: 120, price: 210 },
    { name: 'Atorvastatin', strength: '10mg', sku: 'ATR-10', cost: 55, price: 110 }
];

async function seed() {
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); });
    });
    const all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
    });

    try {
        console.log('[SEED] Starting Structured Demo Seeding...');

        // Nuclear: Drop and Recreate to be 100% sure of schema
        await run("DROP TABLE IF EXISTS stock_movements");
        await run("DROP TABLE IF EXISTS inventory_batches");
        await run("DROP TABLE IF EXISTS payments");
        await run("DROP TABLE IF EXISTS prescriptions");
        await run("DROP TABLE IF EXISTS consultations");
        await run("DROP TABLE IF EXISTS patients");
        await run("DROP TABLE IF EXISTS medicines");
        await run("DROP TABLE IF EXISTS villages");
        await run("DROP TABLE IF EXISTS audit_logs");

        await run(`CREATE TABLE villages (id TEXT PRIMARY KEY, name TEXT NOT NULL, district TEXT, state TEXT)`);
        await run(`CREATE TABLE medicines (id TEXT PRIMARY KEY, name TEXT NOT NULL, generic_name TEXT, strength TEXT, form TEXT, sku_id TEXT UNIQUE NOT NULL, purchase_cost REAL, selling_price REAL, low_stock_threshold INT DEFAULT 20, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE patients (id TEXT PRIMARY KEY, name TEXT NOT NULL, age INT, gender TEXT, phone TEXT UNIQUE NOT NULL, address TEXT, village_id TEXT REFERENCES villages(id), medical_history TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE inventory_batches (id TEXT PRIMARY KEY, medicine_id TEXT REFERENCES medicines(id), village_id TEXT REFERENCES villages(id), batch_number TEXT NOT NULL, purchase_order_id TEXT, expiry_date DATE NOT NULL, initial_quantity INT NOT NULL, remaining_quantity INT NOT NULL, purchase_cost REAL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE consultations (id TEXT PRIMARY KEY, patient_id TEXT REFERENCES patients(id), operator_id TEXT REFERENCES users(id), doctor_id TEXT REFERENCES users(id), vitals TEXT, status TEXT DEFAULT 'pending', fee REAL, notes TEXT, start_time DATETIME, end_time DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE prescriptions (id TEXT PRIMARY KEY, consultation_id TEXT UNIQUE, prescription_id TEXT UNIQUE NOT NULL, doctor_id TEXT REFERENCES users(id), patient_id TEXT REFERENCES patients(id), medicines TEXT, instructions TEXT, digital_signature TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE payments (id TEXT PRIMARY KEY, prescription_id TEXT REFERENCES prescriptions(id), consultation_id TEXT REFERENCES consultations(id), amount REAL, status TEXT DEFAULT 'pending', commission_amount REAL, operator_id TEXT REFERENCES users(id), timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE stock_movements (id TEXT PRIMARY KEY, medicine_id TEXT REFERENCES medicines(id), batch_id TEXT REFERENCES inventory_batches(id), village_id TEXT REFERENCES villages(id), movement_type TEXT NOT NULL, quantity INT NOT NULL, linked_entity_id TEXT, user_id TEXT, reason TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE audit_logs (id TEXT PRIMARY KEY, user_id TEXT, role TEXT, action TEXT NOT NULL, entity TEXT, entity_id TEXT, prev_value TEXT, new_value TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);

        // 2. Villages (2 nodes)
        await run("INSERT INTO villages (id, name, district, state) VALUES ('v1', 'Village Alpha', 'Central', 'Telangana')");
        await run("INSERT INTO villages (id, name, district, state) VALUES ('v2', 'Village Beta', 'North', 'Andhra Pradesh')");

        // 3. Medicines (10 SKUs)
        for (const m of medicines) {
            await run(`INSERT INTO medicines (id, name, strength, sku_id, purchase_cost, selling_price, form) 
                VALUES (?, ?, ?, ?, ?, ?, 'Tablet')`, [uuidv4(), m.name, m.strength, m.sku, m.cost, m.price]);
        }
        const medRows = await all("SELECT id, name, sku_id, purchase_cost, selling_price FROM medicines");

        // 4. Inventory Batches
        for (const m of medRows) {
            for (const vId of ['v1', 'v2']) {
                const batch1 = uuidv4();
                await run(`INSERT INTO inventory_batches (id, medicine_id, village_id, batch_number, expiry_date, initial_quantity, remaining_quantity, purchase_cost)
                    VALUES (?, ?, ?, ?, date('now', '+15 days'), 100, 100, ?)`,
                    [batch1, m.id, vId, `B1-${m.sku_id}-${vId}`, m.purchase_cost]);
                const batch2 = uuidv4();
                await run(`INSERT INTO inventory_batches (id, medicine_id, village_id, batch_number, expiry_date, initial_quantity, remaining_quantity, purchase_cost)
                    VALUES (?, ?, ?, ?, date('now', '+400 days'), 1000, 1000, ?)`,
                    [batch2, m.id, vId, `B2-${m.sku_id}-${vId}`, m.purchase_cost]);
                await run(`INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, reason) VALUES (?, ?, ?, ?, 'PURCHASE', 100, 'Initial Batch')`, [uuidv4(), m.id, batch1, vId]);
                await run(`INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, reason) VALUES (?, ?, ?, ?, 'PURCHASE', 1000, 'Second Batch')`, [uuidv4(), m.id, batch2, vId]);
            }
        }

        // 5. Patients (40)
        for (let i = 1; i <= 40; i++) {
            await run("INSERT INTO patients (id, name, age, gender, phone, village_id) VALUES (?, ?, ?, ?, ?, ?)",
                [uuidv4(), `Patient ${i}`, 20 + (i % 50), i % 2 === 0 ? 'M' : 'F', `90000000${i.toString().padStart(2, '0')}`, i % 2 === 0 ? 'v1' : 'v2']);
        }
        const patientRows = await all("SELECT id FROM patients");

        const doctorId = 'doc-101';
        const operatorId = 'op-201';

        // 6. Consultations (30 Completed, 4 Active)
        for (let i = 0; i < 34; i++) {
            const isCompleted = i < 30;
            const pId = patientRows[i % patientRows.length].id;
            const cId = uuidv4();
            let vitals = { bp_systolic: 120, spo2: 98, glucose: 100, temp: 98.6 };
            if (i === 0 || i === 1 || i === 2) vitals.bp_systolic = 175; // 3 High BP
            if (i === 3) vitals.spo2 = 88; // 1 Critical SpO2
            if (i === 4 || i === 5) vitals.glucose = 280; // 2 Abnormal Glucose

            const status = isCompleted ? 'completed' : 'active';
            const fee = 500;

            await run(`INSERT INTO consultations (id, patient_id, doctor_id, operator_id, vitals, status, fee, created_at, start_time, end_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)`,
                [cId, pId, doctorId, operatorId, JSON.stringify(vitals), status, fee, isCompleted ? "datetime('now')" : null]);

            if (isCompleted) {
                const rxId = uuidv4();
                const medToDispense = medRows[i % medRows.length];
                const qtyToDispense = 5;
                await run(`INSERT INTO prescriptions (id, consultation_id, prescription_id, doctor_id, patient_id, medicines, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
                    [rxId, cId, `RX-${i}`, doctorId, pId, JSON.stringify([{ id: medToDispense.id, qty: qtyToDispense }])]);
                const villageId = i % 2 === 0 ? 'v1' : 'v2';
                const batches = await all(`SELECT id, remaining_quantity, purchase_cost FROM inventory_batches 
                    WHERE medicine_id = ? AND village_id = ? AND remaining_quantity > 0 ORDER BY expiry_date ASC`, [medToDispense.id, villageId]);
                let remainingNeeded = qtyToDispense;
                for (const batch of batches) {
                    if (remainingNeeded <= 0) break;
                    const deduction = Math.min(batch.remaining_quantity, remainingNeeded);
                    await run(`UPDATE inventory_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ?`, [deduction, batch.id]);
                    await run(`INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, linked_entity_id, reason)
                        VALUES (?, ?, ?, ?, 'dispense', ?, ?, ?)`,
                        [uuidv4(), medToDispense.id, batch.id, villageId, -deduction, rxId, 'Demo Dispensing']);
                    remainingNeeded -= deduction;
                }
                await run(`INSERT INTO payments (id, prescription_id, consultation_id, amount, status, timestamp)
                    VALUES (?, ?, ?, ?, 'paid', datetime('now'))`,
                    [uuidv4(), rxId, cId, medToDispense.selling_price * qtyToDispense]);
            }
        }

        await run(`INSERT INTO audit_logs (id, user_id, role, action, entity, timestamp) VALUES (?, ?, 'admin', 'Demo Data Reseeded', 'System', datetime('now'))`, [uuidv4(), 'admin-001']);
        console.log('[SEED-SUCCESS] Demo Data Loaded Successfully.');
        return true;
    } catch (err) {
        console.error('[SEED-ERROR]', err);
        return false;
    } finally {
        if (require.main === module) db.close();
    }
}

if (require.main === module) seed();
module.exports = { seedDemoData: seed };
