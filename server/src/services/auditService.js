const auditLogs = [];

/**
 * Logs a system action with role context and entity changes.
 */
const logAction = (userId, role, action, entity, entityId, prevValue = null, newValue = null) => {
    const logEntry = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: userId,
        role: role,
        action: action, // e.g., 'DISPENSE_MEDICINE', 'CHANGE_PRICE'
        entity: entity, // e.g., 'inventory', 'medicines', 'consultations'
        entity_id: entityId,
        prev_value: prevValue,
        new_value: newValue,
        timestamp: new Date()
    };

    auditLogs.push(logEntry);

    // In production, this would be a high-priority DB write or stream to ELK
    console.log(`[AUDIT] [${role.toUpperCase()}] ${userId} -> ${action} on ${entity}:${entityId}`);

    return logEntry;
};

const getAdminAuditTrail = () => {
    return auditLogs;
};

module.exports = { logAction, getAdminAuditTrail };
