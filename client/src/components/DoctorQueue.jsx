import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Activity, Clock, AlertCircle, ChevronRight,
    ShieldCheck, User, MapPin, Activity as VitalsIcon
} from 'lucide-react';

const DoctorQueue = ({ user }) => {
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const token = localStorage.getItem('nivaro_token');
                const res = await axios.get('/api/consultations/queue', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setQueue(res.data);
            } catch (err) {
                console.error('Failed to fetch queue:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchQueue();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Prioritized Queue...</div>;

    return (
        <div className="fade-in" style={{ padding: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Clinical Live Hub</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Prioritized Patient Intake | Risk-Based Sorting Active</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ background: '#fef2f2', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid #fee2e2', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 700 }}>
                        {queue.filter(p => p.priority_level === 1).length} CRITICAL
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 0 }}>
                {queue.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Activity size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>Waiting Room is currently empty.</p>
                    </div>
                ) : (
                    <div>
                        {queue.map((item, index) => {
                            const vitals = JSON.parse(item.vitals);
                            const isCritical = item.priority_level === 1;
                            const isHighRisk = item.priority_level === 2;

                            return (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1.5rem',
                                    borderBottom: index === queue.length - 1 ? 'none' : '1px solid var(--border)',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer',
                                    background: isCritical ? '#fff5f5' : 'transparent'
                                }}
                                    onClick={() => navigate('/doctor/consultation', { state: { consultation: item } })}
                                    className="queue-item-hover"
                                >
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        background: isCritical ? 'var(--danger)' : isHighRisk ? '#f59e0b' : 'var(--primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', marginRight: '1.5rem'
                                    }}>
                                        <User size={24} />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{item.patient_name}</span>
                                            {isCritical && <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>CRITICAL SPO2</span>}
                                            {isHighRisk && <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>HYPERTENSION</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {item.village_name}</span>
                                            <span>{item.age} Yrs • {item.gender}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> Waiting: {Math.round((new Date() - new Date(item.created_at)) / 60000)}m</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1.5rem', marginRight: '3rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>SPO2</p>
                                            <p style={{ fontWeight: 700, color: vitals.spo2 < 90 ? 'var(--danger)' : 'inherit' }}>{vitals.spo2}%</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>BP</p>
                                            <p style={{ fontWeight: 700, color: (vitals.bp_systolic >= 140 || vitals.bp_diastolic >= 90) ? '#f59e0b' : 'inherit' }}>{vitals.bp_systolic}/{vitals.bp_diastolic}</p>
                                        </div>
                                    </div>

                                    <div className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        CONNECT <ChevronRight size={18} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorQueue;
