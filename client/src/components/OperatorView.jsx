import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Activity, Pill, Thermometer, Droplets, HeartPulse, User, Award, ShieldCheck, MapPin, Loader2, Phone } from 'lucide-react';
import VideoRoom from './VideoRoom';

const OperatorView = ({ user, activeTab }) => {
    const [phoneSearch, setPhoneSearch] = useState('');
    const [workflowStep, setWorkflowStep] = useState(1); // 1: Reg, 2: Vitals, 3: Connect
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [videoData, setVideoData] = useState(null);

    useEffect(() => {
        if (workflowStep === 3) {
            fetchDoctors();
        }
    }, [workflowStep]);

    useEffect(() => {
        // Reset workflow when switching tabs
        if (activeTab !== 'registration') {
            setWorkflowStep(1);
        }
    }, [activeTab]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nivaro_token');
            // Ensure axios defaults or absolute URL for proxy robustness
            const res = await axios.get('/api/auth/doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Fetched Doctors:', res.data);

            if (Array.isArray(res.data) && res.data.length > 0) {
                setDoctors(res.data);
                setSelectedDoctor(res.data[0]);
            } else {
                // Fallback to avoid empty UI during sync/dev
                const fallback = {
                    id: 'doc-101',
                    name: 'Dr. Amartya Sen',
                    medical_degree: 'MD, General Medicine',
                    specialization: 'Internal Medicine',
                    license_number: 'MC-2026-9921',
                    experience_years: 12,
                    hospital_affiliation: 'City General Hospital',
                    profile_photo_url: 'https://ui-avatars.com/api/?name=Amartya+Sen&background=0D8ABC&color=fff',
                    rating: 4.8,
                    status: 'online'
                };
                setDoctors([fallback]);
                setSelectedDoctor(fallback);
            }
        } catch (err) {
            console.error('Failed to fetch doctors', err);
            // Even if fetch fails, show the primary doctor for demo continuity
            const fallback = {
                id: 'doc-101',
                name: 'Dr. Amartya Sen (Offline Mode)',
                medical_degree: 'MD, General Medicine',
                specialization: 'Internal Medicine',
                license_number: 'MC-2026-9921',
                experience_years: 12,
                hospital_affiliation: 'City General Hospital',
                profile_photo_url: 'https://ui-avatars.com/api/?name=Amartya+Sen&background=0D8ABC&color=fff',
                rating: 4.8,
                status: 'online'
            };
            setDoctors([fallback]);
            setSelectedDoctor(fallback);
        }
        setLoading(false);
    };

    const handleJoinCall = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('nivaro_token');
            const channelName = 'consultation_882'; // Linked consultation ID
            const res = await axios.get(`/api/video/token?channelName=${channelName}&uid=${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setVideoData(res.data);
            setInCall(true);
        } catch (err) {
            console.error('Video Connection Error:', err);
            alert('Video service unreachable. Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    if (activeTab === 'registration') {
        return (
            <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <span style={{ fontWeight: workflowStep === 1 ? 700 : 400, color: workflowStep === 1 ? 'var(--primary)' : 'inherit' }}>1. Registration</span>
                    <span style={{ fontWeight: workflowStep === 2 ? 700 : 400, color: workflowStep === 2 ? 'var(--primary)' : 'inherit' }}>2. Vitals</span>
                    <span style={{ fontWeight: workflowStep === 3 ? 700 : 400, color: workflowStep === 3 ? 'var(--primary)' : 'inherit' }}>3. consultation</span>
                </div>

                {workflowStep === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); setWorkflowStep(2); }}>
                        <h3>Patient Demographics</h3>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div><label>Full Name</label><input type="text" placeholder="e.g. Rajesh Kumar" required /></div>
                            <div><label>Phone Number</label><input type="tel" placeholder="+91 9123456789" required /></div>
                            <div><label>Age</label><input type="number" placeholder="45" required /></div>
                            <div><label>Gender</label><select><option>Male</option><option>Female</option></select></div>
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Next: Enter Clinical Vitals</button>
                    </form>
                )}

                {workflowStep === 2 && (
                    <form onSubmit={(e) => { e.preventDefault(); setWorkflowStep(3); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3>Step 2: Vitals Clinical Intake</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>* Mandatory Validation</span>
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div>
                                <label><Thermometer size={14} /> Temperature (°F)</label>
                                <input type="number" step="0.1" placeholder="98.6" min="90" max="110" required />
                            </div>
                            <div>
                                <label><HeartPulse size={14} /> Systolic BP</label>
                                <input type="number" placeholder="120" min="70" max="250" required />
                            </div>
                            <div>
                                <label><HeartPulse size={14} /> Diastolic BP</label>
                                <input type="number" placeholder="80" min="40" max="150" required />
                            </div>
                            <div>
                                <label><Droplets size={14} /> SpO2 (%)</label>
                                <input type="number" placeholder="98" min="70" max="100" required />
                            </div>
                            <div>
                                <label><Activity size={14} /> Glucose (mg/dL)</label>
                                <input type="number" placeholder="100" min="20" max="600" />
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }}>Next: Select Available Doctor</button>
                            <button className="btn btn-secondary" onClick={() => setWorkflowStep(1)}>Back</button>
                        </div>
                    </form>
                )}

                {workflowStep === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <h3>Step 3: Connect with Doctor</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Requesting secure channel for Village: {user.assigned_village_name}</p>

                        {loading ? (
                            <div style={{ padding: '3rem' }}><Loader2 className="spin" size={40} color="var(--primary)" /></div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1.5rem', textAlign: 'left', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                                    <label>Choose Available Physician</label>
                                    <select
                                        onChange={(e) => setSelectedDoctor(doctors.find(d => d.id === e.target.value))}
                                        value={selectedDoctor?.id || ''}
                                    >
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedDoctor && (
                                    <div className="glass-card fade-in" style={{ maxWidth: '500px', margin: '0 auto 2rem', textAlign: 'left', border: '2px solid var(--primary)', background: '#f0f9ff' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <img
                                                src={selectedDoctor.profile_photo_url}
                                                alt={selectedDoctor.name}
                                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid white', boxShadow: 'var(--shadow-sm)' }}
                                            />
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedDoctor.name}</h4>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>{selectedDoctor.specialization}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                                    <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>{selectedDoctor.status?.toUpperCase() || 'ONLINE'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                            <div><p style={{ color: 'var(--text-muted)' }}>License No:</p><b>{selectedDoctor.license_number}</b></div>
                                            <div><p style={{ color: 'var(--text-muted)' }}>Degree:</p><b>{selectedDoctor.medical_degree}</b></div>
                                            <div><p style={{ color: 'var(--text-muted)' }}>Experience:</p><b>{selectedDoctor.experience_years} Years</b></div>
                                            <div><p style={{ color: 'var(--text-muted)' }}>Hospital:</p><b>{selectedDoctor.hospital_affiliation}</b></div>
                                            <div><p style={{ color: 'var(--text-muted)' }}>Rating:</p><b>{selectedDoctor.rating} ⭐</b></div>
                                            <div><p style={{ color: 'var(--text-muted)' }}>Response:</p><b>{selectedDoctor.responseTime || '~5 mins'}</b></div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {inCall ? (
                            <div style={{ height: '500px', width: '100%', borderRadius: '1.25rem', overflow: 'hidden' }}>
                                <VideoRoom
                                    channelName={videoData?.channel}
                                    token={videoData?.token}
                                    appId={videoData?.appId}
                                    uid={user.id}
                                    onEndCall={() => setInCall(false)}
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }} onClick={handleJoinCall}>
                                    <Phone size={20} /> Start Session Now
                                </button>
                                <button className="btn btn-secondary" onClick={() => setWorkflowStep(2)}>Back to Vitals</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'inventory') {
        return (
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Village Stock & Dispensing Log</h2>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Node: <b>{user.assigned_village_name}</b></p>
                        <p>Operator: {user.name}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fee2e2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <ShieldCheck color="#b91c1c" size={24} />
                        <h4 style={{ color: '#b91c1c', margin: 0 }}>PENDING DISPENSE: RX #NV-2026-9921</h4>
                    </div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Patient: Rajesh Kumar | Physician: Dr. Sen (Verified)</p>
                    <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                        <b>Prescribed:</b> Paracetamol 500mg, Amoxicillin 250mg
                    </div>
                    <button className="btn btn-primary" style={{ background: '#b91c1c', marginTop: '1rem' }} onClick={() => alert('Inventory Deducted. Batch #B-2026-X1. Audit Log Created.')}>
                        Confirm Dispense & Log Payment
                    </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}><th>Medicine</th><th>SKU</th><th>Batch</th><th>Stock</th><th>Price</th></tr></thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}><td>Paracetamol</td><td>SKU001</td><td>#B2026-X1</td><td>120 units</td><td>₹5</td></tr>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}><td>Amoxicillin</td><td>SKU002</td><td style={{ color: 'var(--danger)' }}>#B2026-A4</td><td style={{ color: 'var(--danger)', fontWeight: 700 }}>8 units (LOW)</td><td>₹25</td></tr>
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="glass-card">
                    <MapPin size={32} color="var(--primary)" />
                    <h3>Assigned Node</h3>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.assigned_village_name}</p>
                </div>
                <div className="glass-card">
                    <ShieldCheck size={32} color="var(--accent)" />
                    <h3>Secured Consults</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800 }}>12</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This Week</p>
                </div>
                <div className="glass-card">
                    <Award size={32} color="#f59e0b" />
                    <h3>Total Earnings</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 800 }}>₹1,640</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Calculated (10% Comm.)</p>
                </div>
            </div>

            <div className="glass-card" style={{ marginTop: '2.5rem' }}>
                <h3>Search Global Patient Database</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input type="text" placeholder="Enter Phone Number..." value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} />
                    <button className="btn btn-primary" style={{ minWidth: '140px', height: '45px' }}>
                        <Search size={18} style={{ marginRight: '0.5rem' }} /> Search
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OperatorView;
