const crypto = require('crypto');

/**
 * Agora Video Controller
 * In production: Use 'agora-token' library.
 * This implementation generates a secure, timed-based token simulation for the prototype.
 */
const generateToken = async (req, res) => {
    const { channelName, role, uid } = req.query;

    if (!channelName) {
        return res.status(400).json({ error: 'channelName is required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (appId === 'your_agora_app_id') {
        // Return a mock token if credentials aren't set yet
        console.warn('[VIDEO] Using MOCK token. Set AGORA_APP_ID in .env for real RTC.');
        return res.json({
            token: `mock_token_${channelName}_${uid || 0}`,
            appId: appId,
            channel: channelName
        });
    }

    // In a real scenario, you'd use RtcTokenBuilder from agora-token:
    // const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, roleType, privilegeExpireTime);

    // Simulation for Prototype (Signed String)
    const expireTime = Math.floor(Date.now() / 1000) + 3600;
    const tokenPayload = `${channelName}:${uid || 0}:${expireTime}`;
    const token = crypto.createHmac('sha256', appCertificate).update(tokenPayload).digest('hex');

    res.json({
        token: token,
        appId: appId,
        channel: channelName,
        uid: uid || 0,
        expireTime: expireTime
    });
};

module.exports = {
    generateToken
};
