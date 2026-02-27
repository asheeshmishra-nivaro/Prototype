import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone, FileText, User, Activity, Plus, ShieldCheck, Clock, Award, Trash2, Edit3, CheckCircle2, AlertTriangle, X, Eye, Search } from 'lucide-react';
import axios from 'axios';
import VideoRoom from './VideoRoom';

const DoseSelector = ({ dose, onChange }) => {
    const times = [
        { key: 'morning', label: 'Morning', defaultTime: '08:00' },
        { key: 'afternoon', label: 'Afternoon', defaultTime: '13:00' },
        { key: 'evening', label: 'Evening', defaultTime: '18:00' },
        { key: 'night', label: 'Night', defaultTime: '21:00' }
    ];

    return (
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {times.map(t => (
                    <div key={t.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={dose[t.key]?.enabled}
                                onChange={(e) => onChange(t.key, 'enabled', e.target.checked)}
                            />
                            {t.label}
                        </label>
                        {dose[t.key]?.enabled && (
                            <input
                                type="time"
                                value={dose[t.key]?.time || t.defaultTime}
                                onChange={(e) => onChange(t.key, 'time', e.target.value)}
                                style={{ fontSize: '0.75rem', padding: '0.2rem', height: 'auto' }}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Duration (Days)</label>
                    <input
                        type="number"
                        min="1"
                        value={dose.duration_days}
                        onChange={(e) => onChange('duration_days', null, parseInt(e.target.value))}
                        style={{ padding: '0.4rem 0.6rem', height: '38px', marginBottom: 0 }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Food Relation</label>
                    <select
                        value={dose.food_relation}
                        onChange={(e) => onChange('food_relation', null, e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', height: '38px', marginBottom: 0 }}
                    >
                        <option>Before Food</option>
                        <option>After Food</option>
                        <option>With Food</option>
                    </select>
                </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Frequency</label>
                <select
                    value={dose.frequency}
                    onChange={(e) => onChange('frequency', null, e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', height: '38px', marginBottom: 0 }}
                >
                    <option>Daily</option>
                    <option>Alternate Day</option>
                    <option>Weekly</option>
                </select>
            </div>
        </div>
    );
};

const MedicineSearch = ({ onSelect, rxMedicines }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (query.trim().length < 1) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            fetchMedicines();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchMedicines = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('nivaro_token');
            const res = await axios.get(`/api/inventory/search?q=${query}`, {
                signal: abortControllerRef.current.signal,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setResults(res.data);
            setShowDropdown(true);
            setSelectedIndex(-1);
        } catch (err) {
            if (err.name !== 'CanceledError') {
                setError('Unable to fetch medicines. Retry.');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                selectMed(results[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const selectMed = (med) => {
        const isDuplicate = rxMedicines.some(m => m.sku === med.sku);
        if (isDuplicate) {
            alert('Medicine already added.');
            return;
        }
        onSelect(med);
        setQuery('');
        setResults([]);
        setShowDropdown(false);
    };

    return (
        <div style={{ position: 'relative', width: '100%', marginBottom: '1.5rem' }} ref={searchRef}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Select Medication (Searchable)</label>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Search Name, SKU, or Generic..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ marginBottom: 0, paddingLeft: '2.5rem' }}
                    autoComplete="off"
                />
                <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '0.85rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                {loading && (
                    <div className="spin" style={{ position: 'absolute', right: '1rem', top: '0.85rem' }}>
                        <Clock size={16} color="var(--primary)" />
                    </div>
                )}
            </div>

            {showDropdown && (
                <div className="glass-card" style={{
                    position: 'absolute', top: '105%', left: 0, width: '100%',
                    zIndex: 100, padding: '0.5rem', maxHeight: '300px',
                    overflowY: 'auto', background: '#fff', border: '1px solid var(--primary)',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    {results.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No matching medicines found.
                        </div>
                    ) : (
                        results.map((med, idx) => (
                            <div
                                key={med.id || med.sku}
                                onClick={() => selectMed(med)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    background: selectedIndex === idx ? '#eff6ff' : 'transparent',
                                    border: selectedIndex === idx ? '1px solid var(--primary-glow)' : '1px solid transparent',
                                    transition: 'all 0.1s'
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{med.name} {med.strength}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{med.sku}</span> | <span>{med.form}</span>
                                    {med.generic_name && <span style={{ fontStyle: 'italic', marginLeft: 'auto' }}>{med.generic_name}</span>}
                                </div>
                            </div>
                        ))
                    )}
                    {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', padding: '0.5rem', textAlign: 'center' }}>{error}</div>}
                </div>
            )}
        </div>
    );
};

const DoctorView = ({ user }) => {
    const location = useLocation();
    const activeConsultation = location.state?.consultation;
    const patientName = activeConsultation?.patient_name || 'Select Patient';
    const patientVitals = activeConsultation?.vitals ? JSON.parse(activeConsultation.vitals) : {};

    const [inCall, setInCall] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [rxMedicines, setRxMedicines] = useState(() => {
        const saved = localStorage.getItem(`nivaro_rx_draft_${user.id}`);
        return saved ? JSON.parse(saved) : [];
    });
    const [notes, setNotes] = useState(() => {
        return localStorage.getItem(`nivaro_notes_draft_${user.id}`) || '';
    });
    const [showPreview, setShowPreview] = useState(false);
    const [editingMedId, setEditingMedId] = useState(null);

    useEffect(() => {
        localStorage.setItem(`nivaro_rx_draft_${user.id}`, JSON.stringify(rxMedicines));
        localStorage.setItem(`nivaro_notes_draft_${user.id}`, notes);
    }, [rxMedicines, notes, user.id]);

    const doctorStats = {
        license: user.license_number || 'MC-2026-9921',
        specialty: user.specialization || 'General Physician'
    };

    const handleJoinCall = async () => {
        try {
            const token = localStorage.getItem('nivaro_token');
            const channelName = 'consultation_882';
            const res = await axios.get(`/api/video/token?channelName=${channelName}&uid=${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setVideoData(res.data);
            setInCall(true);
        } catch (err) {
            console.error('Failed to get video token:', err);
            alert('Video service unreachable. Check connectivity.');
        }
    };

    const addMedicine = (med) => {
        const newMed = {
            id: Date.now(),
            name: med.name,
            sku: med.sku,
            strength: med.strength,
            morning: { enabled: true, time: '08:00' },
            afternoon: { enabled: false, time: '13:00' },
            evening: { enabled: true, time: '18:00' },
            night: { enabled: false, time: '21:00' },
            duration_days: 5,
            food_relation: 'After Food',
            frequency: 'Daily',
            instructions: ''
        };
        setRxMedicines([...rxMedicines, newMed]);
        setEditingMedId(newMed.id);
    };

    const updateMedDose = (id, key, field, value) => {
        setRxMedicines(rxMedicines.map(m => {
            if (m.id !== id) return m;
            if (field === null) return { ...m, [key]: value };
            return {
                ...m,
                [key]: { ...m[key], [field]: value }
            };
        }));
    };

    const removeMedicine = (id) => {
        setRxMedicines(rxMedicines.filter(m => m.id !== id));
        if (editingMedId === id) setEditingMedId(null);
    };

    const isRxValid = rxMedicines.length > 0 &&
        rxMedicines.every(m => (m.morning.enabled || m.afternoon.enabled || m.evening.enabled || m.night.enabled) && m.duration_days > 0);

    const finalizeRx = async () => {
        try {
            const token = localStorage.getItem('nivaro_token');
            await axios.post('/api/consultations/prescription', {
                consultation_id: 'sample-cons-id',
                patient_id: 'sample-pat-id',
                medicines: rxMedicines,
                instructions: notes,
                doctor_info: { id: user.id, name: user.name, license_number: doctorStats.license }
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Prescription finalized and delivered via WhatsApp!');
            setRxMedicines([]);
            setNotes('');
            setShowPreview(false);
            localStorage.removeItem(`nivaro_rx_draft_${user.id}`);
            localStorage.removeItem(`nivaro_notes_draft_${user.id}`);
        } catch (err) {
            console.error(err);
            alert('Connection failure. Check backend logs.');
        }
    };

    return (
        <div className="grid fade-in" style={{ gridTemplateColumns: '1fr 450px', alignItems: 'start', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Consultation Hub</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ShieldCheck size={14} /> ENCRYPTED RTC ACTIVE
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patient: {patientName} ({activeConsultation?.village_name || 'Node'})</span>
                    </div>
                </div>

                <div className="glass-card" style={{ background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '450px', color: 'white', position: 'relative', borderRadius: '1.25rem', overflow: 'hidden' }}>
                    {inCall ? (
                        <VideoRoom
                            channelName={videoData?.channel}
                            token={videoData?.token}
                            appId={videoData?.appId}
                            uid={user.id}
                            onEndCall={() => setInCall(false)}
                        />
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <button className="btn btn-primary" style={{ padding: '1.5rem 3.5rem', borderRadius: '1rem', fontSize: '1.2rem', gap: '1rem' }} onClick={handleJoinCall}>
                                <Phone /> Connect (Join Channel)
                            </button>
                            <p style={{ marginTop: '1.5rem', opacity: 0.6, fontSize: '0.9rem' }}>Waiting for operator at Village Alpha Node...</p>
                        </div>
                    )}
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Verified Vitals</h3>
                        <ShieldCheck color="var(--accent)" size={20} />
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>TEMP</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{patientVitals.temp || '--'} °F</p>
                        </div>
                        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid #fee2e2' }}>
                            <p style={{ fontSize: '0.7rem', color: '#b91c1c', marginBottom: '0.2rem' }}>BP (S/D)</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b91c1c' }}>{patientVitals.bp_systolic || '--'} / {patientVitals.bp_diastolic || '--'}</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>SPO2</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{patientVitals.spo2 || '--'} %</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>GLUCOSE</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{patientVitals.glucose || '--'} mg/dL</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '5px solid var(--primary)', position: 'sticky', top: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>E-Prescription</h3>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>ID: <b>NV-2026-RX882</b></p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <p><b>Dr. {user.name}</b></p>
                        <p>{doctorStats.license}</p>
                    </div>
                </div>

                <MedicineSearch onSelect={addMedicine} rxMedicines={rxMedicines} />

                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', marginBottom: '1.5rem' }}>
                    {rxMedicines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '2px dashed var(--border)', borderRadius: '1rem', color: 'var(--text-muted)' }}>
                            <Activity size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p style={{ fontSize: '0.9rem' }}>Draft prescription here...</p>
                        </div>
                    ) : (
                        rxMedicines.map(med => (
                            <div key={med.id} className="fade-in" style={{ padding: '1rem', background: '#fff', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--primary)' }}>{med.name} {med.strength}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button onClick={() => setEditingMedId(editingMedId === med.id ? null : med.id)} style={{ padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Edit3 size={16} /></button>
                                        <button onClick={() => removeMedicine(med.id)} style={{ padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                {editingMedId === med.id ? (
                                    <DoseSelector dose={med} onChange={(key, field, val) => updateMedDose(med.id, key, field, val)} />
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        <span><b>Dose:</b> {[med.morning.enabled && '1', med.afternoon.enabled && '1', med.evening.enabled && '1', med.night.enabled && '1'].filter(Boolean).join('-') || '0'}</span>
                                        <span><b>Time:</b> {med.food_relation}</span>
                                        <span><b>Dur:</b> {med.duration_days}D</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Clinical Advice</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Advice to patient..." style={{ minHeight: '80px', fontSize: '0.9rem', marginBottom: '1.5rem' }} />

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} disabled={!isRxValid} onClick={() => setShowPreview(true)}>
                        <Eye size={18} /> Preview
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '1rem', opacity: isRxValid ? 1 : 0.5 }} disabled={!isRxValid} onClick={() => setShowPreview(true)}>
                        <FileText size={18} /> Finalize
                    </button>
                </div>
            </div>

            {showPreview && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
                    <div className="glass-card" style={{ width: '850px', maxHeight: '95vh', overflowY: 'auto', background: '#fff', color: '#1e293b', padding: '3.5rem', position: 'relative' }}>
                        <button onClick={() => setShowPreview(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={28} /></button>

                        <div style={{ borderBottom: '3px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ color: 'var(--primary)', margin: 0, fontSize: '2.2rem', letterSpacing: '-1px' }}>NIVARO HEALTH</h1>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, opacity: 0.7 }}>DIGITAL PRESCRIPTION SERVICE</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '1.1rem' }}><b>RX ID:</b> NV-2026-RX882</p>
                                <p style={{ margin: 0, opacity: 0.6 }}>Date: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                            <div>
                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Practitioner</h4>
                                <p style={{ fontSize: '1.1rem', margin: '0 0 0.3rem' }}><b>Dr. {user.name}</b></p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Reg No: {doctorStats.license}</p>
                            </div>
                            <div>
                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Patient</h4>
                                <p style={{ fontSize: '1.1rem', margin: '0 0 0.3rem' }}><b>{patientName}</b></p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{activeConsultation?.age || '--'} Yrs | {activeConsultation?.gender || '--'} | {activeConsultation?.village_name || 'Node'}</p>
                            </div>
                        </div>

                        <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Prescribed Medication</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1.2rem' }}>Medicine</th>
                                    <th style={{ padding: '1.2rem' }}>Dosing Schedule</th>
                                    <th style={{ padding: '1.2rem' }}>Duration</th>
                                    <th style={{ padding: '1.2rem' }}>Instructions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rxMedicines.map(med => (
                                    <tr key={med.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{med.name} {med.strength}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                                {med.morning.enabled && `MOR(${med.morning.time}) `}
                                                {med.afternoon.enabled && `AFT(${med.afternoon.time}) `}
                                                {med.evening.enabled && `EVE(${med.evening.time}) `}
                                                {med.night.enabled && `NIT(${med.night.time})`}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.3rem' }}>{med.food_relation} | {med.frequency}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem', fontWeight: 600 }}>{med.duration_days} Days</td>
                                        <td style={{ padding: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{med.instructions || 'As directed'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {notes && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Clinical Advice</h4>
                                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', fontSize: '0.95rem', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>{notes}</div>
                            </div>
                        )}

                        <div style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, height: '4rem' }} onClick={() => setShowPreview(false)}>Back to Editor</button>
                            <button className="btn btn-primary" style={{ flex: 1, height: '4rem' }} onClick={finalizeRx}>Confirm & Finalize Prescription</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorView;
