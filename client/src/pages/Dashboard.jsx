import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Activity,
    Pill,
    LogOut,
    ShieldCheck,
    ClipboardList,
    MessageSquare,
    Zap,
    History
} from 'lucide-react';

// Admin Components
import AdminDashboard from '../components/AdminDashboard';
import ManageRoles from '../components/ManageRoles';
import MedicineRegistry from '../components/MedicineRegistry';
import InventoryControl from '../components/InventoryControl';
import WhatsAppHub from '../components/WhatsAppHub';
import SystemAudit from '../components/SystemAudit';

// Other Views
import OperatorView from '../components/OperatorView';
import DoctorView from '../components/DoctorView';
import DoctorDashboard from '../components/DoctorDashboard';
import DoctorPatientRecords from '../components/DoctorPatientRecords';
import DoctorQueue from '../components/DoctorQueue';

const Dashboard = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active breadcrumb
    const pathParts = location.pathname.split('/').filter(p => p);
    const activeLabel = pathParts[pathParts.length - 1]?.toUpperCase() || 'OVERVIEW';

    // Role-based Navigation Config
    const navigationConfig = {
        admin: [
            { id: 'dashboard', label: 'Admin Panel', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
            { id: 'roles', label: 'Manage Roles', icon: <Users size={20} />, path: '/admin/roles' },
            { id: 'inventory', label: 'Inventory Control', icon: <Pill size={20} />, path: '/admin/inventory-control' },
            { id: 'whatsapp', label: 'WhatsApp Hub', icon: <MessageSquare size={20} />, path: '/admin/whatsapp' },
            { id: 'audit', label: 'System Audit', icon: <History size={20} />, path: '/admin/audit' }
        ],
        doctor: [
            { id: 'dashboard', label: 'Clinical Dashboard', icon: <LayoutDashboard size={20} />, path: '/doctor/dashboard' },
            { id: 'consultation', label: 'Consultation Hub', icon: <Activity size={20} />, path: '/doctor/queue' },
            { id: 'history', label: 'Patient Records', icon: <ClipboardList size={20} />, path: '/doctor/history' }
        ],
        operator: [
            { id: 'dashboard', label: 'Node Overview', icon: <LayoutDashboard size={20} />, path: '/operator/dashboard' },
            { id: 'registration', label: 'Register & Intake', icon: <Users size={20} />, path: '/operator/registration' },
            { id: 'inventory', label: 'Stock & Dispense', icon: <Pill size={20} />, path: '/operator/inventory' }
        ]
    };

    const navItems = navigationConfig[user.role] || [];

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">N</span>
                        <h2>Nivaro</h2>
                    </div>
                    <div className="role-badge">
                        <ShieldCheck size={14} />
                        <span>{user.role.toUpperCase()} ACCESS</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <button className="nav-item logout" onClick={onLogout}>
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="content-area">
                <header className="top-header">
                    <div className="breadcrumb">
                        <span>{user.role.toUpperCase()}</span> / <span>{activeLabel}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Session: <b>PRODUCTION SECURED</b>
                    </div>
                </header>

                <div className="fade-in" style={{ padding: '0 2rem 2rem' }}>
                    <Routes>
                        {/* Admin Routes */}
                        {user.role === 'admin' && (
                            <>
                                <Route path="dashboard" element={<AdminDashboard />} />
                                <Route path="roles" element={<ManageRoles />} />
                                <Route path="inventory-control" element={<InventoryControl />} />
                                <Route path="inventory" element={<MedicineRegistry />} />
                                <Route path="whatsapp" element={<WhatsAppHub />} />
                                <Route path="audit" element={<SystemAudit />} />
                                <Route path="*" element={<Navigate to="dashboard" />} />
                            </>
                        )}

                        {/* Doctor Routes */}
                        {user.role === 'doctor' && (
                            <>
                                <Route path="dashboard" element={<DoctorDashboard user={user} />} />
                                <Route path="queue" element={<DoctorQueue user={user} />} />
                                <Route path="consultation" element={<DoctorView user={user} />} />
                                <Route path="history" element={<DoctorPatientRecords user={user} />} />
                                <Route path="*" element={<Navigate to="dashboard" />} />
                            </>
                        )}

                        {/* Operator Routes */}
                        {user.role === 'operator' && (
                            <>
                                <Route path="dashboard" element={<OperatorView user={user} activeTab="overview" />} />
                                <Route path="registration" element={<OperatorView user={user} activeTab="registration" />} />
                                <Route path="inventory" element={<OperatorView user={user} activeTab="inventory" />} />
                                <Route path="*" element={<Navigate to="dashboard" />} />
                            </>
                        )}

                        {/* Root catch-all for /role */}
                        <Route path="" element={<Navigate to="dashboard" />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
