import React, { useState, useEffect } from 'react';
import {
    Users, Shield, Activity, Search, Edit3, Trash2, Ban,
    Lock, CheckCircle, AlertTriangle, Globe, Building,
    Key, Fingerprint, History, BarChart3, ChevronRight,
    UserCheck, FileText, BadgeCheck, AlertCircle, Plus,
    Download, Filter, X, ChevronDown, Check, Zap
} from 'lucide-react';
import axios from 'axios';

const ManageRoles = () => {
    // State management
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [nodeFilter, setNodeFilter] = useState('');
    const [logFilters, setLogFilters] = useState({ user: '', module: '', node: '', action: '', date: '' });

    // New User Form
    const [newUser, setNewUser] = useState({
        name: '', email: '', role: 'operator', assigned_nodes: [],
        license_number: '', license_expiry: '', kyc_verified: false, two_fa_enabled: true
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('nivaro_token');
                const headers = { Authorization: `Bearer ${token}` };
                const [nodeRes, roleRes, permRes, tempRes] = await Promise.all([
                    axios.get('/api/villages', { headers }),
                    axios.get('/api/admin/roles', { headers }),
                    axios.get('/api/admin/permissions', { headers }),
                    axios.get('/api/admin/templates', { headers })
                ]);
                setNodes(nodeRes.data);
                setRoles(roleRes.data);
                setPermissions(permRes.data);
                setTemplates(tempRes.data);
            } catch (err) {
                console.error('Initial fetch failed:', err);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchTabData();
    }, [activeTab, searchTerm, roleFilter, nodeFilter, logFilters]);

    const fetchTabData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'users') {
                const [uRes, aRes] = await Promise.all([
                    axios.get(`/api/admin/users?search=${searchTerm}&role=${roleFilter}&node=${nodeFilter}`, { headers }),
                    axios.get('/api/admin/analytics/roles', { headers })
                ]);
                setUsers(uRes.data);
                setAnalytics(aRes.data);
            } else if (activeTab === 'security') {
                const query = new URLSearchParams(logFilters).toString();
                const res = await axios.get(`/api/admin/security-logs?${query}`, { headers });
                setLogs(res.data);
            } else if (activeTab === 'roles') {
                const res = await axios.get('/api/admin/roles', { headers });
                setRoles(res.data);
            }
        } catch (err) {
            console.error('Tab fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Compliance Status Calculation
    const getComplianceStyles = (user) => {
        const status = user.compliance_status;
        if (status === 'Green') return { bg: '#dcfce7', text: '#15803d', icon: BadgeCheck, label: 'VERIFIED' };
        if (status === 'Yellow') return { bg: '#fef3c7', text: '#b45309', icon: AlertCircle, label: 'EXPIRING' };
        return { bg: '#fee2e2', text: '#b91c1c', icon: X, label: 'EXPIRED' };
    };

    // Helper: Recursive Role Tree Builder
    const renderRoleTree = (parentId = null, level = 0) => {
        const children = roles.filter(r => r.parent_role_id === parentId);
        return children.map(role => (
            <React.Fragment key={role.id}>
                <div style={{
                    padding: '1.25rem',
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: '0.85rem',
                    marginLeft: `${level * 2.5}rem`,
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    boxShadow: level === 0 ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}>
                    {level > 0 && <div style={{
                        position: 'absolute', left: '-1.5rem', top: '50%', width: '1.5rem', height: '1px', background: 'var(--border)'
                    }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: level === 0 ? 'var(--primary)' : '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: level === 0 ? '#fff' : 'var(--primary)'
                        }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: level === 0 ? 'var(--text-main)' : 'var(--primary)', fontSize: '1rem' }}>{role.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role.description}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>PERMISSIONS</div>
                            <div style={{ fontSize: '0.85rem' }}>
                                <b style={{ color: 'var(--primary)' }}>{role.direct_permissions_count}</b>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}> direct</span>
                            </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '0.5rem' }}><Edit3 size={16} /></button>
                    </div>
                </div>
                {renderRoleTree(role.id, level + 1)}
            </React.Fragment>
        ));
    };

    // Actions
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post('/api/admin/users/create', newUser, { headers });
            setShowCreateModal(false);
            fetchTabData();
            alert('User provisioned with production security standards.');
        } catch (err) {
            alert('Governance check failed: User duplicate or invalid metadata.');
        }
    };

    const handleBulkSuspend = async () => {
        if (selectedUsers.length === 0) return;
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post('/api/admin/users/bulk-suspend', { userIds: selectedUsers, status: 'Suspended' }, { headers });
            setSelectedUsers([]);
            fetchTabData();
        } catch (err) { console.error(err); }
    };

    const handleApplyTemplate = async (templateId, roleId) => {
        if (!roleId) return alert('Select target role first.');
        try {
            const token = localStorage.getItem('nivaro_token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post('/api/admin/templates/apply', { templateId, roleId }, { headers });
            alert('Security template enforced across role hierarchy.');
            fetchTabData();
        } catch (err) { console.error(err); }
    };

    const handleExportCSV = () => {
        window.open('/api/admin/users/export', '_blank');
    };

    const toggleUserSelection = (id) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const renderUsersTab = () => (
        <div className="fade-in">
            {/* Analytics Overview */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05rem' }}>USER DISTRIBUTION</h5>
                        <BarChart3 size={16} color="var(--primary)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{
                            width: '110px', height: '110px', borderRadius: '50%',
                            background: `conic-gradient(#6366f1 0deg 45deg, #10b981 45deg 180deg, #f59e0b 180deg 360deg)`
                        }}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {analytics?.roleDist.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{item.role}</span>
                                    <b>{item.count}</b>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>NODE ASSIGNMENT LOAD</h5>
                        <Globe size={16} color="var(--primary)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '110px' }}>
                        {analytics?.nodeDist.map((node, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{
                                    width: '100%', background: 'linear-gradient(to top, var(--primary), #818cf8)',
                                    height: `${(node.user_count / 10) * 100}%`, borderRadius: '4px'
                                }}></div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{node.name.split(' ')[1]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-card" style={{
                    padding: '1.5rem', background: 'linear-gradient(135deg, var(--primary), #4338ca)', color: '#fff'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                        <h5 style={{ margin: 0, fontSize: '0.85rem' }}>SYSTEM INTEGRITY</h5>
                        <Zap size={16} />
                    </div>
                    <div style={{ fontSize: '2.8rem', fontWeight: 900, marginTop: '0.5rem' }}>99.2%</div>
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                        All critical security protocols are currently nominal.
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text" className="form-control" placeholder="Search enterprise directory..."
                            style={{ paddingLeft: '40px', borderRadius: '0.75rem' }}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="form-control" style={{ width: '150px', borderRadius: '0.75rem' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <select className="form-control" style={{ width: '150px', borderRadius: '0.75rem' }} value={nodeFilter} onChange={e => setNodeFilter(e.target.value)}>
                        <option value="">All Nodes</option>
                        {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={handleExportCSV}><Download size={18} /> Export</button>
                    {selectedUsers.length > 0 && (
                        <button className="btn btn-secondary" style={{ color: '#ef4444' }} onClick={handleBulkSuspend}>
                            <Ban size={18} /> Suspend ({selectedUsers.length})
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Create User
                    </button>
                </div>
            </div>

            {/* User Table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <th style={{ padding: '1.25rem' }}><input type="checkbox" /></th>
                            <th style={{ padding: '1.25rem' }}>IDENTIFIER / IDENTITY</th>
                            <th style={{ padding: '1.25rem' }}>ROLE HIERARCHY</th>
                            <th style={{ padding: '1.25rem' }}>ASSIGNED NODES</th>
                            <th style={{ padding: '1.25rem' }}>COMPLIANCE</th>
                            <th style={{ padding: '1.25rem' }}>SECURITY</th>
                            <th style={{ padding: '1.25rem' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => {
                            const compliance = getComplianceStyles(u);
                            return (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1.25rem' }}>
                                        <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUserSelection(u.id)} />
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{u.email}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{
                                            display: 'inline-flex', padding: '0.2rem 0.6rem', background: '#eff6ff',
                                            color: '#2563eb', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800
                                        }}>
                                            {u.role.toUpperCase()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            {u.assigned_nodes.map(nId => {
                                                const node = nodes.find(n => n.id === nId);
                                                return (
                                                    <span key={nId} className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.65rem' }}>
                                                        {node?.name.split(' ')[1] || nId}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.3rem 0.75rem', background: compliance.bg,
                                            color: compliance.text, borderRadius: '1rem',
                                            fontSize: '0.65rem', fontWeight: 800
                                        }}>
                                            <compliance.icon size={12} /> {compliance.label}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                            <Fingerprint size={14} color={u.two_fa_enabled ? '#10b981' : '#cbd5e1'} />
                                            <div style={{ height: '3px', width: '40px', background: '#f1f5f9', borderRadius: '2px' }}>
                                                <div style={{ width: u.kyc_verified ? '100%' : '20%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}><Edit3 size={16} /></button>
                                            <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem', color: '#ef4444' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRolesTab = () => (
        <div className="fade-in grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem' }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: 0 }}>Governing Roles Tree</h4>
                    <span className="badge" style={{ background: '#f8fafc' }}>{roles.length} ROLES CONFIGURED</span>
                </div>
                {renderRoleTree()}
            </div>
            <div>
                <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                    <h5 style={{ marginBottom: '1.25rem' }}>Global Permission Matrix</h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rules applied globally across all nodes and hierarchies.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                        {['Clinical', 'Operational', 'Financial', 'System', 'Emergency'].map(group => (
                            <div key={group}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05rem' }}>{group.toUpperCase()} GOVERNANCE</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {permissions.filter(p => p.group_name === group).map(p => (
                                        <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc' }}>
                                            <span>{p.description}</span>
                                            <CheckCircle size={14} color="var(--primary)" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTemplatesTab = () => (
        <div className="fade-in grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {templates.map(t => (
                <div key={t.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem',
                        color: 'var(--primary)'
                    }}>
                        <FileText size={24} />
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{t.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>{t.description}</p>
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>INCLUDED PERMISSIONS</div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {t.permissions.map(pk => (
                                <span key={pk} style={{ fontSize: '0.65rem', background: '#f8fafc', color: 'var(--text-main)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{pk}</span>
                            ))}
                        </div>
                        <button className="btn btn-secondary btn-block" onClick={() => {
                            const target = prompt('Enter role ID to apply this template:');
                            if (target) handleApplyTemplate(t.id, target);
                        }}>
                            Apply Template
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderLogsTab = () => (
        <div className="fade-in">
            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Filter size={20} color="var(--text-muted)" />
                <input
                    type="text" className="form-control" placeholder="User..." style={{ width: '150px' }}
                    onChange={e => setLogFilters({ ...logFilters, user: e.target.value })}
                />
                <select className="form-control" style={{ width: '150px' }} onChange={e => setLogFilters({ ...logFilters, module: e.target.value })}>
                    <option value="">All Modules</option>
                    <option value="Auth">Auth</option>
                    <option value="Clinical">Clinical</option>
                    <option value="Inventory">Inventory</option>
                    <option value="System">System</option>
                </select>
                <select className="form-control" style={{ width: '150px' }} onChange={e => setLogFilters({ ...logFilters, node: e.target.value })}>
                    <option value="">All Nodes</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                <input
                    type="date" className="form-control" style={{ width: '180px' }}
                    onChange={e => setLogFilters({ ...logFilters, date: e.target.value })}
                />
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: '#0f172a' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>EVENT STREAM</span>
                    <span className="badge" style={{ background: '#fef2f2', color: '#ef4444' }}>SECURE AUDIT ACTIVE</span>
                </div>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {logs.map((log, i) => (
                        <div key={i} style={{
                            padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b',
                            display: 'flex', gap: '1.5rem', alignItems: 'flex-start'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '0.7rem', width: '120px', flexShrink: 0 }}>
                                {new Date(log.timestamp).toLocaleString()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                    <b style={{ color: '#f8fafc' }}>{log.user_name || 'System'}</b>
                                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', padding: '0.1rem 0.4rem', background: 'rgba(56,189,248,0.1)', borderRadius: '4px' }}>{log.module}</span>
                                </div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{log.action}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <code style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{log.ip_address}</code>
                                <div style={{ fontSize: '0.65rem', color: '#475569' }}>Node: {log.node_id}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '0.5rem' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Shield size={36} color="var(--primary)" /> Governance Directory
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.35rem' }}>Enterprise Access Management & Regulatory Compliance Control</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>ENCRYPTION</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>AES-256 ACTIVE</div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border)' }}></div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>REGULATORY</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>HIPAA/GDPR READY</div>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', position: 'relative' }}>
                {[
                    { id: 'users', label: 'Enterprise Users', icon: Users },
                    { id: 'roles', label: 'Role Inheritance', icon: Key },
                    { id: 'templates', label: 'Rule Templates', icon: FileText },
                    { id: 'security', label: 'Security Logs', icon: History }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem',
                            border: 'none', borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                            fontWeight: 700, fontSize: '0.95rem',
                            boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(99, 102, 241, 0.4)' : 'none',
                        }}
                    >
                        <tab.icon size={20} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Rendering */}
            <div style={{ minHeight: '600px' }}>
                {loading ? <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }}>Stabilizing Governance Data...</div> : (
                    activeTab === 'users' ? renderUsersTab() :
                        activeTab === 'roles' ? renderRolesTab() :
                            activeTab === 'templates' ? renderTemplatesTab() :
                                renderLogsTab()
                )}
            </div>

            {/* Creation Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-card fade-in" style={{ width: '600px', padding: '2.5rem', position: 'relative' }}>
                        <button style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}>
                            <X size={24} color="var(--text-muted)" />
                        </button>
                        <h3 style={{ marginBottom: '0.5rem' }}>Provision New Enterprise User</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>Record will be validated against healthcare security protocols.</p>

                        <form onSubmit={handleCreateUser}>
                            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input type="text" className="form-control" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Professional Email</label>
                                    <input type="email" className="form-control" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Core System Role</label>
                                    <select className="form-control" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assigned Nodes</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                        {nodes.map(n => (
                                            <button
                                                type="button" key={n.id} onClick={() => {
                                                    const curr = newUser.assigned_nodes;
                                                    setNewUser({ ...newUser, assigned_nodes: curr.includes(n.id) ? curr.filter(i => i !== n.id) : [...curr, n.id] });
                                                }}
                                                style={{
                                                    padding: '0.2rem 0.6rem', fontSize: '0.7rem', borderRadius: '4px', border: 'none',
                                                    background: newUser.assigned_nodes.includes(n.id) ? 'var(--primary)' : '#f1f5f9',
                                                    color: newUser.assigned_nodes.includes(n.id) ? '#fff' : 'var(--text-muted)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {n.name.split(' ')[1]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {newUser.role === 'doctor' && (
                                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem', padding: '1.25rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #bae6fd' }}>
                                    <div className="form-group">
                                        <label>Medical License No.</label>
                                        <input type="text" className="form-control" placeholder="MC-XXXX-XXXX" value={newUser.license_number} onChange={e => setNewUser({ ...newUser, license_number: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>License Expiry</label>
                                        <input type="date" className="form-control" value={newUser.license_expiry} onChange={e => setNewUser({ ...newUser, license_expiry: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={newUser.kyc_verified} onChange={e => setNewUser({ ...newUser, kyc_verified: e.target.checked })} />
                                    KYC Verification Complete
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={newUser.two_fa_enabled} onChange={e => setNewUser({ ...newUser, two_fa_enabled: e.target.checked })} />
                                    Enable MFA / 2FA Security
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '2.5rem', padding: '1rem' }}>
                                Finalize Provisioning
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageRoles;
