const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../nivaro.db');
const db = new sqlite3.Database(dbPath);

const schema = `
-- Template Management
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- Reminder, Alert, Utility, Emergency
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation Rules
CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
    id TEXT PRIMARY KEY,
    trigger_event TEXT NOT NULL, -- prescription_created, high_bp_detected, etc.
    delay_days INT DEFAULT 0,
    template_id TEXT REFERENCES whatsapp_templates(id),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consent Tracking
CREATE TABLE IF NOT EXISTS whatsapp_consent (
    patient_id TEXT PRIMARY KEY REFERENCES patients(id),
    consent_status TEXT NOT NULL, -- opted_in, opted_out
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Message Delivery Logs
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id TEXT PRIMARY KEY,
    message_id TEXT, -- Meta/Twilio message ID
    patient_id TEXT REFERENCES patients(id),
    to_number TEXT NOT NULL,
    content TEXT NOT NULL,
    template_id TEXT REFERENCES whatsapp_templates(id),
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATETIME,
    read_at DATETIME,
    failed_reason TEXT,
    status TEXT DEFAULT 'sent' -- sent, delivered, read, failed
);

-- Webhook Debug Logs
CREATE TABLE IF NOT EXISTS whatsapp_webhook_logs (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    signature_verified BOOLEAN,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_log TEXT
);

-- Scheduled Messages (for Cron)
CREATE TABLE IF NOT EXISTS whatsapp_scheduled_messages (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id),
    template_id TEXT REFERENCES whatsapp_templates(id),
    scheduled_time DATETIME NOT NULL,
    status TEXT DEFAULT 'scheduled' -- scheduled, sent, cancelled, failed
);

-- Message History (Granular for Analytics)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id),
    message_type TEXT NOT NULL, -- Appointment, Follow-up, Prescription, Emergency, Broadcast
    status TEXT NOT NULL, -- sent, delivered, read, failed
    is_emergency BOOLEAN DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    node_id TEXT,
    doctor_id TEXT,
    campaign_id TEXT REFERENCES whatsapp_campaigns(id)
);

-- Broadcast Campaigns
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template_id TEXT REFERENCES whatsapp_templates(id),
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.serialize(() => {
    db.exec(schema, (err) => {
        if (err) {
            console.error('[MIGRATION-ERROR] Failed to apply WhatsApp schema:', err.message);
        } else {
            console.log('[MIGRATION-SUCCESS] WhatsApp Hub schema applied.');
        }
    });
});

db.close();
