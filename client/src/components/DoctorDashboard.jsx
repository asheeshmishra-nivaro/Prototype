import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Activity, Clock, AlertCircle, ShieldCheck,
    ArrowRight, TrendingUp, Users, DollarSign,
    Timer, Award, PhoneIncoming
} from 'lucide-react';

const DoctorDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const token = localStorage.getItem('nivaro_token');
                const res = await axios.get('/api/doctor/dashboard-summary', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSummary(res.data);
            } catch (err) {
                console.error('Failed to fetch dashboard summary:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Live Dashboard...</div>;

    return (
        <div className="fade-in" style={{ padding: '0.5rem' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Clinical Command Center</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Live Operational Status | Nodes Online | Node-to-Node Mesh Active</p>
                </div>
                <div style={{ background: 'var(--primary-light)', padding: '0.5rem 1rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                    <ShieldCheck size={18} />
                    Verified: {user.name} ({user.medical_degree})
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Consultations</span>
                        <Activity size={20} color="var(--primary)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{summary?.todayConsultations}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <TrendingUp size={12} /> +12% from yesterday
                    </div>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Queue</span>
                        <Users size={20} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{summary?.pendingQueue}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Next: Rajesh Kumar (Alpha)</div>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>License Status</span>
                        <Award size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{summary?.licenseStatus}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Expiry: {summary?.licenseExpiry}</div>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Financial Summary</span>
                        <DollarSign size={20} color="var(--accent)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{summary?.revenueToday}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Avg Consult Fee: ₹150</div>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Live Alerts Table */}
                <div className="glass-card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle color="var(--danger)" /> Urgent Clinical Alerts
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700 }}>LIVE UPDATES ACTIVE</span>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        {summary?.emergencyAlerts.map(alert => (
                            <div key={alert.id} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', background: '#fff5f5', borderRadius: '0.75rem',
                                border: '1px solid #fee2e2', marginBottom: '1rem'
                            }}>
                                <div style={{ background: 'var(--danger)', width: '10px', height: '10px', borderRadius: '50%' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{alert.type}: {alert.patient}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Value: {alert.value} | Captured at Village Alpha Node</div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{alert.time}</div>
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'var(--danger)' }}
                                    onClick={() => navigate('/doctor/queue')}
                                >
                                    CRITICAL VIEW
                                </button>
                            </div>
                        ))}

                        {summary?.highRiskFlags.map(alert => (
                            <div key={alert.id} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', background: '#fffbeb', borderRadius: '0.75rem',
                                border: '1px solid #fef3c7', marginBottom: '1rem'
                            }}>
                                <div style={{ background: '#f59e0b', width: '10px', height: '10px', borderRadius: '50%' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Risk Flag: {alert.patient}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#b45309' }}>Condition: {alert.condition}</div>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                    onClick={() => navigate('/doctor/history')}
                                >
                                    REVIEW TRENDS
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance & Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card">
                        <h4 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Timer size={18} /> Performance Metrics
                        </h4>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span>Avg. Consultation Time</span>
                                <span style={{ fontWeight: 700 }}>{summary?.avgConsultationTime}</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px' }}>
                                <div style={{ width: '60%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span>Patient Satisfaction</span>
                                <span style={{ fontWeight: 700 }}>4.8/5.0</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px' }}>
                                <div style={{ width: '92%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ background: 'var(--primary)', color: '#fff' }}>
                        <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <PhoneIncoming size={18} /> Broadcast Hub
                        </h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.5 }}>
                            The next patient in queue (Rajesh Kumar) has been waiting for 14 minutes. The operator is standing by.
                        </p>
                        <button
                            className="btn"
                            style={{ width: '100%', background: '#fff', color: 'var(--primary)', marginTop: '1rem', fontWeight: 700 }}
                            onClick={() => navigate('/doctor/queue')}
                        >
                            OPEN LIVE HUB <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
