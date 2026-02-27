const db = require('../db');

const getDashboardSummary = async (req, res) => {
    try {
        const { period } = req.query;
        console.log(`[ADMIN] Dashboard Summary Request - Period: ${period}`);

        // Using datetime('now', ...) to ensure precise comparison with ISO strings
        let timeFilter = "timestamp >= datetime('now', '-90 days')";
        let prevTimeFilter = "timestamp >= datetime('now', '-180 days') AND timestamp < datetime('now', '-90 days')";

        if (period === 'today') {
            timeFilter = "timestamp >= datetime('now', 'start of day')";
            prevTimeFilter = "timestamp >= datetime('now', '-1 day', 'start of day') AND timestamp < datetime('now', 'start of day')";
        } else if (period === 'week') {
            timeFilter = "timestamp >= datetime('now', '-7 days')";
            prevTimeFilter = "timestamp >= datetime('now', '-14 days') AND timestamp < datetime('now', '-7 days')";
        }

        // 1. Current Period Metrics
        const currentRes = await db.query(`
            SELECT 
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) IN ('consultation', 'medicine_sale') THEN amount ELSE 0 END) as revenue,
                SUM(margin) as margin,
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) = 'consultation' THEN amount ELSE 0 END) as consult_rev,
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) = 'medicine_sale' THEN amount ELSE 0 END) as medicine_rev,
                SUM(CASE WHEN LOWER(TRIM(transaction_type)) = 'inventory_purchase' THEN amount ELSE 0 END) as inventory_cost
            FROM financial_transactions 
            WHERE ${timeFilter}
        `);

        // 2. Previous Period (for Growth)
        const prevRes = await db.query(`
            SELECT SUM(CASE WHEN LOWER(TRIM(transaction_type)) IN ('consultation', 'medicine_sale') THEN amount ELSE 0 END) as revenue
            FROM financial_transactions 
            WHERE ${prevTimeFilter}
        `);

        const current = currentRes.rows[0];
        const prevRevenue = prevRes.rows[0].revenue || 0;
        const growth = prevRevenue === 0 ? (current.revenue > 0 ? 100 : 0) : ((current.revenue - prevRevenue) / prevRevenue) * 100;

        // 3. Trend Data
        const trendRes = await db.query(`
            SELECT date(timestamp) as date, SUM(amount) as value
            FROM financial_transactions
            WHERE LOWER(TRIM(transaction_type)) IN ('consultation', 'medicine_sale')
            AND ${timeFilter}
            GROUP BY date(timestamp)
            ORDER BY date(timestamp) ASC
        `);

        // 4. Node Distribution
        const nodeRes = await db.query(`
            SELECT 
                CASE WHEN LOWER(TRIM(node_id)) = 'alpha' THEN 'Village Alpha'
                     WHEN LOWER(TRIM(node_id)) = 'beta' THEN 'Village Beta'
                     WHEN LOWER(TRIM(node_id)) = 'gamma' THEN 'Village Gamma'
                     ELSE node_id END as name,
                SUM(amount) as revenue
            FROM financial_transactions
            WHERE LOWER(TRIM(transaction_type)) IN ('consultation', 'medicine_sale')
            AND ${timeFilter}
            GROUP BY node_id
            ORDER BY revenue DESC
        `);

        res.json({
            revenue: {
                total: current.revenue || 0,
                growth: (growth > 0 ? '+' : '') + growth.toFixed(1) + '%',
                trend: trendRes.rows.map(r => r.value)
            },
            netMargin: {
                total: current.margin || 0,
                percent: ((current.margin / (current.revenue || 1)) * 100).toFixed(1) + '%'
            },
            breakdown: {
                consultations: current.consult_rev || 0,
                medicines: current.medicine_rev || 0,
                inventoryCost: current.inventory_cost || 0,
                operatingCost: (current.revenue || 0) * 0.15
            },
            nodePerformance: nodeRes.rows,
            inventoryValue: 965610,
            activeConsultations: 4,
            integrityScore: 98
        });
    } catch (err) {
        console.error('[ADMIN-ERROR] getDashboardSummary:', err);
        res.status(500).json({ error: 'Failed to fetch admin dashboard summary' });
    }
};

const getInventoryControl = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM medicines) as total_skus,
                (SELECT SUM(remaining_quantity) FROM inventory_batches) as total_units,
                (SELECT COUNT(*) FROM inventory_batches WHERE expiry_date <= date('now', '+30 days')) as expiring_soon
        `);

        const lowStock = await db.query(`
            SELECT m.name, SUM(b.remaining_quantity) as total 
            FROM medicines m
            JOIN inventory_batches b ON m.id = b.medicine_id
            GROUP BY m.id
            HAVING total < m.low_stock_threshold
        `);

        const movements = await db.query(`
            SELECT sm.*, m.name as medicine_name, v.name as village_name, u.name as user_name
            FROM stock_movements sm
            JOIN medicines m ON sm.medicine_id = m.id
            JOIN villages v ON sm.village_id = v.id
            LEFT JOIN users u ON sm.user_id = u.id
            ORDER BY sm.timestamp DESC
            LIMIT 10
        `);

        res.json({
            overview: stats.rows[0],
            lowStock: lowStock.rows,
            recentMovements: movements.rows
        });
    } catch (err) {
        console.error('[ADMIN-ERROR] getInventoryControl:', err);
        res.status(500).json({ error: 'Failed to fetch inventory control data' });
    }
};

const getAuditFeed = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20");
        res.json(result.rows);
    } catch (err) {
        console.error('[ADMIN-ERROR] getAuditFeed:', err);
        res.status(500).json({ error: 'Failed to fetch audit feed' });
    }
};

const resetDemo = async (req, res) => {
    try {
        const { seedDemoData } = require('../../scripts/seedDemoData');
        const success = await seedDemoData();
        if (success) {
            res.json({ message: 'Demo data reset successfully' });
        } else {
            res.status(500).json({ error: 'Reseed logic failed' });
        }
    } catch (err) {
        console.error('[ADMIN-ERROR] resetDemo:', err);
        res.status(500).json({ error: 'Failed to reset demo data' });
    }
};

module.exports = {
    getDashboardSummary,
    getInventoryControl,
    getAuditFeed,
    resetDemo
};
