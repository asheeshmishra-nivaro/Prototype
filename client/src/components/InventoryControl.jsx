import React, { useState, useEffect } from 'react';
import {
    Package, RefreshCw, BarChart3, PieChart, AlertTriangle,
    ArrowRightLeft, ClipboardCheck, History, Search,
    Download, Printer, Filter, ChevronRight, TrendingUp,
    DollarSign, PackageCheck, AlertCircle, Clock, Globe,
    LayoutDashboard, Database, ChevronDown, Check, X,
    FileSpreadsheet, FileText, Zap, ShieldCheck
} from 'lucide-react';
import axios from 'axios';

const InventoryControl = () => {
    // State management
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);
    const [inventoryList, setInventoryList] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [nodeFilter, setNodeFilter] = useState('');

    // Transfer State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({
        medicine_id: '', batch_id: '', from_node: '', to_node: '', quantity: 0, reason: ''
    });

    // Reconcile State
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [reconcileData, setReconcileData] = useState({
        node_id: '', sku_id: '', physical_qty: 0, logical_qty: 0, notes: ''
    });

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const token = localStorage.getItem('nivaro_token');
                const headers = { Authorization: `Bearer ${token}` };
                const nRes = await axios.get('/api/villages', { headers });
                setNodes(nRes.data);
            } catch (err) { console.error(err); }
        };
        fetchMeta();
    }, []);

    useEffect(() => {
        fetchTabData();
    }, [activeTab, searchTerm, categoryFilter, nodeFilter]);

    const fetchTabData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'overview' || activeTab === 'analytics') {
                const [dRes, lRes] = await Promise.all([
                    axios.get('/api/admin/inventory/dashboard', { headers }),
                    activeTab === 'overview' ? axios.get(`/api/admin/inventory/list?search=${searchTerm}&category=${categoryFilter}&node=${nodeFilter}`, { headers }) : Promise.resolve({ data: [] })
                ]);
                setDashboard(dRes.data);
                if (activeTab === 'overview') setInventoryList(lRes.data);
            } else if (activeTab === 'ledger') {
                const res = await axios.get('/api/admin/inventory/ledger', { headers });
                setLedger(res.data);
            }
        } catch (err) {
            console.error('Fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleTransfer = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post('/api/admin/inventory/transfer', transferData, { headers });
            setShowTransferModal(false);
            fetchTabData();
            alert('Stock transfer completed and ledger updated.');
        } catch (err) {
            alert('Transfer failed: ' + (err.response?.data?.error || 'System error'));
        }
    };

    const handleReconcile = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post('/api/admin/inventory/reconcile', reconcileData, { headers });
            setShowReconcileModal(false);
            fetchTabData();
            alert('Reconciliation report filed.');
        } catch (err) { console.error(err); }
    };

    const renderDashboard = () => (
        <div className="fade-in">
            {/* Financial Intelligence Cards */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05rem' }}>TOTAL INVENTORY ASSETS</span>
                        <DollarSign size={16} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>₹{dashboard?.summary.total_assets.toLocaleString() || '0'}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981' }}>
                        <TrendingUp size={12} /> Potential Revenue: ₹{dashboard?.summary.potential_revenue.toLocaleString() || '0'}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05rem' }}>EXPIRY RISK (&lt;30D)</span>
                        <Clock size={16} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>₹{dashboard?.summary.expiring_30d_value.toLocaleString() || '0'}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                        {dashboard?.summary.expiring_30d_count} batches require immediate action
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05rem' }}>LOW STOCK ALERTS</span>
                        <AlertTriangle size={16} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>{dashboard?.summary.low_stock_count || '0'} SKUs</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>Below threshold across nodes</div>
                </div>
                <div className="glass-card" style={{
                    padding: '1.5rem', background: 'linear-gradient(135deg, var(--primary), #4338ca)', color: '#fff'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>NODE DENSITY</span>
                        <Globe size={16} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem' }}>{nodes.length} Nodes</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                        Active stock distribution monitoring
                    </div>
                </div>
            </div>

            {/* Heatmap & Distribution Overlay */}
            <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0 }}>Inventory Valuation Heatmap</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#dcfce7', color: '#15803d', borderRadius: '4px' }}>SAFE</span>
                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#fef3c7', color: '#b45309', borderRadius: '4px' }}>RISK</span>
                            <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>CRITICAL</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {inventoryList.map(sku => {
                            const expiry = sku.nearest_expiry ? new Date(sku.nearest_expiry) : null;
                            const diff = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : 999;
                            let color = '#dcfce7';
                            if (diff < 30) color = '#fee2e2';
                            else if (diff < 90) color = '#fef3c7';

                            return (
                                <div key={sku.id} style={{
                                    width: '14px', height: '14px', borderRadius: '3px', background: color,
                                    cursor: 'help'
                                }} title={`${sku.name}: Expiry in ${diff} days`} />
                            );
                        })}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1.25rem 0' }}>Active Node Load</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {dashboard?.node_distribution?.map(node => (
                            <div key={node.node_name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                                    <span>{node.node_name}</span>
                                    <b>₹{node.purchase_value.toLocaleString()}</b>
                                </div>
                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px' }}>
                                    <div style={{
                                        width: `${(node.purchase_value / (dashboard?.summary?.total_assets || 1)) * 100}%`,
                                        height: '100%', background: 'var(--primary)', borderRadius: '3px'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* List View */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text" className="form-control" placeholder="Search SKU, Batch, GenericName..."
                            style={{ paddingLeft: '40px', borderRadius: '0.75rem' }} value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost"><Filter size={18} /> Filters</button>
                    <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}><ArrowRightLeft size={18} /> Transfer</button>
                    <button className="btn btn-primary" onClick={() => setShowReconcileModal(true)}><ClipboardCheck size={18} /> Reconcile</button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <th style={{ padding: '1.25rem' }}>MEDICINE / SKU</th>
                            <th style={{ padding: '1.25rem' }}>CATEGORY</th>
                            <th style={{ padding: '1.25rem' }}>AVAILABILITY</th>
                            <th style={{ padding: '1.25rem' }}>AVG PRICE</th>
                            <th style={{ padding: '1.25rem' }}>VALUATION</th>
                            <th style={{ padding: '1.25rem' }}>NEAREST EXPIRY</th>
                            <th style={{ padding: '1.25rem' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventoryList.map(sku => {
                            const valuation = sku.total_stock * (sku.avg_price || 0);
                            const expiry = sku.nearest_expiry ? new Date(sku.nearest_expiry) : null;
                            const diff = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : 999;

                            return (
                                <tr key={sku.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{sku.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sku.sku_id} • {sku.strength} {sku.form}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>{sku.category}</span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ fontWeight: 700 }}>{sku.total_stock || 0} units</div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>₹{parseFloat(sku.avg_price || 0).toFixed(2)}</td>
                                    <td style={{ padding: '1.25rem' }}>₹{valuation.toLocaleString()}</td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ color: diff < 30 ? '#ef4444' : (diff < 90 ? '#f59e0b' : 'inherit') }}>
                                            {diff < 999 ? new Date(sku.nearest_expiry).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        {diff < 30 ? (
                                            <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <Zap size={10} /> CRITICAL
                                            </span>
                                        ) : <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 800 }}>OPTIMAL</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderLedger = () => (
        <div className="fade-in">
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: '#0f172a' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={20} color="#10b981" />
                        <span style={{ color: '#f8fafc', fontWeight: 800, letterSpacing: '0.05rem' }}>PERPETUAL INVENTORY LEDGER</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-ghost" style={{ color: '#94a3b8' }}><Download size={14} /> Export</button>
                        <button className="btn btn-sm btn-ghost" style={{ color: '#94a3b8' }}><Printer size={14} /> Print Statement</button>
                    </div>
                </div>
                <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                            <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.65rem' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>TIMESTAMP</th>
                                <th style={{ padding: '1rem 1.5rem' }}>ENTITY</th>
                                <th style={{ padding: '1rem 1.5rem' }}>NODE</th>
                                <th style={{ padding: '1rem 1.5rem' }}>TRANS-TYPE</th>
                                <th style={{ padding: '1rem 1.5rem' }}>QTY</th>
                                <th style={{ padding: '1rem 1.5rem' }}>OPERATOR / REASON</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map(entry => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.75rem' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ color: '#f1f5f9', fontWeight: 700 }}>{entry.medicine_name}</div>
                                        <div style={{ color: '#475569', fontSize: '0.65rem' }}>{entry.batch_id}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', color: '#cbd5e1' }}>{entry.node_name}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.6rem', fontWeight: 800,
                                            background: entry.movement_type === 'PURCHASE' ? '#065f46' : (entry.movement_type === 'TRANSFER' ? '#1e3a8a' : '#7f1d1d'),
                                            color: '#fff'
                                        }}>
                                            {entry.movement_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span style={{ color: entry.quantity > 0 ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                                            {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{entry.user_name || 'System'}</div>
                                        <div style={{ color: '#475569', fontSize: '0.7rem' }}>{entry.reason}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderAnalytics = () => (
        <div className="fade-in">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <PieChart color="var(--primary)" /> Asset Distribution
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BY NODE VALUATION</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {dashboard?.node_distribution?.map(node => (
                            <div key={node.node_name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 700 }}>{node.node_name}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>₹{node.purchase_value.toLocaleString()}</span>
                                </div>
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(node.purchase_value / (dashboard?.summary?.total_assets || 1)) * 100}%`,
                                        height: '100%', background: 'var(--primary)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BarChart3 color="#ef4444" /> Profit Potential
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REVENUE VS COST</span>
                    </div>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '2rem', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ height: '150px', width: '60px', background: 'var(--primary)', borderRadius: '0.5rem 0.5rem 0 0' }} />
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '0.5rem' }}>COST</div>
                            <div style={{ fontSize: '0.8rem' }}>₹{dashboard?.summary?.total_assets.toLocaleString() || '0'}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                height: `${((dashboard?.summary?.potential_revenue || 0) / (dashboard?.summary?.total_assets || 1)) * 150}px`,
                                width: '60px', background: '#10b981', borderRadius: '0.5rem 0.5rem 0 0'
                            }} />
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '0.5rem' }}>REVENUE</div>
                            <div style={{ fontSize: '0.8rem' }}>₹{dashboard?.summary?.potential_revenue.toLocaleString() || '0'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
                    }}>
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Expiry Capital at Risk</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>
                            You have <b>₹{dashboard?.summary?.expiring_30d_value.toLocaleString() || '0'}</b> worth of inventory expiring within the next 30 days.
                            Immediate discounting or redistribution is recommended to prevent asset loss.
                        </p>
                    </div>
                    <button className="btn btn-secondary" style={{ marginLeft: 'auto' }}>Generate Risk Report</button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '0.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Database size={36} color="var(--primary)" /> Inventory Lifecycle Governance
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Supply Chain Integrity & Pharmaceutical Distribution Control</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>NETWORK HEALTH</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>OPTIMAL</div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { id: 'overview', label: 'Inventory Overview', icon: LayoutDashboard },
                    { id: 'ledger', label: 'Stock Movements', icon: History },
                    { id: 'analytics', label: 'Financial Intelligence', icon: BarChart3 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem',
                            border: 'none', borderRadius: '1rem', cursor: 'pointer',
                            background: activeTab === tab.id ? 'var(--primary)' : '#fff',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                            fontWeight: 700, transition: 'all 0.3s'
                        }}
                    >
                        <tab.icon size={20} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Rendering */}
            {loading ? <div style={{ padding: '5rem', textAlign: 'center' }}>Synchronizing Stock Balances...</div> : (
                activeTab === 'overview' ? renderDashboard() :
                    activeTab === 'ledger' ? renderLedger() :
                        renderAnalytics()
            )}

            {/* Transfer Modal (Simplified for prototype) */}
            {showTransferModal && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ width: '500px', padding: '2rem' }}>
                        <h3>Inter-Node Stock Transfer</h3>
                        <form onSubmit={handleTransfer}>
                            <div className="form-group"><label>Medicine ID</label><input className="form-control" type="text" onChange={e => setTransferData({ ...transferData, medicine_id: e.target.value })} /></div>
                            <div className="form-group"><label>Source Node</label><input className="form-control" type="text" onChange={e => setTransferData({ ...transferData, from_node: e.target.value })} /></div>
                            <div className="form-group"><label>Destination Node</label><input className="form-control" type="text" onChange={e => setTransferData({ ...transferData, to_node: e.target.value })} /></div>
                            <div className="form-group"><label>Quantity</label><input className="form-control" type="number" onChange={e => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })} /></div>
                            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>Confirm Internal Transfer</button>
                            <button type="button" className="btn btn-ghost btn-block" onClick={() => setShowTransferModal(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryControl;
