const { firestore: db } = require('../db');

const getDashboardSummary = async (req, res) => {
    try {
        const { period } = req.query;
        console.log(`[ADMIN] Firestore Dashboard Summary - Period: ${period}`);

        // Firestore date filtering is best done with Timestamps
        const now = new Date();
        let startDate = new Date();
        startDate.setDate(now.getDate() - 90); // Default 90 days

        if (period === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        }

        const snapshot = await db.collection('financial_transactions')
            .where('timestamp', '>=', startDate)
            .get();

        let revenue = 0, margin = 0, consult_rev = 0, medicine_rev = 0, inventory_cost = 0;
        const trendMap = {};
        const nodeMap = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const type = (data.transaction_type || '').toLowerCase().trim();
            const amount = Number(data.amount) || 0;
            const m = Number(data.margin) || 0;
            const dateStr = data.timestamp.toDate ? data.timestamp.toDate().toISOString().split('T')[0] : data.timestamp.split('T')[0];

            if (['consultation', 'medicine_sale'].includes(type)) {
                revenue += amount;
                margin += m;
                if (type === 'consultation') consult_rev += amount;
                if (type === 'medicine_sale') medicine_rev += amount;

                trendMap[dateStr] = (trendMap[dateStr] || 0) + amount;

                const nodeId = data.node_id || 'Unknown';
                nodeMap[nodeId] = (nodeMap[nodeId] || 0) + amount;
            } else if (type === 'inventory_purchase') {
                inventory_cost += amount;
            }
        });

        // Mock growth for now as previous period fetching is expensive in Firestore without indexes
        const growth = "+12.5%";

        res.json({
            revenue: {
                total: revenue,
                growth,
                trend: Object.values(trendMap)
            },
            netMargin: {
                total: margin,
                percent: ((margin / (revenue || 1)) * 100).toFixed(1) + '%'
            },
            breakdown: {
                consultations: consult_rev,
                medicines: medicine_rev,
                inventoryCost: inventory_cost,
                operatingCost: revenue * 0.15
            },
            nodePerformance: Object.entries(nodeMap).map(([name, rev]) => ({ name, revenue: rev })),
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
        const medsCount = (await db.collection('medicines').count().get()).data().count;
        const batches = await db.collection('inventory_batches').get();

        let totalUnits = 0;
        let expiringSoon = 0;
        const lowStock = [];

        batches.forEach(doc => {
            const data = doc.data();
            totalUnits += (data.remaining_quantity || 0);
            const exp = data.expiry_date.toDate ? data.expiry_date.toDate() : new Date(data.expiry_date);
            const thirtyDays = new Date();
            thirtyDays.setDate(thirtyDays.getDate() + 30);
            if (exp <= thirtyDays) expiringSoon++;
        });

        const movements = await db.collection('stock_movements')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        res.json({
            overview: {
                total_skus: medsCount,
                total_units: totalUnits,
                expiring_soon: expiringSoon
            },
            lowStock: [], // Needs join logic or pre-aggregated data
            recentMovements: movements.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
    } catch (err) {
        console.error('[ADMIN-ERROR] getInventoryControl:', err);
        res.status(500).json({ error: 'Failed to fetch inventory control data' });
    }
};

const getAuditFeed = async (req, res) => {
    try {
        const snapshot = await db.collection('audit_logs')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
        console.error('[ADMIN-ERROR] getAuditFeed:', err);
        res.status(500).json({ error: 'Failed to fetch audit feed' });
    }
};

const resetDemo = async (req, res) => {
    res.status(501).json({ error: 'Reset demo not yet implemented for Firestore' });
};

module.exports = {
    getDashboardSummary,
    getInventoryControl,
    getAuditFeed,
    resetDemo
};
