const { v4: uuidv4 } = require('uuid');
const { logAction } = require('../services/auditService');
const whatsappService = require('../services/whatsappService');
const db = require('../db');

// SQLite database is now used for all operations

const startConsultation = async (req, res) => {
    try {
        const { patient_id, vitals, village_id, fee, doctor_id } = req.body;
        const operator_id = req.user.id;
        const id = uuidv4();

        await db.query(`
            INSERT INTO consultations (id, patient_id, operator_id, doctor_id, vitals, status, fee, start_time)
            VALUES ($1, $2, $3, $4, $5, 'in_progress', $6, CURRENT_TIMESTAMP)
        `, [id, patient_id, operator_id, doctor_id, JSON.stringify(vitals), fee || 50]);

        const consultation = { id, patient_id, operator_id, doctor_id, village_id, vitals, status: 'in_progress', fee };

        // Notify Doctor via WhatsApp
        whatsappService.sendMessage('+91xxxxxxxxxx', `New Consultation Assigned: ${id}. Please join the channel.`);

        logAction(operator_id, req.user.role, 'START_CONSULTATION', 'consultations', id, null, consultation);

        res.status(201).json(consultation);
    } catch (err) {
        console.error('[DB-ERROR] startConsultation:', err.message);
        res.status(500).json({ error: 'Failed to start consultation' });
    }
};

const pdfService = require('../services/pdfService');

const savePrescription = async (req, res) => {
    try {
        const { consultation_id, patient_id, medicines, instructions, doctor_info } = req.body;
        const doctor_id = req.user.id;

        // Generating a unique, legally valid Prescription ID
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rxShortId = Math.floor(1000 + Math.random() * 9000);
        const prescription_id = `NV-${dateStr}-${rxShortId}`;
        const id = uuidv4();

        await db.query(`
            INSERT INTO prescriptions (id, consultation_id, prescription_id, doctor_id, patient_id, medicines, instructions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [id, consultation_id, prescription_id, doctor_id, patient_id, JSON.stringify(medicines), instructions]);

        // Update consultation status
        await db.query(`
            UPDATE consultations 
            SET status = 'rx_written', end_time = CURRENT_TIMESTAMP 
            WHERE id = $1
        `, [consultation_id]);

        const prescription = {
            id,
            prescription_id,
            consultation_id,
            patient_id,
            doctor_id,
            doctor_name: req.user.name,
            doctor_license: doctor_info.license_number,
            medicines,
            instructions,
            timestamp: new Date()
        };

        logAction(doctor_id, req.user.role, 'WRITE_PRESCRIPTION', 'prescriptions', id, null, prescription);

        // FIFO Dispensing Engine
        const patientDataResult = await db.query("SELECT village_id, name, phone FROM patients WHERE id = $1", [patient_id]);
        const patient = patientDataResult.rows[0];
        const village_id = patient.village_id;

        for (const med of medicines) {
            // Calculate total units to dispense
            const morning = med.morning?.enabled ? 1 : 0;
            const afternoon = med.afternoon?.enabled ? 1 : 0;
            const evening = med.evening?.enabled ? 1 : 0;
            const night = med.night?.enabled ? 1 : 0;
            const dailyDose = morning + afternoon + evening + night;
            let unitsToDispense = dailyDose * (med.duration_days || 1);

            if (unitsToDispense <= 0) continue;

            // Fetch batches for this medicine at this village, sorted by expiry
            const batches = await db.query(`
                SELECT id, remaining_quantity, batch_number 
                FROM inventory_batches 
                WHERE medicine_id = (SELECT id FROM medicines WHERE sku_id = $1)
                  AND village_id = $2
                  AND remaining_quantity > 0
                ORDER BY expiry_date ASC
            `, [med.sku, village_id]);

            for (const batch of batches.rows) {
                if (unitsToDispense <= 0) break;

                const deductAmount = Math.min(batch.remaining_quantity, unitsToDispense);

                // Update batch
                await db.query(`
                    UPDATE inventory_batches 
                    SET remaining_quantity = remaining_quantity - $1 
                    WHERE id = $2
                `, [deductAmount, batch.id]);

                // Log movement
                await db.query(`
                    INSERT INTO stock_movements (id, medicine_id, batch_id, village_id, movement_type, quantity, linked_entity_id, user_id, reason)
                    VALUES ($1, (SELECT id FROM medicines WHERE sku_id = $2), $3, $4, 'DISPENSING', $5, $6, $7, $8)
                `, [uuidv4(), med.sku, batch.id, village_id, -deductAmount, prescription_id, doctor_id, 'Prescription Finalized']);

                unitsToDispense -= deductAmount;
            }

            if (unitsToDispense > 0) {
                console.warn(`[STOCK-WARN] Under-dispensed ${med.name}: ${unitsToDispense} units missing in Village ${village_id}`);
            }
        }

        // Generate PDF matching Preview
        const pdfUrl = await pdfService.generatePrescriptionPDF(prescription);

        // Automated WhatsApp Delivery to Patient
        whatsappService.sendPrescription(patient.phone || '+91xxxxxxxxxx', patient.name, prescription_id, pdfUrl);

        res.status(201).json(prescription);
    } catch (err) {
        console.error('[DB-ERROR] savePrescription:', err.message);
        res.status(500).json({ error: 'Failed to save prescription' });
    }
};

const getDoctorQueue = async (req, res) => {
    try {
        const doctor_id = req.user.id;

        // Priority logic:
        // 1. Critical SpO2 (< 90)
        // 2. High BP (Sys >= 140 or Dia >= 90)
        // 3. Normal Pending
        // Sorted by priority then by wait time (created_at)

        const result = await db.query(`
            SELECT 
                c.id, 
                p.name as patient_name, 
                p.age, 
                p.gender,
                p.village_id,
                v.name as village_name,
                c.vitals,
                c.created_at,
                CASE 
                    WHEN CAST(json_extract(c.vitals, '$.spo2') AS numeric) < 90 THEN 1
                    WHEN CAST(json_extract(c.vitals, '$.bp_systolic') AS numeric) >= 140 OR CAST(json_extract(c.vitals, '$.bp_diastolic') AS numeric) >= 90 THEN 2
                    ELSE 3
                END as priority_level
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            JOIN villages v ON p.village_id = v.id
            WHERE c.doctor_id = $1 AND c.status = 'pending'
            ORDER BY priority_level ASC, c.created_at ASC
        `, [doctor_id]);

        res.json(result.rows);
    } catch (err) {
        console.error('[DB-ERROR] getDoctorQueue:', err);
        res.status(500).json({ error: 'Queue retrieval failed' });
    }
};

module.exports = {
    startConsultation,
    savePrescription,
    getDoctorQueue
};
