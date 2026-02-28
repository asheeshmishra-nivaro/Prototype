const { firestore: db } = require('../db');
const { v4: uuidv4 } = require('uuid');

const registerPatient = async (req, res) => {
    try {
        const { name, age, gender, phone, address, medicalHistory } = req.body;
        const patientId = uuidv4();

        const newPatient = {
            id: patientId,
            name,
            age,
            gender,
            phone,
            address,
            medicalHistory,
            createdAt: new Date(),
            village_id: req.body.village_id || null
        };

        await db.collection('patients').doc(patientId).set(newPatient);
        res.status(201).json(newPatient);
    } catch (error) {
        console.error('[PATIENT-ERROR] Registration failed:', error);
        res.status(500).json({ error: error.message });
    }
};

const searchPatientByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const snapshot = await db.collection('patients').where('phone', '==', phone).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const doc = snapshot.docs[0];
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('[PATIENT-ERROR] Search failed:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await db.collection('consultations')
            .where('patient_id', '==', id)
            .orderBy('created_at', 'desc')
            .get();

        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(history);
    } catch (error) {
        console.error('[PATIENT-ERROR] History fetch failed:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    registerPatient,
    searchPatientByPhone,
    getPatientHistory
};
