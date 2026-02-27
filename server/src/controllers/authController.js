const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Production-ready mock data
const users = [
    {
        id: 'admin-001',
        name: 'Nivaro Admin',
        email: 'admin@nivaro.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin'
    },
    {
        id: 'doc-101',
        name: 'Dr. Amartya Sen',
        email: 'doctor@nivaro.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'doctor',
        license_number: 'MC-2026-9921',
        medical_degree: 'MD, General Medicine',
        specialization: 'Internal Medicine',
        experience_years: 12,
        hospital_affiliation: 'City General Hospital',
        profile_photo_url: 'https://ui-avatars.com/api/?name=Amartya+Sen&background=0D8ABC&color=fff',
        rating: 4.8,
        total_consultations: 1240,
        responseTime: '~5 mins',
        status: 'online'
    },
    {
        id: 'op-201',
        name: 'Village Operator John',
        email: 'operator@nivaro.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'operator',
        village_id: 'v1',
        assigned_village_name: 'Village Alpha'
    }
];

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Authentication failed. Invalid email or password.' });
    }

    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
            role: user.role,
            village_id: user.village_id || null
        },
        process.env.JWT_SECRET || 'nivaro_production_secret_2026',
        { expiresIn: '12h' }
    );

    // Strip password hash before sending
    const { passwordHash, ...safeUser } = user;
    res.json({ token, user: safeUser });
};

const getDoctors = async (req, res) => {
    // Return all users with 'doctor' role, stripping sensitive data
    const doctors = users
        .filter(u => u.role === 'doctor')
        .map(({ passwordHash, ...doc }) => doc);
    res.json(doctors);
};

module.exports = { login, getDoctors, users };
