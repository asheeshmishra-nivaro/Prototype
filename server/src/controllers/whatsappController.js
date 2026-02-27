const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const whatsappService = require('../services/whatsappService');

// 1. Template Management
const getTemplates = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM whatsapp_templates ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error('[WA-ERROR] getTemplates:', err);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

const createTemplate = async (req, res) => {
    try {
        const { name, content, category } = req.body;
        const id = uuidv4();
        await db.query(
            "INSERT INTO whatsapp_templates (id, name, content, category, status) VALUES ($1, $2, $3, $4, 'approved')",
            [id, name, content, category]
        );
        res.status(201).json({ id, name, content, category, status: 'approved' });
    } catch (err) {
        console.error('[WA-ERROR] createTemplate:', err);
        res.status(500).json({ error: 'Failed to create template' });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM whatsapp_templates WHERE id = $1", [id]);
        res.json({ message: 'Template deleted' });
    } catch (err) {
        console.error('[WA-ERROR] deleteTemplate:', err);
        res.status(500).json({ error: 'Failed to delete template' });
    }
};

// 2. Consent Management
const updateConsent = async (req, res) => {
    try {
        const { patient_id, status } = req.body;
        // status: opted_in, opted_out
        await db.query(
            "INSERT INTO whatsapp_consent (patient_id, consent_status, timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT(patient_id) DO UPDATE SET consent_status = $2, timestamp = CURRENT_TIMESTAMP",
            [patient_id, status]
        );
        res.json({ message: 'Consent updated' });
    } catch (err) {
        console.error('[WA-ERROR] updateConsent:', err);
        res.status(500).json({ error: 'Failed to update consent' });
    }
};

const getConsent = async (req, res) => {
    try {
        const { patient_id } = req.params;
        const result = await db.query("SELECT * FROM whatsapp_consent WHERE patient_id = $1", [patient_id]);
        res.json(result.rows[0] || { consent_status: 'unknown' });
    } catch (err) {
        console.error('[WA-ERROR] getConsent:', err);
        res.status(500).json({ error: 'Failed to fetch consent' });
    }
};

// 3. Analytics
const getAnalytics = async (req, res) => {
    try {
        const { filter = 'today' } = req.query;
        let timeClause = "timestamp >= datetime('now', '-24 hours')"; // Default to last 24h for 'today' to be safe
        if (filter === 'week') timeClause = "timestamp >= datetime('now', '-7 days')";
        if (filter === 'month') timeClause = "timestamp >= datetime('now', '-30 days')";

        // 1. Summary Metrics
        const summary = await db.query(`
            SELECT 
                COUNT(*) as total_sent,
                SUM(CASE WHEN status != 'failed' THEN 1 ELSE 0 END) as total_delivered,
                SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as total_read,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed,
                SUM(CASE WHEN is_emergency = 1 THEN 1 ELSE 0 END) as emergency_count
            FROM whatsapp_messages WHERE ${timeClause}
        `);

        // 2. Category Breakdown
        const categories = await db.query(`
            SELECT message_type as name, COUNT(*) as count 
            FROM whatsapp_messages WHERE ${timeClause}
            GROUP BY message_type
        `);

        // 3. Engagement Graph (Last 7 Days)
        const engagement = await db.query(`
            SELECT 
                date(timestamp) as date,
                COUNT(*) as sent,
                SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read
            FROM whatsapp_messages 
            WHERE timestamp >= date('now', '-7 days')
            GROUP BY date(timestamp)
            ORDER BY date ASC
        `);

        // Calculate engagement percentage (overall)
        const totalRead = summary.rows[0].total_read || 0;
        const totalDelivered = summary.rows[0].total_delivered || 0;
        const engagementRate = totalDelivered > 0 ? ((totalRead / totalDelivered) * 100).toFixed(1) : 0;

        res.json({
            summary: summary.rows[0],
            categories: categories.rows,
            engagement: engagement.rows,
            engagementRate
        });
    } catch (err) {
        console.error('[WA-ERROR] getAnalytics:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

const getEmergencyLogs = async (req, res) => {
    try {
        const logs = await db.query(`
            SELECT m.*, p.name as patient_name 
            FROM whatsapp_messages m
            LEFT JOIN patients p ON m.patient_id = p.id
            WHERE is_emergency = 1
            ORDER BY timestamp DESC
            LIMIT 10
        `);
        res.json(logs.rows);
    } catch (err) {
        console.error('[WA-ERROR] getEmergencyLogs:', err);
        res.status(500).json({ error: 'Failed to fetch emergency logs' });
    }
};

const getBroadcastCampaigns = async (req, res) => {
    try {
        const campaigns = await db.query("SELECT * FROM whatsapp_campaigns ORDER BY created_at DESC");
        res.json(campaigns.rows);
    } catch (err) {
        console.error('[WA-ERROR] getBroadcastCampaigns:', err);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
};

// 4. Automation Rules
const getAutomationRules = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, t.name as template_name 
            FROM whatsapp_automation_rules r
            LEFT JOIN whatsapp_templates t ON r.template_id = t.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('[WA-ERROR] getAutomationRules:', err);
        res.status(500).json({ error: 'Failed to fetch automation rules' });
    }
};

const updateAutomationRule = async (req, res) => {
    try {
        const { id, is_active } = req.body;
        await db.query("UPDATE whatsapp_automation_rules SET is_active = $1 WHERE id = $2", [is_active ? 1 : 0, id]);
        res.json({ message: 'Rule updated' });
    } catch (err) {
        console.error('[WA-ERROR] updateAutomationRule:', err);
        res.status(500).json({ error: 'Failed to update rule' });
    }
};

const getWebhookLogs = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM whatsapp_webhook_logs ORDER BY processed_at DESC LIMIT 50");
        res.json(result.rows);
    } catch (err) {
        console.error('[WA-ERROR] getWebhookLogs:', err);
        res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
};

module.exports = {
    getTemplates,
    createTemplate,
    deleteTemplate,
    updateConsent,
    getConsent,
    getAnalytics,
    getAutomationRules,
    updateAutomationRule,
    getWebhookLogs,
    getEmergencyLogs,
    getBroadcastCampaigns
};
