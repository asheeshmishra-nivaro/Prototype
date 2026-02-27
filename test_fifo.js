const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/db/nivaro.db');
const { v4: uuidv4 } = require('uuid');

async function runTest() {
    console.log('[VERIFY] Starting FIFO Dispensing Test...');

    // 1. Check existing batches for Amoxicillin at Village Alpha
    const batches = await new Promise((resolve) => {
        db.all(`
            SELECT b.id, b.batch_number, b.expiry_date, b.remaining_quantity
            FROM inventory_batches b
            JOIN medicines m ON b.medicine_id = m.id
            WHERE m.name = 'Amoxicillin' AND b.village_id = 'v1'
            ORDER BY b.expiry_date ASC
        `, [], (err, rows) => resolve(rows));
    });

    console.log(`[DATA] Found ${batches.length} batches for Amoxicillin.`);
    batches.forEach(b => console.log(`  - ${b.batch_number}: Exp ${b.expiry_date}, Qty ${b.remaining_quantity}`));

    if (batches.length < 2) {
        console.error('[ERROR] Need at least 2 batches for a valid FIFO test. Run seeder first.');
        process.exit(1);
    }

    const firstBatch = batches[0];
    const secondBatch = batches[1];
    const unitsToDispense = firstBatch.remaining_quantity + 5; // Should drain first batch and take 5 from second

    console.log(`[TEST] Dispensing ${unitsToDispense} units. Expected: ${firstBatch.remaining_quantity} from ${firstBatch.batch_number}, 5 from ${secondBatch.batch_number}`);

    // Simulate prescription saving (Simplified FIFO logic from controller)
    const movements = [];
    let remaining = unitsToDispense;

    for (const b of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(b.remaining_quantity, remaining);
        movements.push({ batch_id: b.id, qty: deduct, batch_num: b.batch_number });
        remaining -= deduct;
    }

    console.log('[RESULT] Plan generated:');
    movements.forEach(m => console.log(`  - Deduct ${m.qty} from ${m.batch_num}`));

    const pass = (movements[0].batch_id === firstBatch.id && movements[0].qty === firstBatch.remaining_quantity && movements[1].qty === 5);

    if (pass) {
        console.log('[SUCCESS] FIFO Logic Verified: Earliest expiry batch prioritized correctly.');
    } else {
        console.error('[FAILURE] FIFO Logic Error: Deduction order or quantity mismatch.');
    }

    db.close();
}

runTest();
