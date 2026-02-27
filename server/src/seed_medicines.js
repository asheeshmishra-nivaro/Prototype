const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const seedMedicines = async () => {
    const medicines = [
        ['Paracetamol', 'Acetaminophen', '500mg', 'Tablet', 'SKU001', 2.0, 5.0],
        ['Amoxicillin', 'Amoxicillin', '250mg', 'Capsule', 'SKU002', 15.0, 25.0],
        ['Metformin', 'Metformin Hydrochloride', '500mg', 'Tablet', 'SKU003', 10.0, 18.0],
        ['Atorvastatin', 'Atorvastatin Calcium', '10mg', 'Tablet', 'SKU004', 12.0, 22.0],
        ['Amlodipine', 'Amlodipine Besylate', '5mg', 'Tablet', 'SKU005', 5.0, 10.0],
        ['Omeprazole', 'Omeprazole', '20mg', 'Capsule', 'SKU006', 8.0, 15.0],
        ['Azithromycin', 'Azithromycin', '500mg', 'Tablet', 'SKU007', 30.0, 55.0],
        ['Ibuprofen', 'Ibuprofen', '400mg', 'Tablet', 'SKU008', 3.0, 7.0],
        ['Cetirizine', 'Cetirizine Hydrochloride', '10mg', 'Tablet', 'SKU009', 2.0, 5.0],
        ['Ciprofloxacin', 'Ciprofloxacin', '500mg', 'Tablet', 'SKU010', 25.0, 45.0]
    ];

    try {
        console.log('[SEED] Clearing existing medicines...');
        await db.query('DELETE FROM medicines');

        console.log('[SEED] Inserting new medicines...');
        for (const med of medicines) {
            const id = uuidv4();
            await db.query(
                'INSERT INTO medicines (id, name, generic_name, strength, form, sku_id, purchase_cost, selling_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [id, ...med]
            );
        }
        console.log('[SEED] Done! 10 medicines inserted.');
        process.exit(0);
    } catch (err) {
        console.error('[SEED-ERROR]', err.message);
        process.exit(1);
    }
};

seedMedicines();
