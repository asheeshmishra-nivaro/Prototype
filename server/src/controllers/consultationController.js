const { firestore: db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { logAction } = require('../services/auditService');
const whatsappService = require('../services/whatsappService');
const pdfService = require('../services/pdfService');

const startConsultation = async (req, res) => {
    try {
        const { patient_id, vitals, village_id, fee, doctor_id } = req.body;
        const operator_id = req.user.id;
        const id = uuidv4();

        const consultation = {
            id,
            patient_id,
            operator_id,
            doctor_id,
            village_id,
            vitals,
            status: 'pending', // Reverted to pending for queue visibility
            fee: fee || 50,
            created_at: new Date(),
            start_time: new Date()
        };

        await db.collection('consultations').doc(id).set(consultation);

        // Notify Doctor via WhatsApp (Mocked)
        whatsappService.sendMessage('+91xxxxxxxxxx', `New Consultation Assigned: ${id}. Please join the channel.`);

        logAction(operator_id, req.user.role, 'START_CONSULTATION', 'consultations', id, null, consultation);
        res.status(201).json(consultation);
    } catch (err) {
        console.error('[FIREBASE-ERROR] startConsultation:', err);
        res.status(500).json({ error: 'Failed to start consultation' });
    }
};

const savePrescription = async (req, res) => {
    try {
        const { consultation_id, patient_id, medicines, instructions, doctor_info } = req.body;
        const doctor_id = req.user.id;

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rxShortId = Math.floor(1000 + Math.random() * 9000);
        const prescription_id = `NV-${dateStr}-${rxShortId}`;
        const id = uuidv4();

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

        await db.collection('prescriptions').doc(id).set(prescription);

        // Update consultation status
        await db.collection('consultations').doc(consultation_id).update({
            status: 'rx_written',
            end_time: new Date()
        });

        // Inventory FIFO Dispensing logic
        const patientDoc = await db.collection('patients').doc(patient_id).get();
        const village_id = patientDoc.exists ? patientDoc.data().village_id : 'Alpha';

        for (const med of medicines) {
            let unitsToDispense = (med.duration_days || 1) * (
                (med.morning?.enabled ? 1 : 0) +
                (med.afternoon?.enabled ? 1 : 0) +
                (med.evening?.enabled ? 1 : 0) +
                (med.night?.enabled ? 1 : 0)
            );

            if (unitsToDispense <= 0) continue;

            const medsSnapshot = await db.collection('medicines').where('sku_id', '==', med.sku).limit(1).get();
            if (medsSnapshot.empty) continue;
            const medInternalId = medsSnapshot.docs[0].id;

            const batchesSnapshot = await db.collection('inventory_batches')
                .where('medicine_id', '==', medInternalId)
                .where('village_id', '==', village_id)
                .orderBy('expiry_date', 'asc')
                .get();

            for (const batchDoc of batchesSnapshot.docs) {
                if (unitsToDispense <= 0) break;
                const data = batchDoc.data();
                const available = data.remaining_quantity || 0;
                const toTake = Math.min(available, unitsToDispense);

                if (toTake > 0) {
                    await batchDoc.ref.update({ remaining_quantity: available - toTake });
                    const moveId = uuidv4();
                    await db.collection('stock_movements').doc(moveId).set({
                        id: moveId, medicine_id: medInternalId, batch_id: batchDoc.id, village_id, movement_type: 'DISPENSING', quantity: -toTake, linked_entity_id: prescription_id, user_id: doctor_id, reason: 'Rx Finalized', timestamp: new Date()
                    });
                    unitsToDispense -= toTake;
                }
            }
        }

        const pdfUrl = await pdfService.generatePrescriptionPDF(prescription);
        logAction(doctor_id, req.user.role, 'WRITE_PRESCRIPTION', 'prescriptions', id, null, prescription);

        res.status(201).json(prescription);
    } catch (err) {
        console.error('[FIREBASE-ERROR] savePrescription:', err);
        res.status(500).json({ error: 'Failed to save prescription' });
    }
};

const getDoctorQueue = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const snapshot = await db.collection('consultations')
            .where('doctor_id', '==', doctor_id)
            .where('status', '==', 'pending')
            .get();

        const queue = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const patientDoc = await db.collection('patients').doc(data.patient_id).get();
            const patientData = patientDoc.data() || {};

            // Calculate Priority Level
            const vitals = data.vitals || {};
            let priorityLevel = 3;
            if (Number(vitals.spo2) < 90) priorityLevel = 1;
            else if (Number(vitals.bp_systolic) >= 140 || Number(vitals.bp_diastolic) >= 90) priorityLevel = 2;

            queue.push({
                id: doc.id,
                patient_name: patientData.name || 'Unknown',
                age: patientData.age,
                gender: patientData.gender,
                village_id: patientData.village_id,
                village_name: patientData.village_name || 'Village',
                vitals,
                created_at: data.created_at,
                priority_level: priorityLevel
            });
        }

        // Sort by priority and time
        queue.sort((a, b) => {
            if (a.priority_level !== b.priority_level) return a.priority_level - b.priority_level;
            return a.created_at - b.created_at;
        });

        res.json(queue);
    } catch (err) {
        console.error('[FIREBASE-ERROR] getDoctorQueue:', err);
        res.status(500).json({ error: 'Queue retrieval failed' });
    }
};

module.exports = {
    startConsultation,
    savePrescription,
    getDoctorQueue
};
