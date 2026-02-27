const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to log sensitive administrative actions
 */
const activityLogger = async (req, res, next) => {
    // We only log successful mutations or specific sensitive GETs if needed
    // For now, let's log any POST/PUT/DELETE on admin routes
    const originalSend = res.send;

    res.send = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const userId = req.user ? req.user.id : null;
            const action = `${req.method} ${req.originalUrl}`;
            const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];

            // Async log, don't block response
            db.query(`
                INSERT INTO activity_log (id, user_id, action, ip_address, user_agent, timestamp)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            `, [uuidv4(), userId, action, ip, userAgent]).catch(err => {
                console.error('[LOGGER-ERROR] Failed to log activity:', err.message);
            });
        }
        originalSend.call(this, body);
    };

    next();
};

module.exports = activityLogger;
