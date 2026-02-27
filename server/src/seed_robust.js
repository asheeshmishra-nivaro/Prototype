const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Use the exact same path logic as server/src/db.js
const dbPath = path.resolve(__dirname, '../nivaro.db');
const db = new sqlite3.Database(dbPath);

console.log('[SEED-ROBUST] Target DB:', dbPath);

async function runTest() {
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    try {
        // Clear all tactical tables
        await run("DELETE FROM stock_movements");
        await run("DELETE FROM inventory_batches");
        await run("DELETE FROM payments");
        await run("DELETE FROM consultations");
        await run("DELETE FROM purchase_orders");
        await run("DELETE FROM audit_logs");

        const meds = await new Promise(res => db.all("SELECT id, sku_id FROM medicines", (e, r) => res(r || [])));
        const patients = await new Promise(res => db.all("SELECT id FROM patients", (e, r) => res(r || [])));
        const doctors = await new Promise(res => db.all("SELECT id FROM users WHERE role = 'doctor'", (e, r) => res(r || [])));
        const operators = await new Promise(res => db.all("SELECT id FROM users WHERE role = 'operator'", (e, r) => res(r || [])));

        const vId = 'v1';
        const docId = doctors.length > 0 ? doctors[0].id : uuidv4();
        const opId = operators.length > 0 ? operators[0].id : uuidv4();

        // 1. Massive Inventory (Value)
        console.log('[SEED-ROBUST] Seeding 50,000+ Units...');
        for (const med of meds) {
            for (let vIdx = 1; vIdx <= 3; vIdx++) {
                const village = `v${vIdx}`;
                const baseQty = 2000 + Math.floor(Math.random() * 5000);
                const cost = 85 + Math.random() * 50;

                const batchId = uuidv4();
                await run(`INSERT INTO inventory_batches (id, medicine_id, village_id, batch_number, expiry_date, initial_quantity, remaining_quantity, purchase_cost)
                    VALUES (?, ?, ?, ?, date('now', '+300 days'), ?, ?, ?)`,
                    [batchId, med.id, village, `BATCH-${med.sku_id}-${village}`, baseQty, baseQty, cost]);

                await run(`INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, user_id, reason, timestamp)
                    VALUES (?, ?, ?, ?, 'PURCHASE', ?, 'admin-1', 'Initial Setup', datetime('now'))`,
                    [uuidv4(), med.id, batchId, village, baseQty]);
            }
        }

        // 2. High Revenue (Today & Weekly)
        console.log('[SEED-ROBUST] Seeding 1,000+ Payments (~₹8,00,000)...');
        // Today's samples (50)
        for (let i = 0; i < 50; i++) {
            await run(`INSERT INTO payments (id, amount, method, status, timestamp) 
                VALUES (?, ?, 'UPI', 'paid', datetime('now', '-${Math.floor(Math.random() * 12)} hours'))`,
                [uuidv4(), 800 + Math.floor(Math.random() * 400)]);
        }
        // Weekly samples (950)
        for (let i = 0; i < 950; i++) {
            await run(`INSERT INTO payments (id, amount, method, status, timestamp) 
                VALUES (?, ?, 'cash', 'paid', datetime('now', '-${Math.floor(Math.random() * 7)} days'))`,
                [uuidv4(), 400 + Math.floor(Math.random() * 600)]);
        }

        // 3. Clinical Cases (Risk Radar) - Today
        console.log('[SEED-ROBUST] Seeding 100 Consultations Today...');
        for (let i = 0; i < 100; i++) {
            const pId = patients.length > 0 ? patients[i % patients.length].id : uuidv4();
            const isCritical = i % 10 === 0;
            const vitals = JSON.stringify({
                bp_systolic: isCritical ? 175 + Math.floor(Math.random() * 20) : 120 + Math.floor(Math.random() * 20),
                spo2: isCritical ? 88 : 98,
                glucose: isCritical ? 240 : 110,
                temp: 98.6
            });
            await run(`INSERT INTO consultations (id, patient_id, doctor_id, operator_id, vitals, status, start_time, end_time, fee)
                VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'), 500)`,
                [uuidv4(), pId, docId, opId, vitals]);
        }

        // 4. Audit Log Exemplary data
        await run(`INSERT INTO audit_logs (id, user_id, action, entity, timestamp) VALUES (?, 'admin-1', 'System Optimized', 'Global', datetime('now'))`, [uuidv4()]);

        console.log('[SEED-ROBUST] Success! System is now data-rich.');
    } catch (err) {
        console.error('[SEED-ERROR]', err);
    } finally {
        db.close();
    }
}

runTest();
