const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const inventoryRoutes = require('./routes/inventory');
const consultationRoutes = require('./routes/consultations');
const videoRoutes = require('./routes/video');
const doctorRoutes = require('./routes/doctor');
const adminRoutes = require('./routes/admin');
const whatsappRoutes = require('./routes/whatsapp');

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/doctor', doctorRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: "online",
        system: "Nivaro Production Prototype",
        timestamp: new Date()
    });
});

const cron = require('node-cron');
const whatsappService = require('./services/whatsappService');

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[SYSTEM] Nivaro Backend active on Port ${PORT}`);

        // Start WhatsApp Clinical Automation Scheduler
        cron.schedule('* * * * *', () => {
            console.log('[WA-CRON] Processing scheduled communications...');
            whatsappService.processScheduledMessages();
        });
    });
}

module.exports = app;
