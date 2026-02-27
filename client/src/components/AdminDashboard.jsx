import React, { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, Package, Activity, ShieldAlert,
    ShieldCheck, Users, BarChart3, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    CartesianGrid
} from 'recharts';

// Removed AnimatedValue to prize stability and responsiveness
const StaticValue = ({ value, prefix = '₹', suffix = '' }) => {
    const formatted = typeof value === 'number' || !isNaN(parseFloat(value))
        ? parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 0 })
        : value;
    return <span>{prefix}{formatted}{suffix}</span>;
}

const Sparkline = ({ data, color }) => {
    if (!data || data.length === 0) return <div style={{ height: '40px' }} />;
    const chartData = data.map((v, i) => ({ value: v, index: i }));
    return (
        <div style={{ height: '40px', width: '100%', marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.1} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const MetricCard = ({ icon: Icon, title, value, detail, color, trend, trendData, prefix = '₹', suffix = '' }) => {
    const trendIsPositive = trend?.startsWith('+');
    return (
        <div className="glass-card" style={{
            borderTop: `4px solid ${color}`,
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px'
        }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ background: `${color}15`, padding: '0.5rem', borderRadius: '0.6rem' }}>
                        <Icon size={20} color={color} />
                    </div>
                    {trend && (
                        <div style={{ textAlign: 'right' }}>
                            <span style={{
                                fontSize: '0.7rem',
                                color: trendIsPositive ? '#10b981' : '#ef4444',
                                fontWeight: 800,
                                padding: '0.2rem 0.4rem',
                                background: trendIsPositive ? '#dcfce7' : '#fee2e2',
                                borderRadius: '4px'
                            }}>
                                {trend}
                            </span>
                        </div>
                    )}
                </div>
                <h4 style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    margin: '0.75rem 0 0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 800
                }}>{title}</h4>
                <p style={{
                    fontSize: '2.1rem',
                    fontWeight: 900,
                    margin: 0,
                    letterSpacing: '-1px',
                    color: 'var(--text-main)'
                }}>
                    <StaticValue value={value} prefix={prefix} suffix={suffix} />
                </p>
            </div>

            <div>
                {trendData && <Sparkline data={trendData} color={color} />}
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>{detail}</p>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [audit, setAudit] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('Month');

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('nivaro_token');
            const [sumRes, audRes] = await Promise.all([
                axios.get(`/api/admin/dashboard-summary?period=${period.toLowerCase()}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/audit-feed', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
            ]);
            setSummary(sumRes.data);
            setAudit(audRes.data);
            setError(null);
        } catch (err) {
            console.error('Data Fetch Error:', err);
            setError('Operational Intelligence Sync Interrupted');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [period]);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 800 }}>SYNCHRONIZING NETWORK LEDGER...</div>;
    if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
    if (!summary) return <div style={{ padding: '4rem', textAlign: 'center' }}>INITIALIZING ASSETS...</div>;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: 900 }}>Strategic Operational Command</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Multi-Node Healthcare Network Resilience</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#fff', padding: '0.3rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    {['Today', 'Week', 'Month'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setLoading(true); setPeriod(t); }}
                            style={{
                                padding: '0.4rem 1.25rem', border: 'none', borderRadius: '0.4rem', fontSize: '0.75rem', cursor: 'pointer',
                                background: period === t ? 'var(--primary)' : 'transparent',
                                color: period === t ? '#fff' : 'var(--text-muted)',
                                transition: 'all 0.2s', fontWeight: 800
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
                <MetricCard icon={DollarSign} title="Total Revenue" value={summary?.revenue?.total || 0} detail={`Target: ₹29.56L • ${summary?.revenue?.growth || '0%'}`} color="var(--primary)" trend={summary?.revenue?.growth} trendData={summary?.revenue?.trend} />
                <MetricCard icon={TrendingUp} title="Net Margin" value={summary?.netMargin?.total || 0} detail={`Efficiency: ${summary?.netMargin?.percent || '0%'}`} color="#10b981" trend={summary?.netMargin?.percent} />
                <MetricCard icon={Package} title="Inventory Assets" value={summary?.inventoryValue || 0} detail="Live Node Valuation" color="#8b5cf6" />
                <MetricCard icon={Activity} title="Active Sessions" value={summary?.activeConsultations || 0} detail="Live Clinical Load" color="#0ea5e9" prefix="" />
                <MetricCard icon={ShieldAlert} title="Uptime Index" value={99.9} detail="Network Reliability" color="#f59e0b" prefix="" suffix="%" />
                <MetricCard icon={ShieldCheck} title="Integrity Score" value={`${summary?.integrityScore || 100}`} detail="Compliance Index" color="#10b981" prefix="" suffix="%" />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BarChart3 size={20} color="var(--primary)" /> Operational Financial Breakdown
                        </h3>
                        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenue Sources</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {[
                                        { label: 'Consultations', val: summary?.breakdown?.consultations || 0, color: '#6366f1', avg: '₹150 avg' },
                                        { label: 'Medicine Sales', val: summary?.breakdown?.medicines || 0, color: '#10b981', avg: '₹100-500 var' },
                                        { label: 'Other Services', val: ((summary?.revenue?.total || 0) * 0.05), color: '#8b5cf6' }
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                                <div><span style={{ fontWeight: 600 }}>{item.label}</span></div>
                                                <span style={{ fontWeight: 800 }}>₹{(item.val || 0).toLocaleString()}</span>
                                            </div>
                                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                                <div style={{ width: `${Math.min(100, ((item.val || 0) / (summary?.revenue?.total || 1)) * 100)}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Margin Leakage Analysis</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {[
                                        { label: 'Inventory Cost', val: summary?.breakdown?.inventoryCost || 0, color: '#ef4444' },
                                        { label: 'Operating Cost', val: summary?.breakdown?.operatingCost || 0, color: '#f59e0b' },
                                        { label: 'Net Profit', val: summary?.netMargin?.total || 0, color: '#10b981' }
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                                <span style={{ fontWeight: 600 }}>{item.label}</span>
                                                <span style={{ fontWeight: 800 }}>₹{(item.val || 0).toLocaleString()}</span>
                                            </div>
                                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                                <div style={{ width: `${Math.min(100, ((item.val || 0) / ((summary?.breakdown?.inventoryCost || 0) + (summary?.breakdown?.operatingCost || 0) + (summary?.netMargin?.total || 1))) * 100)}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <PieChart size={20} color="var(--primary)" /> Regional Revenue Distribution
                        </h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summary?.nodePerformance || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={60} isAnimationActive={false}>
                                        {(summary?.nodePerformance || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Practitioner Load</h3>
                            <Users size={18} color="var(--text-muted)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800 }}>Average Rev / Node</p>
                                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>₹{((summary?.revenue?.total || 0) / 3).toLocaleString()}</p>
                                </div>
                                <TrendingUp color="#10b981" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 800 }}>Recent Governance Events</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {audit && audit.slice(0, 5).map(log => (
                                <div key={log.id} style={{ fontSize: '0.75rem', borderLeft: '2px solid var(--primary)', paddingLeft: '0.75rem' }}>
                                    <div style={{ fontWeight: 800 }}>{log.action}</div>
                                    <div style={{ color: 'var(--text-muted)' }}>{log.role}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
