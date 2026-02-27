const db = require('./db');

async function testSearch(q) {
    console.log(`Testing search for: "${q}"`);
    try {
        const query = `
            SELECT id, name, sku_id as sku, strength, form, generic_name
            FROM medicines
            WHERE (name ILIKE $1 OR sku_id ILIKE $1 OR generic_name ILIKE $1 OR strength ILIKE $1)
            LIMIT 10
        `;
        const { rows } = await db.query(query, [`%${q}%`]);
        console.log(`Results found: ${rows.length}`);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error('Error during search test:', err.message);
    } finally {
        process.exit();
    }
}

testSearch(process.argv[2] || 'Paracetamol');
