const { v4: uuidv4 } = require('uuid');

// Mock database for prototype (In production, use PostgreSQL)
let patients = [];

const registerPatient = async (req, res) => {
    try {
        const { name, age, gender, phone, address, medicalHistory } = req.body;

        const newPatient = {
            id: uuidv4(),
            name,
            age,
            gender,
            phone,
            address,
            medicalHistory,
            visits: [],
            createdAt: new Date()
        };

        patients.push(newPatient);
        res.status(201).json(newPatient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchPatientByPhone = async (req, res) => {
    const { phone } = req.params;
    const patient = patients.find(p => p.phone === phone);

    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
};

const getPatientHistory = async (req, res) => {
    const { id } = req.params;
    const patient = patients.find(p => p.id === id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient.visits);
}

module.exports = {
    registerPatient,
    searchPatientByPhone,
    getPatientHistory
};
