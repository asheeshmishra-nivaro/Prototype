import React, { useState } from 'react';
import { History, FileText } from 'lucide-react';

const SystemAudit = () => {
    const [auditLogs] = useState([
        { id: '1', actor: 'Operator John', action: 'DISPENSE_MEDICINE', entity: 'Paracetamol', village: 'Village Alpha', time: '2 mins ago', details: 'Prescription #NV-2026-9921' },
        { id: '2', actor: 'Dr. Sen', action: 'WRITE_PRESCRIPTION', entity: 'Patient Rajesh', village: 'N/A', time: '15 mins ago', details: 'Diagnosis: High BP' },
        { id: '3', actor: 'Admin', action: 'CHANGE_PRICE', entity: 'SKU001', village: 'Global', time: '1 hour ago', details: '₹5 -> ₹6' }
    ]);

    return (
        <div className="glass-card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Global System Audit Trail</h2>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}><FileText size={14} /> Export CSV</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {auditLogs.map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border)', alignItems: 'center' }}>
                        <div style={{ padding: '0.5rem', background: '#e2e8f0', borderRadius: '0.5rem' }}><History size={18} /></div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 750, fontSize: '0.9rem' }}>{log.actor} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>performed</span> {log.action}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {log.entity} | {log.details}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>{log.time}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--primary)' }}>{log.village}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SystemAudit;
