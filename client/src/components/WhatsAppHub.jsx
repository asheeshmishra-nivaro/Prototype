import React, { useState, useEffect } from 'react';
import {
    Zap, MessageSquare, History, BarChart3, Settings, ShieldCheck,
    Plus, Trash2, CheckCircle, AlertCircle, Clock, Search, Filter,
    Eye, Send, Terminal, ShieldAlert
} from 'lucide-react';
import axios from 'axios';

const WhatsAppHub = () => {
    const [activeTab, setActiveTab] = useState('analytics'); // Default to analytics for this demo
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('today');
    const [templates, setTemplates] = useState([]);
    const [rules, setRules] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [emergencyLogs, setEmergencyLogs] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [logs, setLogs] = useState([]);
    const [webhookLogs, setWebhookLogs] = useState([]);
    const [systemHealth, setSystemHealth] = useState({ api: 'Connected', webhook: 'Live', lastSync: 'Just now', queue: 0 });
    const [showNewTemplate, setShowNewTemplate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: 'Reminder' });

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s auto-refresh
        return () => clearInterval(interval);
    }, [activeTab, timeFilter]);

    // System Health Auto-update (every 30s)
    useEffect(() => {
        const healthInterval = setInterval(() => {
            setSystemHealth(prev => ({
                ...prev,
                lastSync: 'Less than 1 min ago',
                queue: Math.floor(Math.random() * 40) // Simulated queue load
            }));
        }, 30000);
        return () => clearInterval(healthInterval);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'analytics') {
                const [anaRes, emRes, campRes] = await Promise.all([
                    axios.get(`/api/whatsapp/analytics?filter=${timeFilter}`, { headers }),
                    axios.get('/api/whatsapp/emergency-logs', { headers }),
                    axios.get('/api/whatsapp/campaigns', { headers })
                ]);
                setAnalytics(anaRes.data);
                setEmergencyLogs(emRes.data);
                setCampaigns(campRes.data);
            } else if (activeTab === 'activity') {
                const res = await axios.get('/api/admin/audit-feed', { headers });
                setLogs(res.data.filter(l => l.entity === 'whatsapp' || l.action.toLowerCase().includes('whatsapp')));
            } else if (activeTab === 'templates') {
                const res = await axios.get('/api/whatsapp/templates', { headers });
                setTemplates(res.data);
            } else if (activeTab === 'automation') {
                const res = await axios.get('/api/whatsapp/rules', { headers });
                setRules(res.data);
            } else if (activeTab === 'debug') {
                const res = await axios.get('/api/whatsapp/webhook-logs', { headers });
                setWebhookLogs(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch WhatsApp data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('nivaro_token');
            await axios.post('/api/whatsapp/templates', newTemplate, { headers: { Authorization: `Bearer ${token}` } });
            setShowNewTemplate(false);
            setNewTemplate({ name: '', content: '', category: 'Reminder' });
            fetchData();
        } catch (err) { alert('Failed to create template'); }
    };

    const toggleRule = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('nivaro_token');
            await axios.post('/api/whatsapp/rules/toggle', { id, is_active: !currentStatus }, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) { alert('Failed to toggle rule'); }
    };

    const EngagementChart = ({ data }) => {
        if (!data || data.length === 0) return null;
        const maxVal = Math.max(...data.map(d => d.sent)) * 1.2;
        const width = 400;
        const height = 150;
        const pointsSent = data.map((d, i) => `${(i * width) / (data.length - 1)},${height - (d.sent / maxVal) * height}`).join(' ');
        const pointsRead = data.map((d, i) => `${(i * width) / (data.length - 1)},${height - (d.read / maxVal) * height}`).join(' ');

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gradSent" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>
                <polyline fill="url(#gradSent)" stroke="none" points={`0,${height} ${pointsSent} ${width},${height}`} />
                <polyline fill="none" stroke="var(--primary)" strokeWidth="2" points={pointsSent} />
                <polyline fill="none" stroke="#10b981" strokeWidth="2" points={pointsRead} strokeDasharray="4" />
                {data.map((d, i) => (
                    <circle key={i} cx={(i * width) / (data.length - 1)} cy={height - (d.sent / maxVal) * height} r="3" fill="var(--primary)" />
                ))}
            </svg>
        );
    };

    const CategoryDonut = ({ categories }) => {
        if (!categories) return null;
        let cumulative = 0;
        const total = categories.reduce((sum, c) => sum + c.count, 0);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{
                    width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(
                    ${categories.map((c, i) => {
                        const start = (cumulative / total) * 360;
                        const end = ((cumulative + c.count) / total) * 360;
                        cumulative += c.count;
                        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                        return `${colors[i % colors.length]} ${start}deg ${end}deg`;
                    }).join(', ')}
                )` }}>
                    <div style={{ margin: '20px', width: '80px', height: '80px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>MSG BREAKDOWN</div>
                </div>
                <div style={{ flex: 1 }}>
                    {categories.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }}></div>
                                <span>{c.name}</span>
                            </div>
                            <b>{((c.count / total) * 100).toFixed(0)}%</b>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Clinical Communications...</div>;

        switch (activeTab) {
            case 'activity':
                return (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h4>Real-time Activity Log</h4>
                            <div className="badge" style={{ background: '#dcfce7', color: '#059669' }}>LIVE MONITORING</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {logs.length > 0 ? logs.map(log => (
                                <div key={log.id} className="glass-card" style={{ padding: '0.75rem', background: '#fff', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <b style={{ color: 'var(--primary)' }}>{log.action}</b>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p style={{ margin: '0.25rem 0 0' }}>{log.prev_value || 'System notification sent to patient node.'}</p>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No recent WhatsApp activity detected.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'templates':
                return (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h4>Message Templates</h4>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowNewTemplate(true)}><Plus size={16} /> New Template</button>
                        </div>

                        {showNewTemplate && (
                            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--primary)' }}>
                                <form onSubmit={handleCreateTemplate}>
                                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Template Name</label>
                                            <input type="text" className="form-control" placeholder="e.g. Day 3 Follow-up" required
                                                value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
                                            <select className="form-control" value={newTemplate.category} onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}>
                                                <option>Reminder</option>
                                                <option>Alert</option>
                                                <option>Utility</option>
                                                <option>Emergency</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Content (Use &#123;&#123;name&#125;&#125; for patient name)</label>
                                        <textarea className="form-control" style={{ minHeight: '80px' }} required
                                            value={newTemplate.content} onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowNewTemplate(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary">Create Template</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {templates.map(t => (
                                <div key={t.id} className="glass-card" style={{ background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{t.category}</span>
                                            <h4 style={{ margin: '0.2rem 0' }}>{t.name}</h4>
                                        </div>
                                        <div className="badge" style={{ background: t.status === 'approved' ? '#dcfce7' : '#fef3c7', color: t.status === 'approved' ? '#059669' : '#d97706' }}>
                                            {t.status.toUpperCase()}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
                                        "{t.content}"
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}><Eye size={14} /> Preview</button>
                                        <button className="btn btn-danger btn-sm" style={{ width: '40px' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'automation':
                return (
                    <div className="fade-in">
                        <h4>Clinical Automation Rules</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Configuring event-driven patient communication flows.</p>

                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>Trigger Event</th>
                                        <th style={{ padding: '1rem' }}>Delay</th>
                                        <th style={{ padding: '1rem' }}>Template</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map(rule => (
                                        <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Zap size={14} color="var(--primary)" />
                                                    <span style={{ fontWeight: 600 }}>{rule.trigger_event.replace('_', ' ').toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{rule.delay_days} Days</td>
                                            <td style={{ padding: '1rem' }}>{rule.template_name}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div className="badge" style={{ background: rule.is_active ? '#dcfce7' : '#f1f5f9', color: rule.is_active ? '#059669' : '#64748b' }}>
                                                    {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button className={`btn btn-sm ${rule.is_active ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleRule(rule.id, rule.is_active)}>
                                                    {rule.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'analytics':
                const deliveryRate = analytics?.summary?.total_sent > 0 ? (analytics.summary.total_delivered / analytics.summary.total_sent * 100) : 0;
                const readRate = parseFloat(analytics?.engagementRate || 0);

                return (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4>Strategic Activity Analytics</h4>
                            <div className="glass-card" style={{ padding: '0.25rem', display: 'flex', gap: '0.25rem', borderRadius: '0.6rem' }}>
                                {['today', 'week', 'month'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTimeFilter(f)}
                                        style={{
                                            padding: '0.4rem 1rem', border: 'none', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 700,
                                            background: timeFilter === f ? 'var(--primary)' : 'transparent',
                                            color: timeFilter === f ? '#fff' : 'var(--text-muted)', cursor: 'pointer'
                                        }}
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="glass-card" style={{ background: 'var(--primary)', color: '#fff' }}>
                                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>SENT {timeFilter.toUpperCase()}</span>
                                <h3 style={{ margin: '0.25rem 0' }}>{analytics?.summary?.total_sent?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="glass-card" style={{ borderLeft: deliveryRate < 95 ? '4px solid var(--warning)' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DELIVERY RATE</span>
                                    {deliveryRate < 95 && <AlertCircle size={14} color="var(--warning)" />}
                                </div>
                                <h3 style={{ margin: '0.25rem 0', color: deliveryRate > 95 ? '#10b981' : 'var(--warning)' }}>{deliveryRate.toFixed(1)}%</h3>
                            </div>
                            <div className="glass-card">
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>READ RATE</span>
                                <h3 style={{ margin: '0.25rem 0', color: readRate > 80 ? '#10b981' : 'var(--primary)' }}>{readRate.toFixed(1)}%</h3>
                                {readRate > 80 && <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 800 }}>OPTIMAL ENGAGEMENT</div>}
                            </div>
                            <div className={`glass-card ${analytics?.summary?.emergency_count > 0 ? 'red-glow' : ''}`} style={{ borderLeft: '4px solid var(--danger)' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EMERGENCY ALERTS</span>
                                <h3 style={{ margin: '0.25rem 0', color: 'var(--danger)' }}>{analytics?.summary?.emergency_count || 0}</h3>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid" style={{ gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="glass-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h5>Engagement: Sent vs Read</h5>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '10px', height: '2px', background: 'var(--primary)' }}></div> SENT</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '10px', height: '2px', background: '#10b981', borderStyle: 'dashed' }}></div> READ</span>
                                    </div>
                                </div>
                                <EngagementChart data={analytics?.engagement} />
                            </div>
                            <div className="glass-card">
                                <h5 style={{ marginBottom: '1rem' }}>Category Breakdown</h5>
                                <CategoryDonut categories={analytics?.categories} />
                            </div>
                        </div>

                        {/* Pipeline and Campaigns */}
                        <div className="grid" style={{ gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="glass-card">
                                <h5>Delivery Pipeline</h5>
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {['Sent', 'Delivered', 'Read', 'Failed'].map(status => {
                                        const count = analytics?.summary?.[`total_${status.toLowerCase()}`] || 0;
                                        const pct = analytics?.summary?.total_sent > 0 ? (count / analytics.summary.total_sent * 100) : 0;
                                        return (
                                            <div key={status}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                                                    <span>{status}</span>
                                                    <b>{count} ({pct.toFixed(1)}%)</b>
                                                </div>
                                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', width: `${pct}%`, transition: 'width 1s ease-in-out',
                                                        background: status === 'Failed' ? 'var(--danger)' : status === 'Read' ? '#10b981' : (status === 'Delivered' ? '#6366f1' : 'var(--primary)')
                                                    }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h5 style={{ margin: 0 }}>Active Broadcast Campaigns</h5>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>TRACKING DISABLED IN MOCK</span>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Campaign</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>Sent</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>Deliv.</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>Read</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>CTR</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map(c => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{c.name}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{c.sent_count}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{((c.delivered_count / c.sent_count) * 100).toFixed(0)}%</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{((c.read_count / c.delivered_count) * 100).toFixed(0)}%</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>{((c.clicked_count / c.read_count) * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Emergency Alerts */}
                        <div className="glass-card">
                            <h5 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldAlert size={18} color="var(--danger)" /> Recent Critical Emergency Alerts
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {emergencyLogs.map(log => (
                                    <div key={log.id} style={{ padding: '1rem', background: '#fff1f2', borderRadius: '0.6rem', border: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <b style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Patient ID: {log.patient_id}</b>
                                                <span className="badge" style={{ background: '#be123c', color: '#fff', fontSize: '0.6rem' }}>ESCALATED</span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', margin: '0.2rem 0', fontWeight: 500 }}>Vitals Threshold Exceeded: SpO2 &lt; 90% | Notified Dr. Sen </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}><Clock size={10} /> {new Date(log.timestamp).toLocaleString()}</div>
                                            <button className="btn btn-sm btn-danger" style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}>View Emergency Case</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'debug':
                return (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h4>Webhook Debug Terminal</h4>
                            <button className="btn btn-secondary btn-sm" onClick={fetchData}><Terminal size={14} /> Refresh Logs</button>
                        </div>
                        <div style={{ background: '#0f172a', color: '#94a3b8', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', minHeight: '400px', overflowY: 'auto' }}>
                            {webhookLogs.map(log => (
                                <div key={log.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                                        <span>[POST] /api/whatsapp/webhook</span>
                                        <span>{new Date(log.processed_at).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', margin: '0.5rem 0' }}>
                                        <span style={{ color: log.signature_verified ? '#4ade80' : '#f87171' }}>● SIGNATURE_{log.signature_verified ? 'VERIFIED' : 'FAILED'}</span>
                                        <span style={{ color: '#fbbf24' }}>● STATUS_200_OK</span>
                                    </div>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>
                                        {JSON.stringify(JSON.parse(log.payload), null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="glass-card fade-in" style={{ padding: '1.5rem' }}>
            {/* System Health Section */}
            <div style={{ background: '#f8fafc', margin: '-1.5rem -1.5rem 1.5rem -1.5rem', padding: '0.8rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                        API: <b>{systemHealth.api}</b>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                        Webhook: <b>{systemHealth.webhook}</b>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>Last Sync: <b>{systemHealth.lastSync}</b></span>
                </div>
                <div>
                    Message Queue Load: <b style={{ color: systemHealth.queue > 80 ? 'var(--danger)' : 'var(--primary)' }}>{systemHealth.queue} pending</b>
                </div>
            </div>

            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MessageSquare size={28} color="var(--primary)" /> Clinical Communication Hub
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>WhatsApp Business Strategic Control Center</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>SERVICE ACCOUNT</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Nivaro-Tech-PROD</div>
                    </div>
                    <div style={{ height: '40px', width: '1px', background: 'var(--border)' }}></div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span className="badge" style={{ background: '#dcfce7', color: '#059669', height: 'fit-content' }}>WEBHOOK ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                {[
                    { id: 'activity', label: 'Monitor', icon: History },
                    { id: 'templates', label: 'Templates', icon: Settings },
                    { id: 'automation', label: 'Automation', icon: Zap },
                    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                    { id: 'debug', label: 'Debug', icon: Terminal }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem',
                            border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                            background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                            fontWeight: 600, fontSize: '0.9rem'
                        }}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '500px' }}>
                {renderTabContent()}
            </div>

            {/* Floating Action Button (Broadcast) */}
            <button className="btn btn-primary" style={{
                position: 'fixed', bottom: '2rem', right: '2rem', borderRadius: '2rem',
                padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100
            }}>
                <Send size={20} /> New Broadcast
            </button>

            <style>{`
                .red-glow {
                    box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
                    border: 1px solid rgba(239, 68, 68, 0.5) !important;
                    animation: pulse-red 2s infinite;
                }
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); }
                    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
                    100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); }
                }
            `}</style>
        </div>
    );
};

export default WhatsAppHub;
