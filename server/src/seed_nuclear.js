const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.resolve(__dirname, '../nivaro.db');
const db = new sqlite3.Database(dbPath);

async function nuclearSeed() {
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('[SQL-ERR]', sql, err.message);
                reject(err);
            } else resolve(this);
        });
    });

    try {
        console.log('[SEED] Nuclear option: Dropping tables...');
        await run("DROP TABLE IF EXISTS stock_movements");
        await run("DROP TABLE IF EXISTS inventory_batches");
        await run("DROP TABLE IF EXISTS payments");
        await run("DROP TABLE IF EXISTS consultations");
        await run("DROP TABLE IF EXISTS purchase_orders");
        await run("DROP TABLE IF EXISTS audit_logs");

        console.log('[SEED] Recreating tactical tables...');
        await run(`CREATE TABLE purchase_orders (id TEXT PRIMARY KEY, vendor_id TEXT, order_date DATETIME, total_amount REAL, status TEXT)`);
        await run(`CREATE TABLE inventory_batches (id TEXT PRIMARY KEY, medicine_id TEXT, village_id TEXT, batch_number TEXT, purchase_order_id TEXT, expiry_date DATE, initial_quantity INT, remaining_quantity INT, purchase_cost REAL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE stock_movements (id TEXT PRIMARY KEY, medicine_id TEXT, batch_id TEXT, village_id TEXT, movement_type TEXT, quantity INT, user_id TEXT, reason TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE consultations (id TEXT PRIMARY KEY, patient_id TEXT, operator_id TEXT, doctor_id TEXT, vitals TEXT, status TEXT, fee REAL, notes TEXT, start_time DATETIME, end_time DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE payments (id TEXT PRIMARY KEY, prescription_id TEXT, consultation_id TEXT, amount REAL, status TEXT, commission_amount REAL, operator_id TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE audit_logs (id TEXT PRIMARY KEY, user_id TEXT, role TEXT, action TEXT, entity TEXT, entity_id TEXT, prev_value TEXT, new_value TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);

        const meds = await new Promise(res => db.all("SELECT id, sku_id FROM medicines", (e, r) => res(r || [])));
        const patients = await new Promise(res => db.all("SELECT id FROM patients", (e, r) => res(r || [])));
        const doctors = await new Promise(res => db.all("SELECT id FROM users WHERE role = 'doctor'", (e, r) => res(r || [])));
        const docId = doctors.length > 0 ? doctors[0].id : uuidv4();

        console.log('[SEED] Seeding inventory (5,000 per node)...');
        for (const med of meds) {
            for (let vIdx = 1; vIdx <= 3; vIdx++) {
                const bId = uuidv4();
                await run(`INSERT INTO inventory_batches (id, medicine_id, village_id, batch_number, expiry_date, initial_quantity, remaining_quantity, purchase_cost)
                    VALUES (?, ?, ?, ?, date('now', '+400 days'), 5000, 5000, 100)`,
                    [bId, med.id, `v${vIdx}`, `B-${med.sku_id}-v${vIdx}`]);

                await run(`INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, user_id, reason)
                    VALUES (?, ?, ?, ?, 'PURCHASE', 5000, 'admin-1', 'Initial Setup')`,
                    [uuidv4(), med.id, bId, `v${vIdx}`]);
            }
        }

        console.log('[SEED] Seeding 50 Payments TODAY...');
        for (let i = 0; i < 50; i++) {
            await run(`INSERT INTO payments (id, amount, status, timestamp) VALUES (?, ?, 'paid', datetime('now', '-${i} minutes'))`,
                [uuidv4(), 500 + (i * 10)]);
        }

        console.log('[SEED] Seeding 50 Consultations TODAY...');
        for (let i = 0; i < 50; i++) {
            const isCritical = i % 5 === 0;
            const v = JSON.stringify({ bp_systolic: isCritical ? 180 : 120, spo2: isCritical ? 88 : 98, glucose: isCritical ? 250 : 110 });
            await run(`INSERT INTO consultations (id, patient_id, doctor_id, operator_id, vitals, status, created_at)
                VALUES (?, ?, ?, 'op-1', ?, 'pending', datetime('now'))`,
                [uuidv4(), patients.length > 0 ? patients[0].id : uuidv4(), docId, v]);
        }

        console.log('[SEED] Done!');
    } catch (e) { console.error(e); } finally { db.close(); }
}
nuclearSeed();
