import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Search, Filter, User, Calendar, MapPin,
    ChevronRight, FileText, Download, TrendingUp,
    ArrowLeft, History, Activity, Droplets, Heart,
    ShieldCheck
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { jsPDF } from 'jspdf';

const VitalsTrendChart = ({ data }) => {
    if (!data || data.length === 0) return (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '1rem', color: 'var(--text-muted)' }}>
            No clinical history available for visualization.
        </div>
    );

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                        contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '0.85rem', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px' }} />
                    <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="glucose" name="Blood Sugar" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const DoctorPatientRecords = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [vitalsHistory, setVitalsHistory] = useState([]);
    const [rxHistory, setRxHistory] = useState([]);
    const [search, setSearch] = useState('');
    const [villageFilter, setVillageFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'profile'

    useEffect(() => {
        fetchPatients();
    }, [search, villageFilter]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nivaro_token');
            const res = await axios.get(`/api/doctor/patients?search=${search}&village=${villageFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPatients(res.data);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = async (patient) => {
        setSelectedPatient(patient);
        setViewMode('profile');
        setLoading(true);
        try {
            const token = localStorage.getItem('nivaro_token');
            const [vitalsRes, rxRes] = await Promise.all([
                axios.get(`/api/doctor/patient/${patient.id}/vitals-history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get(`/api/doctor/patient/${patient.id}/prescriptions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            setVitalsHistory(vitalsRes.data);
            setRxHistory(rxRes.data);
        } catch (err) {
            console.error('Failed to fetch patient history:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = (rx) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(17, 24, 39); // Gray-900
        doc.text("NIVARO HEALTH TECHNOLOGIES", 105, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); // Gray-500
        doc.text(`Digital Health Node: Village ${selectedPatient.village}`, 105, 26, { align: "center" });

        doc.setDrawColor(229, 231, 235);
        doc.line(20, 35, 190, 35);

        // Doctor Info
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "bold");
        doc.text(`Prescribing Physician: ${rx.doctor}`, 20, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`Prescription ID: ${rx.prescription_id}`, 20, 52);
        doc.text(`Date of Issue: ${rx.date}`, 20, 59);

        // Patient Info
        doc.setFont("helvetica", "bold");
        doc.text(`Patient Profile:`, 120, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`Name: ${selectedPatient.name}`, 120, 52);
        doc.text(`Age/Sex: ${selectedPatient.age}y / ${selectedPatient.gender}`, 120, 59);
        doc.text(`Phone: ${selectedPatient.phone}`, 120, 66);

        doc.line(20, 75, 190, 75);

        // Medication Title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Clinical Prescription", 20, 85);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Note: This is a digital prescription generated after node-verified vital checks.", 20, 92);

        // Table Header
        doc.setFillColor(243, 244, 246);
        doc.rect(20, 100, 170, 10, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Medication", 25, 106.5);
        doc.text("Dosage", 100, 106.5);
        doc.text("Duration", 160, 106.5);

        // Mocking medicine list if data structure allows (future integration)
        doc.setFont("helvetica", "normal");
        doc.text("Consultation medicine details are securely synced to the dispensary node.", 25, 120);
        doc.text("Please contact Village Node Operator for dispense details.", 25, 127);

        // Footer/Signature
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text("Electronically Signed by Nivaro Medical Mesh", 105, 270, { align: "center" });
        doc.text("This document is valid across all Nivaro nodes.", 105, 275, { align: "center" });

        doc.save(`Prescription_${rx.prescription_id}.pdf`);
    };

    const averages = useMemo(() => {
        if (vitalsHistory.length === 0) return { bp: 'N/A', glucose: 'N/A', spo2: 'N/A' };
        const sum = vitalsHistory.reduce((acc, curr) => ({
            sys: acc.sys + Number(curr.systolic || 0),
            dia: acc.dia + Number(curr.diastolic || 0),
            glu: acc.glu + Number(curr.glucose || 0),
            spo2: acc.spo2 + Number(curr.spo2 || 0)
        }), { sys: 0, dia: 0, glu: 0, spo2: 0 });

        const count = vitalsHistory.length;
        return {
            bp: `${Math.round(sum.sys / count)}/${Math.round(sum.dia / count)}`,
            glucose: `${Math.round(sum.glu / count)} mg/dL`,
            spo2: `${Math.round(sum.spo2 / count)}%`
        };
    }, [vitalsHistory]);

    const getRiskColor = (status) => {
        switch (status) {
            case 'critical': return '#ef4444';
            case 'high': return '#f59e0b';
            default: return '#10b981';
        }
    };

    if (viewMode === 'profile' && selectedPatient) {
        return (
            <div className="fade-in">
                <button
                    onClick={() => setViewMode('list')}
                    className="btn btn-secondary"
                    style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={18} /> Back to Archive
                </button>

                <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    {/* Patient Profile Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass-card">
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <User size={48} />
                                </div>
                                <h3 style={{ margin: 0 }}>{selectedPatient.name}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ID: {selectedPatient.id} | {selectedPatient.gender}, {selectedPatient.age}y</p>
                                <span style={{
                                    padding: '0.3rem 0.8rem', borderRadius: '1rem',
                                    fontSize: '0.75rem', fontWeight: 700, background: getRiskColor(selectedPatient.riskStatus) + '20',
                                    color: getRiskColor(selectedPatient.riskStatus), textTransform: 'uppercase'
                                }}>
                                    {selectedPatient.riskStatus} RISK
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                                    <b>{selectedPatient.phone}</b>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Village Node</span>
                                    <b>{selectedPatient.village}</b>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Last Consult</span>
                                    <b>{selectedPatient.lastVisit}</b>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Medical History</span>
                                    <b style={{ color: selectedPatient.medical_history ? 'var(--text)' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        {selectedPatient.medical_history || 'No established history'}
                                    </b>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card">
                            <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldCheck size={18} /> Clinical Safety Info
                            </h4>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <p>This patient is monitored at the <b>Village {selectedPatient.village}</b> node. All consultations are double-verified by on-site operators.</p>
                            </div>
                        </div>
                    </div>

                    {/* Vitals Trends & History */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-card">
                            <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp /> Clinical Vitals Trends (Historical)
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                    <Heart size={16} color="var(--danger)" style={{ marginBottom: '0.3rem' }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg BP</div>
                                    <div style={{ fontWeight: 800 }}>{averages.bp}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                    <Activity size={16} color="var(--primary)" style={{ marginBottom: '0.3rem' }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Glucose</div>
                                    <div style={{ fontWeight: 800 }}>{averages.glucose}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                    <Droplets size={16} color="var(--accent)" style={{ marginBottom: '0.3rem' }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg SpO2</div>
                                    <div style={{ fontWeight: 800 }}>{averages.spo2}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                    <History size={16} color="#64748b" style={{ marginBottom: '0.3rem' }} />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visits</div>
                                    <div style={{ fontWeight: 800 }}>{vitalsHistory.length}</div>
                                </div>
                            </div>

                            <VitalsTrendChart data={vitalsHistory} />

                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Historical Audit Log</h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '0.8rem' }}>Date</th>
                                                <th>Systolic</th>
                                                <th>Diastolic</th>
                                                <th>Glucose</th>
                                                <th>SpO2</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vitalsHistory.map((h, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                                    <td style={{ padding: '0.8rem' }}>{h.date}</td>
                                                    <td style={{ color: h.systolic >= 140 ? 'var(--danger)' : 'inherit', fontWeight: h.systolic >= 140 ? 700 : 400 }}>{h.systolic}</td>
                                                    <td style={{ color: h.diastolic >= 90 ? 'var(--danger)' : 'inherit', fontWeight: h.diastolic >= 90 ? 700 : 400 }}>{h.diastolic}</td>
                                                    <td>{h.glucose}</td>
                                                    <td style={{ color: h.spo2 < 95 ? 'var(--danger)' : 'inherit', fontWeight: h.spo2 < 95 ? 700 : 400 }}>{h.spo2}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Prescription Archive */}
                        <div className="glass-card">
                            <h3 style={{ margin: '0 0 1.5rem' }}>Prescription & Diagnosis Archive</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {rxHistory.map(rx => (
                                    <div key={rx.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '1.2rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '0.75rem'
                                    }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{ background: 'var(--primary-light)', padding: '0.8rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{rx.prescription_id} (Signed by {rx.doctor})</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Issued on {rx.date} | {rx.medicinesCount} Medications</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => downloadPDF(rx)}
                                            className="btn btn-secondary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                        >
                                            <Download size={16} /> DOWNLOAD PDF
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: '0.5rem' }}>Electronic Health Records (EHR)</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Deep Archive of Patient History | Cross-Node Medical Intelligence</p>

            {/* Filter Panel */}
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search by Name, Phone, or Patient ID..."
                        style={{ paddingLeft: '3rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ width: '250px' }}>
                    <select
                        style={{ marginBottom: 0 }}
                        value={villageFilter}
                        onChange={(e) => setVillageFilter(e.target.value)}
                    >
                        <option value="">All Village Nodes</option>
                        <option value="Alpha">Village Alpha</option>
                        <option value="Beta">Village Beta</option>
                        <option value="Gamma">Village Gamma</option>
                    </select>
                </div>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '45px' }}>
                    <Filter size={18} /> Advanced Filter
                </button>
            </div>

            {/* Patient Table */}
            <div className="glass-card" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: '#f8fafc', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <th style={{ padding: '1.2rem' }}>Patient Name</th>
                            <th>Age/Gender</th>
                            <th>Village Node</th>
                            <th>Last Visit</th>
                            <th>Risk Index</th>
                            <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                                <td style={{ padding: '1.2rem' }}>
                                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {p.id}</div>
                                </td>
                                <td>{p.age}y / {p.gender}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                        <MapPin size={14} color="var(--primary)" /> {p.village}
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Calendar size={14} color="var(--text-muted)" /> {p.lastVisit}
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.3rem 0.8rem', borderRadius: '1rem',
                                        fontSize: '0.75rem', fontWeight: 700,
                                        background: getRiskColor(p.riskStatus) + '15',
                                        color: getRiskColor(p.riskStatus)
                                    }}>
                                        {p.riskStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                                    <button
                                        onClick={() => handleViewProfile(p)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                    >
                                        Full EHR View <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {patients.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No patient records found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorPatientRecords;
