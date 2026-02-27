const axios = require('axios');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class WhatsAppService {
    constructor() {
        this.apiKey = process.env.WHATSAPP_API_KEY;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_ID;
        this.apiBase = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    }

    async logMessage(patientId, toNumber, content, templateId = null, status = 'sent') {
        const id = uuidv4();
        await db.query(
            "INSERT INTO whatsapp_logs (id, patient_id, to_number, content, template_id, status) VALUES ($1, $2, $3, $4, $5, $6)",
            [id, patientId, toNumber, content, templateId, status]
        );
        return id;
    }

    async checkConsent(patientId) {
        const result = await db.query("SELECT consent_status FROM whatsapp_consent WHERE patient_id = $1", [patientId]);
        return result.rows[0]?.consent_status === 'opted_in';
    }

    async sendMessage(to, message, isTemplate = false, patientId = null) {
        // Consent Check
        if (patientId) {
            const hasConsent = await this.checkConsent(patientId);
            if (!hasConsent) {
                console.log(`[WA-BLOCKED] No consent for patient ${patientId}`);
                return { status: 'blocked' };
            }
        }

        if (!this.apiKey || !this.phoneNumberId) {
            console.log(`[WA-MOCK] Sending message to ${to}: ${message}`);
            await this.logMessage(patientId, to, typeof message === 'string' ? message : JSON.stringify(message));
            return { status: 'mocked' };
        }

        try {
            const data = isTemplate ? {
                messaging_product: "whatsapp",
                to: to,
                type: "template",
                template: message
            } : {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: message }
            };

            const response = await axios.post(this.apiBase, data, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            const metaId = response.data?.messages?.[0]?.id;
            const logId = await this.logMessage(patientId, to, isTemplate ? `Template: ${message.name}` : message, isTemplate ? message.id : null);

            if (metaId) {
                await db.query("UPDATE whatsapp_logs SET message_id = $1 WHERE id = $2", [metaId, logId]);
            }

            return response.data;
        } catch (error) {
            console.error('[WA-ERROR] Message delivery failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async scheduleMessage(patientId, templateId, delayDays) {
        const id = uuidv4();
        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + delayDays);

        await db.query(
            "INSERT INTO whatsapp_scheduled_messages (id, patient_id, template_id, scheduled_time) VALUES ($1, $2, $3, $4)",
            [id, patientId, templateId, scheduledTime.toISOString()]
        );
        console.log(`[WA-SCHED] Message for patient ${patientId} scheduled for ${scheduledTime.toISOString()}`);
    }

    async triggerAutomation(eventName, patientId, extraData = {}) {
        const rules = await db.query("SELECT * FROM whatsapp_automation_rules WHERE trigger_event = $1 AND is_active = 1", [eventName]);
        for (const rule of rules.rows) {
            await this.scheduleMessage(patientId, rule.template_id, rule.delay_days);
        }
    }

    async sendPrescription(to, patientName, prescriptionId, pdfUrl, patientId = null) {
        const msg = `Your prescription NV-${prescriptionId} from Nivaro Health is ready. View here: ${pdfUrl}`;
        await this.sendMessage(to, msg, false, patientId);
        // Trigger follow-up automations
        await this.triggerAutomation('prescription_created', patientId);
    }

    async processScheduledMessages() {
        const now = new Date().toISOString();
        const due = await db.query(
            "SELECT s.*, p.phone, p.name as patient_name, t.content, t.name as template_name FROM whatsapp_scheduled_messages s " +
            "JOIN patients p ON s.patient_id = p.id " +
            "JOIN whatsapp_templates t ON s.template_id = t.id " +
            "WHERE s.scheduled_time <= $1 AND s.status = 'scheduled'",
            [now]
        );

        for (const msg of due.rows) {
            try {
                const content = msg.content.replace('{{name}}', msg.patient_name);
                await this.sendMessage(msg.phone, content, false, msg.patient_id);
                await db.query("UPDATE whatsapp_scheduled_messages SET status = 'sent' WHERE id = $1", [msg.id]);
                console.log(`[WA-CRON] Sent scheduled message ${msg.id} to ${msg.phone}`);
            } catch (e) {
                console.error(`[WA-CRON] Failed to send ${msg.id}:`, e.message);
                await db.query("UPDATE whatsapp_scheduled_messages SET status = 'failed' WHERE id = $1", [msg.id]);
            }
        }
    }

    async scheduleMedicineReminders(patientId, prescriptionId, medicines) {
        // medicines: [{id: 'm1', name: 'Paracetamol', dosage: '1-0-1'}]
        const medsArray = typeof medicines === 'string' ? JSON.parse(medicines) : medicines;

        for (const med of medsArray) {
            const dosage = med.dosage || '1-0-1'; // Default
            const [morning, afternoon, evening] = dosage.split('-');

            if (morning === '1') await this.scheduleSpecificReminder(patientId, med.name, '08:00');
            if (afternoon === '1') await this.scheduleSpecificReminder(patientId, med.name, '14:00');
            if (evening === '1') await this.scheduleSpecificReminder(patientId, med.name, '20:00');
        }
    }

    async scheduleSpecificReminder(patientId, medName, time) {
        const id = uuidv4();
        const today = new Date();
        const [hours, minutes] = time.split(':');
        today.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If time passed today, schedule for tomorrow
        if (today < new Date()) {
            today.setDate(today.getDate() + 1);
        }

        await db.query(
            "INSERT INTO whatsapp_scheduled_messages (id, patient_id, template_id, scheduled_time) VALUES ($1, $2, 't4', $3)",
            [id, patientId, today.toISOString()]
        );
        console.log(`[WA-RX] Scheduled ${medName} reminder for patient ${patientId} at ${today.toISOString()}`);
    }

    async updateMessageStatus(metaId, status, timestamp) {
        const fieldMap = {
            'delivered': 'delivered_at',
            'read': 'read_at'
        };

        const field = fieldMap[status];
        if (field) {
            await db.query(
                `UPDATE whatsapp_logs SET status = $1, ${field} = $2 WHERE message_id = $3`,
                [status, new Date(parseInt(timestamp) * 1000).toISOString(), metaId]
            );
            console.log(`[WA-STATUS] Message ${metaId} updated to ${status}`);
        }
    }
}

module.exports = new WhatsAppService();
