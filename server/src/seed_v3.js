const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.resolve(__dirname, '../nivaro.db');
const db = new sqlite3.Database(dbPath);

async function seed() {
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    try {
        console.log('[SEED] Ensuring tables exist...');
        await run(`CREATE TABLE IF NOT EXISTS purchase_orders (id TEXT PRIMARY KEY, vendor_id TEXT, order_date DATETIME, total_amount REAL, status TEXT)`);
        await run(`CREATE TABLE IF NOT EXISTS inventory_batches (id TEXT PRIMARY KEY, medicine_id TEXT, village_id TEXT, batch_number TEXT, purchase_order_id TEXT, expiry_date DATE, initial_quantity INT, remaining_quantity INT, purchase_cost REAL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE IF NOT EXISTS stock_movements (id TEXT PRIMARY KEY, medicine_id TEXT, batch_id TEXT, village_id TEXT, movement_type TEXT, quantity INT, user_id TEXT, reason TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE IF NOT EXISTS consultations (id TEXT PRIMARY KEY, patient_id TEXT, operator_id TEXT, doctor_id TEXT, vitals TEXT, status TEXT, fee REAL, notes TEXT, start_time DATETIME, end_time DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, prescription_id TEXT, consultation_id TEXT, amount REAL, status TEXT, commission_amount REAL, operator_id TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_id TEXT, role TEXT, action TEXT, entity TEXT, entity_id TEXT, prev_value TEXT, new_value TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);

        console.log('[SEED] Cleaning tactical tables...');
        await run("DELETE FROM stock_movements");
        await run("DELETE FROM inventory_batches");
        await run("DELETE FROM payments");
        await run("DELETE FROM consultations");
        await run("DELETE FROM purchase_orders");
        await run("DELETE FROM audit_logs");

        const meds = await new Promise(res => db.all("SELECT id, sku_id FROM medicines", (e, r) => res(r || [])));
        const patients = await new Promise(res => db.all("SELECT id FROM patients", (e, r) => res(r || [])));
        const doctors = await new Promise(res => db.all("SELECT id FROM users WHERE role = 'doctor'", (e, r) => res(r || [])));
        const operatorId = 'user-operator-1';
        const doctorId = doctors.length > 0 ? doctors[0].id : 'user-doctor-1';

        console.log('[SEED] Injecting high-volume inventory...');
        for (const med of meds) {
            for (let vIdx = 1; vIdx <= 3; vIdx++) {
                const village = `v${vIdx}`;
                const qty = 5000 + Math.floor(Math.random() * 5000);
                const cost = 120;
                const batchId = uuidv4();

                await run(`INSERT INTO inventory_batches (id, medicine_id, village_id, batch_number, expiry_date, initial_quantity, remaining_quantity, purchase_cost)
                    VALUES (?, ?, ?, ?, date('now', '+1 year'), ?, ?, ?)`,
                    [batchId, med.id, village, `B-${med.sku_id}-${village}`, qty, qty, cost]);

                await run(`INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, user_id, reason)
                    VALUES (?, ?, ?, ?, 'PURCHASE', ?, 'admin-1', 'Initial Setup')`,
                    [uuidv4(), med.id, batchId, village, qty]);
            }
        }

        console.log('[SEED] Injecting 200+ Payments for Today & History...');
        for (let i = 0; i < 300; i++) {
            const isToday = i < 50;
            const ts = isToday ? "datetime('now', '-2 hours')" : "datetime('now', '-3 days')";
            await run(`INSERT INTO payments (id, amount, status, timestamp) VALUES (?, ?, 'paid', ${ts})`,
                [uuidv4(), 500 + Math.floor(Math.random() * 500)]);
        }

        console.log('[SEED] Injecting 150 Consultations with Risk Radar cases...');
        for (let i = 0; i < 150; i++) {
            const pId = patients.length > 0 ? patients[i % patients.length].id : uuidv4();
            const isCritical = i % 8 === 0;
            const vitals = JSON.stringify({
                bp_systolic: isCritical ? 185 : 120,
                spo2: isCritical ? 85 : 98,
                glucose: isCritical ? 300 : 100
            });
            await run(`INSERT INTO consultations (id, patient_id, doctor_id, operator_id, vitals, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`,
                [uuidv4(), pId, doctorId, operatorId, vitals]);
        }

        console.log('[SEED-SUCCESS] Data Excellence Restored.');
    } catch (err) {
        console.error('[SEED-ERROR]', err);
    } finally {
        db.close();
    }
}

seed();
