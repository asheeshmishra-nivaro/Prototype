const whatsappService = require('../services/whatsappService');

const validateVitals = (req, res, next) => {
    const { vitals, patient_name } = req.body;
    if (!vitals) return next();

    const { temp, spo2, systolic_bp, diastolic_bp, glucose } = vitals;
    const errors = [];

    // Temperature: 90–110°F
    if (temp < 90 || temp > 110) errors.push('Temperature out of range (90-110°F)');

    // SpO2: 70–100%
    if (spo2 < 70 || spo2 > 100) errors.push('SpO2 out of range (70-100%)');

    // Systolic BP: 70–250
    if (systolic_bp < 70 || systolic_bp > 250) errors.push('Systolic BP out of range (70-250)');

    // Diastolic BP: 40–150
    if (diastolic_bp < 40 || diastolic_bp > 150) errors.push('Diastolic BP out of range (40-150)');

    // Glucose: 20–600 mg/dL
    if (glucose && (glucose < 20 || glucose > 600)) errors.push('Glucose out of range (20-600 mg/dL)');

    if (errors.length > 0) {
        // WhatsApp Emergency Alert Trigger
        const isEmergency = spo2 < 90 || systolic_bp > 180 || systolic_bp < 90;
        if (isEmergency) {
            whatsappService.sendEmergencyAlert('+91xxxxxxxxxx', 'doctor', patient_name || 'Rajesh Kumar', `SpO2: ${spo2}%, BP: ${systolic_bp}/${diastolic_bp}`);
        }

        return res.status(400).json({
            error: 'Medical Validation Failed',
            details: errors,
            isEmergency
        });
    }

    next();
};

module.exports = validateVitals;
