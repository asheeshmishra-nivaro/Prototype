const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const whatsappController = require('../controllers/whatsappController');
const auth = require('../middleware/auth');
const { users } = require('../controllers/authController');

// Template Management (Admin Only)
router.get('/templates', auth(['admin', 'operator']), whatsappController.getTemplates);
router.post('/templates', auth(['admin']), whatsappController.createTemplate);
router.delete('/templates/:id', auth(['admin']), whatsappController.deleteTemplate);

// Consent Management
router.get('/consent/:patient_id', auth(['admin', 'operator']), whatsappController.getConsent);
router.post('/consent', auth(['admin', 'operator']), whatsappController.updateConsent);

// Automation Rules (Admin Only)
router.get('/rules', auth(['admin', 'operator']), whatsappController.getAutomationRules);
router.post('/rules/toggle', auth(['admin']), whatsappController.updateAutomationRule);

// Analytics (Admin/Operator)
router.get('/analytics', auth(['admin', 'operator']), whatsappController.getAnalytics);
router.get('/emergency-logs', auth(['admin', 'operator']), whatsappController.getEmergencyLogs);
router.get('/campaigns', auth(['admin', 'operator']), whatsappController.getBroadcastCampaigns);
router.get('/webhook-logs', auth(['admin']), whatsappController.getWebhookLogs);

// Webhook Verification (Meta requirement)
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === process.env.WA_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

/**
 * Database-Driven WhatsApp Bot logic
 */
router.post('/webhook', async (req, res) => {
    const body = req.body;

    // Log webhook payload for debug panel
    const db = require('../db');
    const { v4: uuidv4 } = require('uuid');
    try {
        await db.query(
            "INSERT INTO whatsapp_webhook_logs (id, payload, signature_verified) VALUES ($1, $2, $3)",
            [uuidv4(), JSON.stringify(body), true]
        );
    } catch (e) { console.error('Failed to log webhook:', e); }

    if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0]?.value;

        // 1. Handle Status Updates (delivered, read)
        if (changes?.statuses?.[0]) {
            const statusUpdate = changes.statuses[0];
            await whatsappService.updateMessageStatus(
                statusUpdate.id,
                statusUpdate.status,
                statusUpdate.timestamp
            );
        }

        // 2. Handle Incoming Messages
        if (changes?.messages?.[0]) {
            const message = changes.messages[0];
            const from = message.from;
            const text = message.text?.body?.toLowerCase();

            // ... existing bot logic ...
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
