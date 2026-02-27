const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.resolve(__dirname, '../nivaro.db');
const db = new sqlite3.Database(dbPath);

async function seed() {
    console.log('[SEED-FINAL] Starting Execution...');

    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error(`[SQL-ERROR] ${sql}`, err);
                reject(err);
            } else resolve(this);
        });
    });

    try {
        // 1. Fetch Master Data
        const meds = await new Promise(res => db.all("SELECT id, sku_id FROM medicines", (e, r) => res(r || [])));
        const patients = await new Promise(res => db.all("SELECT id FROM patients", (e, r) => res(r || [])));
        const docs = await new Promise(res => db.all("SELECT id FROM users WHERE role = 'doctor'", (e, r) => res(r || [])));
        const ops = await new Promise(res => db.all("SELECT id FROM users WHERE role = 'operator'", (e, r) => res(r || [])));

        console.log(`[SEED-FINAL] Baseline: ${meds.length} Meds, ${patients.length} Patients, ${docs.length} Doctors.`);

        // 2. Wipe Tactical Data
        await run("DELETE FROM stock_movements");
        await run("DELETE FROM inventory_batches");
        await run("DELETE FROM payments");
        await run("DELETE FROM consultations");
        await run("DELETE FROM purchase_orders");
        await run("DELETE FROM prescriptions");

        const villages = ['v1', 'v2', 'v3'];
        const operatorId = ops.length > 0 ? ops[0].id : uuidv4();
        const doctorId = docs.length > 0 ? docs[0].id : uuidv4();

        // 3. Purchase Orders & Inventory
        for (const med of meds) {
            for (const v of villages) {
                const poId = uuidv4();
                const cost = 80 + Math.random() * 120;
                const qty = 300 + Math.floor(Math.random() * 700);

                await run(`INSERT INTO purchase_orders (id, vendor_id, order_date, total_amount, status) 
                    VALUES (?, 'vend-1', datetime('now', '-10 days'), ?, 'received')`, [poId, cost * qty]);

                const batchId = uuidv4();
                const exp = (Math.random() > 0.9) ? "date('now', '+15 days')" : "date('now', '+400 days')";

                await run(`INSERT INTO inventory_batches (id, medicine_id, village_id, batch_number, purchase_order_id, expiry_date, initial_quantity, remaining_quantity, purchase_cost)
                    VALUES (?, ?, ?, ?, ?, ${exp}, ?, ?, ?)`, [batchId, med.id, v, `B-${med.sku_id}-${v}`, poId, qty, qty, cost]);

                await run(`INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, user_id, reason)
                    VALUES (?, ?, ?, ?, 'PURCHASE', ?, 'admin-1', 'Initial Stock')`, [uuidv4(), med.id, batchId, v, qty]);
            }
        }

        // 4. Consultations & Risk Data (11 Columns)
        console.log('[SEED-FINAL] Seeding 200 Consultations...');
        for (let i = 0; i < 200; i++) {
            const cId = uuidv4();
            const pId = patients.length > 0 ? patients[i % patients.length].id : uuidv4();
            const isCritical = i % 15 === 0;
            const vitals = JSON.stringify({
                bp_systolic: isCritical ? 175 : 120,
                spo2: isCritical ? 88 : 98,
                glucose: isCritical ? 280 : 110,
                temp: 98.6
            });

            // Columns: id, patient_id, operator_id, doctor_id, vitals, status, fee, notes, start_time, end_time, created_at
            await run(`INSERT INTO consultations VALUES (?, ?, ?, ?, ?, 'completed', 500, 'Routine Checkup', datetime('now', '-1 hour'), datetime('now'), datetime('now'))`,
                [cId, pId, operatorId, doctorId, vitals]);

            // Seed Payments linked to consultations
            const payId = uuidv4();
            // Columns: id, prescription_id, consultation_id, amount, status, commission_amount, operator_id, created_at
            await run(`INSERT INTO payments VALUES (?, NULL, ?, 500, 'paid', 50, ?, datetime('now'))`,
                [payId, cId, operatorId]);
        }

        console.log('[SEED-FINAL] Successfully populated high-volume data.');
    } catch (err) {
        console.error('[SEED-CRITICAL-ERROR]', err);
    } finally {
        db.close();
    }
}

seed();
