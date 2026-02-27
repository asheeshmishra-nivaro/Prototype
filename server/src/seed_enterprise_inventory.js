const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const seedEnterpriseInventory = async () => {
    console.log('[SEED] Starting Enterprise Pharmaceutical Inventory Seeding...');

    try {
        // 1. Clear existing inventory data
        await db.query("DELETE FROM inventory_reconciliations");
        await db.query("DELETE FROM stock_movements");
        await db.query("DELETE FROM inventory");
        await db.query("DELETE FROM inventory_batches");
        await db.query("DELETE FROM medicines");

        // 2. Fetch Villages for Node Assignment
        const villageRes = await db.query("SELECT id FROM villages");
        const villages = villageRes.rows.map(v => v.id);
        const nodeWarehouse = 'warehouse'; // Logic node
        const nodeAlpha = villages[0] || 'v1';
        const nodeBeta = villages[1] || 'v2';

        // Add 'Central Warehouse' if not exists or just use a logic ID
        // For simplicity in this prototype, let's just use the first village as warehouse if needed, 
        // but better to have a dedicated node.

        // 3. Seed SKU Master Registry (25+ Medicines)
        const skus = [
            ['m01', 'Paracetamol 500mg', 'Paracetamol', '500mg', 'Tablet', 'SKU-PARA-500', 12.0, 15.0, 20.0, 'Analgesic', 'GlaxoSmithKline'],
            ['m02', 'Amoxicillin 250mg', 'Amoxicillin', '250mg', 'Capsule', 'SKU-AMOX-250', 45.0, 60.0, 25.0, 'Antibiotic', 'Pfizer'],
            ['m03', 'Metformin 500mg', 'Metformin', '500mg', 'Tablet', 'SKU-METF-500', 18.0, 25.0, 28.0, 'Antidiabetic', 'Merck'],
            ['m04', 'Atorvastatin 10mg', 'Atorvastatin', '10mg', 'Tablet', 'SKU-ATOR-10', 85.0, 110.0, 22.0, 'Statin', 'Lupin'],
            ['m05', 'Azithromycin 500mg', 'Azithromycin', '500mg', 'Tablet', 'SKU-AZIT-500', 120.0, 180.0, 33.0, 'Antibiotic', 'Sun Pharma'],
            ['m06', 'ORS Sachcet', 'Oral Rehydration Salts', '21.8g', 'Powder', 'SKU-ORSS-01', 5.0, 8.0, 37.0, 'Electrolytes', 'Cipla'],
            ['m07', 'Insulin Glargine', 'Insulin', '100u/ml', 'Injection', 'SKU-INSU-100', 450.0, 600.0, 25.0, 'Hormone', 'Novo Nordisk'],
            ['m08', 'Cefixime 200mg', 'Cefixime', '200mg', 'Tablet', 'SKU-CEFI-200', 95.0, 140.0, 32.0, 'Antibiotic', 'Alkem'],
            ['m09', 'Pantoprazole 40mg', 'Pantoprazole', '40mg', 'Tablet', 'SKU-PANT-40', 35.0, 55.0, 36.0, 'Antacid', 'Sun Pharma'],
            ['m10', 'Dolo 650', 'Paracetamol', '650mg', 'Tablet', 'SKU-DOLO-650', 25.0, 35.0, 28.0, 'Analgesic', 'Micro Labs'],
            ['m11', 'Cetirizine 10mg', 'Cetirizine', '10mg', 'Tablet', 'SKU-CETI-10', 8.0, 12.0, 33.0, 'Antihistamine', 'Dr. Reddys'],
            ['m12', 'Ibuprofen 400mg', 'Ibuprofen', '400mg', 'Tablet', 'SKU-IBUP-400', 15.0, 20.0, 25.0, 'NSAID', 'Abbott'],
            ['m13', 'Amlodipine 5mg', 'Amlodipine', '5mg', 'Tablet', 'SKU-AMLO-05', 12.0, 18.0, 33.0, 'Antihypertensive', 'Pfizer'],
            ['m14', 'Losartan 50mg', 'Losartan', '50mg', 'Tablet', 'SKU-LOSA-50', 25.0, 40.0, 37.0, 'Antihypertensive', 'Merck'],
            ['m15', 'Omeprazole 20mg', 'Omeprazole', '20mg', 'Capsule', 'SKU-OMEP-20', 20.0, 32.0, 37.0, 'Antacid', 'AstraZeneca'],
            ['m16', 'Ranitidine 150mg', 'Ranitidine', '150mg', 'Tablet', 'SKU-RANI-150', 10.0, 15.0, 33.0, 'Antacid', 'GSK'],
            ['m17', 'Metronidazole 400mg', 'Metronidazole', '400mg', 'Tablet', 'SKU-METR-400', 18.0, 28.0, 35.0, 'Antiprotozoal', 'J.B. Chemicals'],
            ['m18', 'Albendazole 400mg', 'Albendazole', '400mg', 'Tablet', 'SKU-ALBE-400', 35.0, 50.0, 30.0, 'Anthelmintic', 'GSK'],
            ['m19', 'Salbutamol Inhaler', 'Salbutamol', '100mcg', 'Inhaler', 'SKU-SALB-01', 110.0, 160.0, 31.0, 'Bronchodilator', 'Cipla'],
            ['m20', 'Levocetirizine 5mg', 'Levocetirizine', '5mg', 'Tablet', 'SKU-LEVO-05', 15.0, 25.0, 40.0, 'Antihistamine', 'Ustek'],
            ['m21', 'Diclofenac Gel', 'Diclofenac', '1%', 'Ointment', 'SKU-DICL-01', 45.0, 75.0, 40.0, 'Topical Pain', 'Cipla'],
            ['m22', 'Povidone Iodine', 'Povidone Iodine', '5%', 'Solution', 'SKU-POVI-01', 65.0, 95.0, 31.0, 'Antiseptic', 'Win-Medicare'],
            ['m23', 'Cough Syrup (Benadryl)', 'Diphenhydramine', '12.5mg/5ml', 'Syrup', 'SKU-COUG-01', 85.0, 130.0, 34.0, 'Antitussive', 'J&J'],
            ['m24', 'Vitamin 12 (Cobalamin)', 'Vitamin B12', '1500mcg', 'Tablet', 'SKU-VB12-01', 120.0, 180.0, 33.0, 'Vitamin', 'Alkem'],
            ['m25', 'Zinc 20mg', 'Zinc Sulfate', '20mg', 'Tablet', 'SKU-ZINC-20', 10.0, 18.0, 44.0, 'Supplement', 'Abbott']
        ];

        for (const s of skus) {
            await db.query(`
                INSERT INTO medicines (
                    id, name, generic_name, strength, form, sku_id, 
                    purchase_cost, selling_price, mrp, margin_percent, category, manufacturer
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, s);
        }

        // 4. Seed 40+ Batches across locations
        const batchTemplates = [
            { mid: 'm01', nodes: [nodeAlpha, nodeBeta], qty: 500, expiry_days: 365 },
            { mid: 'm02', nodes: [nodeAlpha], qty: 200, expiry_days: 15 }, // Expiring soon
            { mid: 'm03', nodes: [nodeBeta], qty: 300, expiry_days: 45 }, // Expiring medium
            { mid: 'm04', nodes: [nodeAlpha, nodeBeta], qty: 150, expiry_days: 90 },
            { mid: 'm05', nodes: [nodeAlpha], qty: 100, expiry_days: 20 }, // Critical
            { mid: 'm10', nodes: [nodeAlpha, nodeBeta], qty: 1000, expiry_days: 720 },
            { mid: 'm07', nodes: [nodeAlpha], qty: 20, expiry_days: 30 },
            { mid: 'm09', nodes: [nodeAlpha, nodeBeta], qty: 400, expiry_days: 500 }
        ];

        // Let's generate 40 batches programmatically for density
        for (let i = 0; i < 45; i++) {
            const randomMedicine = skus[i % skus.length];
            const randomNode = i % 3 === 0 ? nodeAlpha : (i % 3 === 1 ? nodeBeta : nodeAlpha); // Mix
            const expiryDays = (i % 5 === 0) ? 20 : (i % 5 === 1 ? 45 : (i % 5 === 2 ? 100 : 400));
            const qty = Math.floor(Math.random() * 500) + 50;
            const batchId = `BATCH-${1000 + i}`;

            await db.query(`
                INSERT INTO inventory_batches (
                    id, medicine_id, village_id, batch_number, expiry_date, 
                    initial_quantity, remaining_quantity, purchase_cost, selling_price
                ) VALUES ($1, $2, $3, $4, date('now', '+${expiryDays} days'), $5, $5, $6, $7)
            `, [uuidv4(), randomMedicine[0], randomNode, batchId, qty, randomMedicine[6], randomMedicine[7]]);

            // Also update the 'inventory' cache table for quick lookups
            await db.query(`
                INSERT INTO inventory (id, medicine_id, village_id, quantity, batch_number, expiry_date)
                VALUES ($1, $2, $3, $4, $5, date('now', '+${expiryDays} days'))
                ON CONFLICT(medicine_id, village_id) DO UPDATE SET 
                    quantity = quantity + EXCLUDED.quantity,
                    updated_at = CURRENT_TIMESTAMP
            `, [uuidv4(), randomMedicine[0], randomNode, qty, batchId]);
        }

        // 5. Seed initial movements
        for (let i = 0; i < 30; i++) {
            const randomMedicine = skus[i % skus.length];
            const randomNode = i % 2 === 0 ? nodeAlpha : nodeBeta;
            await db.query(`
                INSERT INTO stock_movements (
                    id, medicine_id, village_id, movement_type, quantity, reason, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, date('now', '-${i} days'))
            `, [uuidv4(), randomMedicine[0], randomNode, 'PURCHASE', 500, 'Initial Seeding']);
        }

        console.log('[SEED-SUCCESS] Enterprise Inventory Data Population Complete.');
    } catch (err) {
        console.error('[SEED-ERROR]', err);
    }
};

if (require.main === module) {
    seedEnterpriseInventory().then(() => process.exit(0));
}

module.exports = seedEnterpriseInventory;
