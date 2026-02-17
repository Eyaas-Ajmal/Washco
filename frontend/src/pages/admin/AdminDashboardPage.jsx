import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
    getDashboard,
    getTenants,
    approveTenant,
    suspendTenant,
    getUsers,
    deleteUser,
    createManager,
    getAuditLogs,
} from '../../api/admin.api';
import {
    LayoutDashboard,
    Building2,
    Users,
    ScrollText,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
    DollarSign,
    CalendarDays,
    UserCheck,
    Store,
    Ban,
    Clock,
    TrendingUp,
    Trash2,
    UserPlus,
    Eye,
    EyeOff,
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dashboard stats
    const [stats, setStats] = useState(null);

    // Tenants
    const [tenants, setTenants] = useState([]);
    const [tenantFilter, setTenantFilter] = useState('');
    const [tenantSearch, setTenantSearch] = useState('');
    const [tenantPage, setTenantPage] = useState(1);

    // Users
    const [users, setUsers] = useState([]);
    const [userFilter, setUserFilter] = useState('');
    const [userPage, setUserPage] = useState(1);

    // Audit Logs
    const [logs, setLogs] = useState([]);
    const [logPage, setLogPage] = useState(1);

    // Create Manager form
    const [showCreateManager, setShowCreateManager] = useState(false);
    const [managerForm, setManagerForm] = useState({ email: '', password: '', fullName: '', phone: '' });
    const [creatingManager, setCreatingManager] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (activeTab === 'tenants') loadTenants();
        else if (activeTab === 'users') loadUsers();
        else if (activeTab === 'logs') loadLogs();
    }, [activeTab, tenantFilter, tenantSearch, tenantPage, userFilter, userPage, logPage]);

    // ---- Loaders ----
    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await getDashboard();
            setStats(data);
        } catch (err) {
            console.error('Dashboard load failed:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadTenants = async () => {
        try {
            const data = await getTenants({
                status: tenantFilter || undefined,
                search: tenantSearch || undefined,
                page: tenantPage,
            });
            setTenants(data?.tenants || []);
        } catch (err) {
            console.error('Tenants load failed:', err);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await getUsers({ role: userFilter || undefined, page: userPage });
            setUsers(data?.users || []);
        } catch (err) {
            console.error('Users load failed:', err);
        }
    };

    const loadLogs = async () => {
        try {
            const data = await getAuditLogs({ page: logPage });
            setLogs(data?.logs || []);
        } catch (err) {
            console.error('Logs load failed:', err);
        }
    };

    // ---- Handlers ----
    const handleApproveTenant = async (id) => {
        try {
            await approveTenant(id);
            setSuccess('Tenant approved!');
            loadTenants();
            loadDashboard();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve tenant');
        }
    };

    const handleSuspendTenant = async (id) => {
        if (!confirm('Are you sure you want to suspend this tenant?')) return;
        try {
            await suspendTenant(id);
            setSuccess('Tenant suspended');
            loadTenants();
            loadDashboard();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to suspend tenant');
        }
    };

    const handleDeleteUser = async (user) => {
        if (!confirm(`Are you sure you want to permanently remove ${user.full_name || user.email}? This will delete all their data including bookings.`)) return;
        try {
            await deleteUser(user.id);
            setSuccess(`User ${user.email} removed successfully`);
            loadUsers();
            loadDashboard();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove user');
        }
    };

    const handleCreateManager = async (e) => {
        e.preventDefault();
        if (managerForm.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setCreatingManager(true);
        try {
            await createManager(managerForm);
            setSuccess(`Manager account created for ${managerForm.email}`);
            setManagerForm({ email: '', password: '', fullName: '', phone: '' });
            setShowCreateManager(false);
            loadUsers();
            loadDashboard();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create manager');
        } finally {
            setCreatingManager(false);
        }
    };

    // Auto-clear messages
    useEffect(() => {
        if (success || error) {
            const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
            return () => clearTimeout(t);
        }
    }, [success, error]);

    if (loading) return <div className="adm-loading"><div className="adm-spinner" /></div>;

    return (
        <div className="adm">
            {/* Toast */}
            {error && <div className="adm-toast error"><XCircle size={16} />{error}</div>}
            {success && <div className="adm-toast success"><CheckCircle2 size={16} />{success}</div>}

            {/* Header */}
            <div className="adm-header">
                <h1><ShieldCheck size={24} /> Admin Dashboard</h1>
                <p>Oversee car washes, users, and platform activity</p>
            </div>

            {/* Tabs */}
            <div className="adm-tabs">
                {[
                    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
                    { key: 'tenants', label: 'Car Washes', icon: <Building2 size={15} /> },
                    { key: 'users', label: 'Users', icon: <Users size={15} /> },
                    { key: 'logs', label: 'Audit Logs', icon: <ScrollText size={15} /> },
                ].map(t => (
                    <button key={t.key} className={`adm-tab ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.key)}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ====== OVERVIEW ====== */}
            {activeTab === 'overview' && (
                <>
                    <div className="adm-stats">
                        <div className="adm-stat">
                            <div className="adm-stat-icon indigo"><Store size={22} /></div>
                            <div className="adm-stat-info">
                                <span className="adm-stat-value">{stats?.tenants?.total || 0}</span>
                                <span className="adm-stat-label">Total Car Washes</span>
                            </div>
                        </div>
                        <div className="adm-stat">
                            <div className="adm-stat-icon amber"><AlertCircle size={22} /></div>
                            <div className="adm-stat-info">
                                <span className="adm-stat-value">{stats?.tenants?.pending || 0}</span>
                                <span className="adm-stat-label">Pending Approval</span>
                            </div>
                        </div>
                        <div className="adm-stat">
                            <div className="adm-stat-icon cyan"><Users size={22} /></div>
                            <div className="adm-stat-info">
                                <span className="adm-stat-value">{stats?.users?.total || 0}</span>
                                <span className="adm-stat-label">Total Users</span>
                            </div>
                        </div>
                        <div className="adm-stat">
                            <div className="adm-stat-icon emerald"><DollarSign size={22} /></div>
                            <div className="adm-stat-info">
                                <span className="adm-stat-value">${stats?.bookings?.totalRevenue?.toFixed(2) || '0.00'}</span>
                                <span className="adm-stat-label">Total Revenue</span>
                            </div>
                        </div>
                    </div>

                    <div className="adm-grid-2">
                        {/* Tenant Breakdown */}
                        <div className="adm-card">
                            <h2><Building2 size={18} /> Car Wash Breakdown</h2>
                            <div className="adm-mini-stats">
                                <div className="adm-mini-stat">
                                    <span className="adm-mini-stat-value" style={{ color: '#10b981' }}>{stats?.tenants?.approved || 0}</span>
                                    <span className="adm-mini-stat-label">Approved</span>
                                </div>
                                <div className="adm-mini-stat">
                                    <span className="adm-mini-stat-value" style={{ color: '#eab308' }}>{stats?.tenants?.pending || 0}</span>
                                    <span className="adm-mini-stat-label">Pending</span>
                                </div>
                                <div className="adm-mini-stat">
                                    <span className="adm-mini-stat-value" style={{ color: '#ef4444' }}>{stats?.tenants?.suspended || 0}</span>
                                    <span className="adm-mini-stat-label">Suspended</span>
                                </div>
                            </div>
                        </div>

                        {/* User Breakdown */}
                        <div className="adm-card">
                            <h2><Users size={18} /> User Breakdown</h2>
                            <div className="adm-mini-stats">
                                <div className="adm-mini-stat">
                                    <span className="adm-mini-stat-value" style={{ color: '#3b82f6' }}>{stats?.users?.customers || 0}</span>
                                    <span className="adm-mini-stat-label">Customers</span>
                                </div>
                                <div className="adm-mini-stat">
                                    <span className="adm-mini-stat-value" style={{ color: '#8b5cf6' }}>{stats?.users?.managers || 0}</span>
                                    <span className="adm-mini-stat-label">Managers</span>
                                </div>
                                <div className="adm-mini-stat">
                                    <span className="adm-mini-stat-value" style={{ color: '#22d3ee' }}>{stats?.bookings?.total || 0}</span>
                                    <span className="adm-mini-stat-label">Total Bookings</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ====== TENANTS ====== */}
            {activeTab === 'tenants' && (
                <div className="adm-card">
                    <h2><Building2 size={18} /> Manage Car Washes</h2>

                    <div className="adm-search">
                        <Search size={15} className="adm-search-icon" />
                        <input type="text" placeholder="Search car washes..."
                            value={tenantSearch}
                            onChange={e => { setTenantSearch(e.target.value); setTenantPage(1); }} />
                    </div>

                    <div className="adm-filters">
                        {['', 'pending', 'approved', 'suspended'].map(f => (
                            <button key={f} className={`adm-filter ${tenantFilter === f ? 'active' : ''}`}
                                onClick={() => { setTenantFilter(f); setTenantPage(1); }}>
                                {f === '' ? 'All' : f}
                            </button>
                        ))}
                    </div>

                    {tenants.length === 0 ? (
                        <div className="adm-empty">
                            <div className="adm-empty-icon">🏢</div>
                            No car washes found
                        </div>
                    ) : (
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Address</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenants.map(t => (
                                        <tr key={t.id}>
                                            <td><strong>{t.name}</strong></td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.address || '—'}</td>
                                            <td>
                                                <div className="adm-cell-stack">
                                                    <strong>{t.email || '—'}</strong>
                                                    <span>{t.phone || ''}</span>
                                                </div>
                                            </td>
                                            <td><span className={`adm-badge ${t.status}`}>{t.status}</span></td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                                                {t.created_at ? format(parseISO(t.created_at), 'MMM d, yyyy') : '—'}
                                            </td>
                                            <td>
                                                <div className="adm-actions">
                                                    {t.status === 'pending' && (
                                                        <button className="adm-btn success" onClick={() => handleApproveTenant(t.id)}>
                                                            <CheckCircle2 size={14} /> Approve
                                                        </button>
                                                    )}
                                                    {t.status !== 'suspended' && (
                                                        <button className="adm-btn danger" onClick={() => handleSuspendTenant(t.id)}>
                                                            <Ban size={14} /> Suspend
                                                        </button>
                                                    )}
                                                    {t.status === 'suspended' && (
                                                        <button className="adm-btn success" onClick={() => handleApproveTenant(t.id)}>
                                                            <CheckCircle2 size={14} /> Reactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ====== USERS ====== */}
            {activeTab === 'users' && (
                <>
                    {/* Create Manager Card */}
                    <div className="adm-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreateManager ? '1.25rem' : 0 }}>
                            <h2 style={{ marginBottom: 0 }}><UserPlus size={18} /> Create Manager Account</h2>
                            <button className={`adm-btn ${showCreateManager ? 'secondary' : 'primary'}`}
                                onClick={() => setShowCreateManager(!showCreateManager)}>
                                {showCreateManager ? 'Cancel' : '+ New Manager'}
                            </button>
                        </div>
                        {showCreateManager && (
                            <form onSubmit={handleCreateManager} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.3rem' }}>Full Name *</label>
                                    <input className="adm-input" required placeholder="John Doe" value={managerForm.fullName}
                                        onChange={e => setManagerForm({ ...managerForm, fullName: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.3rem' }}>Email *</label>
                                    <input className="adm-input" type="email" required placeholder="manager@example.com" value={managerForm.email}
                                        onChange={e => setManagerForm({ ...managerForm, email: e.target.value })} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.3rem' }}>Password *</label>
                                    <input className="adm-input" type={showPwd ? 'text' : 'password'} required minLength={8} placeholder="Min 8 characters" value={managerForm.password}
                                        onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} />
                                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '0.5rem', top: '1.85rem', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.3rem' }}>Phone</label>
                                    <input className="adm-input" placeholder="Optional" value={managerForm.phone}
                                        onChange={e => setManagerForm({ ...managerForm, phone: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <button type="submit" className="adm-btn primary" disabled={creatingManager} style={{ width: '100%', padding: '0.6rem' }}>
                                        {creatingManager ? 'Creating...' : 'Create Manager Account'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="adm-card">
                        <h2><Users size={18} /> Platform Users</h2>

                        <div className="adm-filters">
                            {['', 'customer', 'manager', 'super_admin'].map(f => (
                                <button key={f} className={`adm-filter ${userFilter === f ? 'active' : ''}`}
                                    onClick={() => { setUserFilter(f); setUserPage(1); }}>
                                    {f === '' ? 'All Roles' : f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        {users.length === 0 ? (
                            <div className="adm-empty">
                                <div className="adm-empty-icon">👤</div>
                                No users found
                            </div>
                        ) : (
                            <div className="adm-table-wrap">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Tenant</th>
                                            <th>Verified</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className="adm-cell-stack">
                                                        <strong>{u.full_name || 'Unknown'}</strong>
                                                        <span>{u.email}</span>
                                                    </div>
                                                </td>
                                                <td><span className={`adm-badge ${u.role}`}>{u.role?.replace('_', ' ')}</span></td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.tenant_name || '—'}</td>
                                                <td>
                                                    <span className={`adm-badge ${u.is_verified ? 'verified' : 'unverified'}`}>
                                                        {u.is_verified ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                                                    {u.created_at ? format(parseISO(u.created_at), 'MMM d, yyyy') : '—'}
                                                </td>
                                                <td>
                                                    {u.role !== 'super_admin' && (
                                                        <button className="adm-btn danger" onClick={() => handleDeleteUser(u)}>
                                                            <Trash2 size={14} /> Remove
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
            {/* ====== AUDIT LOGS ====== */}
            {activeTab === 'logs' && (
                <div className="adm-card">
                    <h2><ScrollText size={18} /> Audit Logs</h2>

                    {logs.length === 0 ? (
                        <div className="adm-empty">
                            <div className="adm-empty-icon">📋</div>
                            No audit logs found
                        </div>
                    ) : (
                        <div>
                            {logs.map((log, i) => (
                                <div key={log.id || i} className="adm-log-item">
                                    <div className="adm-log-dot" />
                                    <div className="adm-log-info">
                                        <span className="adm-log-action">{log.action?.replace(/_/g, ' ')}</span>
                                        <div className="adm-log-meta">
                                            {log.user_email && <span>👤 {log.user_email}</span>}
                                            {log.tenant_name && <span>🏢 {log.tenant_name}</span>}
                                            {log.created_at && (
                                                <span><Clock size={12} /> {format(parseISO(log.created_at), 'MMM d, yyyy h:mm a')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
