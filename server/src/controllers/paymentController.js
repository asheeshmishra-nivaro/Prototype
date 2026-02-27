const { logAction } = require('../services/auditService');

let payments = [];

const logPayment = async (req, res) => {
    const { prescriptionId, consultationId, amount, type } = req.body;
    const operatorId = req.user.id;

    const commission = amount * 0.1; // 10% commission for operator

    const payment = {
        id: Date.now().toString(),
        prescriptionId,
        consultationId,
        amount,
        type, // 'consultation' or 'medicine'
        status: 'paid',
        commissionAmount: commission,
        operatorId,
        timestamp: new Date()
    };

    payments.push(payment);
    logAction(operatorId, 'LOG_PAYMENT', 'payments', payment.id, null, payment);

    res.status(201).json(payment);
};

const getRevenueReport = async (req, res) => {
    // Admin only aggregation
    const report = payments.reduce((acc, p) => {
        acc.totalRevenue += parseFloat(p.amount);
        acc.totalCommission += p.commissionAmount;
        return acc;
    }, { totalRevenue: 0, totalCommission: 0 });

    res.json(report);
};

module.exports = {
    logPayment,
    getRevenueReport
};
