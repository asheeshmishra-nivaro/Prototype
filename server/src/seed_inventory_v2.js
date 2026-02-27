const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function seedAccounting() {
    console.log('[SEED-ACCOUNTING] Starting...');
    const adminId = 'admin-001';

    try {
        // Vendors
        await db.query("DELETE FROM vendors");
        await db.query("DELETE FROM purchase_orders");
        await db.query("DELETE FROM inventory_batches");
        await db.query("DELETE FROM stock_movements");

        const v1Id = 'vend-001';
        await db.query(`INSERT INTO vendors (id, name, contact_person, phone, email) VALUES 
            ($1, 'Bharat Pharma', 'Arun Kumar', '9123456789', 'contact@bharatpharma.com')`, [v1Id]);

        // Purchase Order
        const poId = 'po-1001';
        await db.query(`INSERT INTO purchase_orders (id, vendor_id, total_amount, status) VALUES 
            ($1, $2, 50000, 'received')`, [poId, v1Id]);

        // Fetch medicines to seed batches
        const medicines = await db.query("SELECT id, name FROM medicines");
        const villages = await db.query("SELECT id FROM villages");

        for (const med of medicines.rows) {
            for (const village of villages.rows) {
                // Create two batches for each medicine at each node for FIFO demonstration
                const batch1Id = uuidv4();
                const batch2Id = uuidv4();

                // Batch 1: Expiring soon (30 days)
                const exp1 = new Date();
                exp1.setDate(exp1.getDate() + 30);

                // Batch 2: Expiring later (365 days)
                const exp2 = new Date();
                exp2.setDate(exp2.getDate() + 365);

                await db.query(`INSERT INTO inventory_batches 
                    (id, medicine_id, village_id, batch_number, purchase_order_id, expiry_date, initial_quantity, remaining_quantity, purchase_cost) 
                    VALUES ($1, $2, $3, $4, $5, $6, 100, 100, 45.5)`,
                    [batch1Id, med.id, village.id, `BATCH-${med.name.slice(0, 3).toUpperCase()}-01`, poId, exp1.toISOString().split('T')[0]]);

                await db.query(`INSERT INTO inventory_batches 
                    (id, medicine_id, village_id, batch_number, purchase_order_id, expiry_date, initial_quantity, remaining_quantity, purchase_cost) 
                    VALUES ($1, $2, $3, $4, $5, $6, 200, 200, 42.0)`,
                    [batch2Id, med.id, village.id, `BATCH-${med.name.slice(0, 3).toUpperCase()}-02`, poId, exp2.toISOString().split('T')[0]]);

                // Stock movements for Purchase
                await db.query(`INSERT INTO stock_movements 
                    (id, medicine_id, batch_id, village_id, movement_type, quantity, user_id, reason) 
                    VALUES ($1, $2, $3, $4, 'PURCHASE', 100, $5, 'Initial Stock Intake')`,
                    [uuidv4(), med.id, batch1Id, village.id, adminId]);

                await db.query(`INSERT INTO stock_movements 
                    (id, medicine_id, batch_id, village_id, movement_type, quantity, user_id, reason) 
                    VALUES ($1, $2, $3, $4, 'PURCHASE', 200, $5, 'Initial Stock Intake')`,
                    [uuidv4(), med.id, batch2Id, village.id, adminId]);
            }
        }

        console.log('[SEED-ACCOUNTING] Success.');
        process.exit(0);
    } catch (err) {
        console.error('[SEED-ACCOUNTING-ERROR]', err);
        process.exit(1);
    }
}

seedAccounting();
