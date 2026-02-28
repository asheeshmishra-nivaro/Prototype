const { firestore: db } = require('../db');
const { logAction } = require('../services/auditService');

const logPayment = async (req, res) => {
    try {
        const { prescriptionId, consultationId, amount, type } = req.body;
        const operatorId = req.user.id;
        const commission = Number(amount) * 0.1;

        const payment = {
            id: Date.now().toString(),
            prescriptionId: prescriptionId || null,
            consultationId: consultationId || null,
            amount: Number(amount),
            type, // 'consultation' or 'medicine'
            status: 'paid',
            commissionAmount: commission,
            operatorId,
            timestamp: new Date(),
            transaction_type: type === 'consultation' ? 'consultation' : 'medicine_sale'
        };

        const paymentDoc = db.collection('payments').doc(payment.id);
        await paymentDoc.set(payment);

        // Also log to financial_transactions for the admin dashboard
        await db.collection('financial_transactions').doc(payment.id).set({
            ...payment,
            node_id: req.user.village_id || 'Alpha' // Default node for prototype
        });

        logAction(operatorId, 'LOG_PAYMENT', 'payments', payment.id, null, payment);
        res.status(201).json(payment);
    } catch (error) {
        console.error('[PAYMENT-ERROR] Logging failed:', error);
        res.status(500).json({ error: error.message });
    }
};

const getRevenueReport = async (req, res) => {
    try {
        const snapshot = await db.collection('payments').get();
        const report = { totalRevenue: 0, totalCommission: 0 };

        snapshot.forEach(doc => {
            const data = doc.data();
            report.totalRevenue += Number(data.amount) || 0;
            report.totalCommission += Number(data.commissionAmount) || 0;
        });

        res.json(report);
    } catch (error) {
        console.error('[PAYMENT-ERROR] Report failed:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    logPayment,
    getRevenueReport
};
