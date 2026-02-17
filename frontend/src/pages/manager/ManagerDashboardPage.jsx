import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { getOwnTenant, createTenant, uploadCarWashImage } from '../../api/tenants.api';
import {
    getServices,
    createService,
    updateService,
    deleteService,
    getSlots,
    generateSlots,
    blockSlot,
    unblockSlot,
    getOperatingHours,
    setOperatingHours,
} from '../../api/manager.api';
import {
    getTenantBookings,
    updateBookingStatus,
    cancelBookingAsManager,
    getDashboardStats,
} from '../../api/bookings.api';
import {
    LayoutDashboard,
    Wrench,
    Clock,
    CalendarCheck,
    Plus,
    Pencil,
    Trash2,
    Ban,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Car,
    MapPin,
    Timer,
    DollarSign,
    Users,
    TrendingUp,
    CalendarDays,
    Camera,
    ImagePlus,
} from 'lucide-react';
import './ManagerDashboard.css';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BOOKING_STATUS_FLOW = {
    reserved: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled', 'no_show'],
    in_progress: ['completed', 'no_show'],
};

export default function ManagerDashboardPage() {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dashboard stats
    const [stats, setStats] = useState(null);

    // Services state
    const [services, setServices] = useState([]);
    const [serviceForm, setServiceForm] = useState({
        name: '', description: '', price: '', durationMinutes: 30, bufferMinutes: 5,
    });
    const [editingService, setEditingService] = useState(null);

    // Slots state
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [slotGenForm, setSlotGenForm] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        slotDuration: 60,
        capacity: 1,
    });

    // Operating hours state
    const [operatingHours, setOperatingHoursState] = useState([]);

    // Bookings state
    const [bookings, setBookings] = useState([]);
    const [bookingFilter, setBookingFilter] = useState('');
    const [bookingPage, setBookingPage] = useState(1);

    // Tenant creation form
    const [tenantForm, setTenantForm] = useState({
        name: '', address: '', email: '', phone: '', description: '',
    });

    // Image upload state
    const [uploading, setUploading] = useState(false);

    useEffect(() => { loadTenant(); }, []);

    useEffect(() => {
        if (tenant && activeTab === 'overview') { loadDashboardStats(); }
        else if (tenant && activeTab === 'services') { loadServices(); }
        else if (tenant && activeTab === 'slots') { loadSlots(); loadOperatingHours(); }
        else if (tenant && activeTab === 'bookings') { loadBookings(); }
    }, [tenant, activeTab, selectedDate, bookingFilter, bookingPage]);

    // ---- Data Loaders ----
    const loadTenant = async () => {
        try {
            setLoading(true);
            const data = await getOwnTenant();
            setTenant(data);
        } catch (err) {
            if (err.response?.status === 404) setTenant(null);
            else setError('Failed to load your car wash data');
        } finally { setLoading(false); }
    };

    const loadDashboardStats = async () => {
        try { const data = await getDashboardStats(); setStats(data); }
        catch (err) { console.error('Failed to load stats:', err); }
    };

    const loadServices = async () => {
        try { const data = await getServices(); setServices(data || []); }
        catch (err) { console.error('Failed to load services:', err); }
    };

    const loadSlots = async () => {
        try {
            const endDate = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
            const data = await getSlots(selectedDate, endDate);
            setSlots(data || []);
        } catch (err) { console.error('Failed to load slots:', err); }
    };

    const loadOperatingHours = async () => {
        try {
            const data = await getOperatingHours();
            const defaults = [0, 1, 2, 3, 4, 5, 6].map(d => ({
                dayOfWeek: d, openTime: '09:00', closeTime: '18:00', isClosed: d === 0,
            }));
            if (data?.length > 0) {
                setOperatingHoursState(defaults.map(dh => data.find(d => d.dayOfWeek === dh.dayOfWeek) || dh));
            } else {
                setOperatingHoursState(defaults);
            }
        } catch {
            setOperatingHoursState([0, 1, 2, 3, 4, 5, 6].map(d => ({
                dayOfWeek: d, openTime: '09:00', closeTime: '18:00', isClosed: d === 0,
            })));
        }
    };

    const loadBookings = async () => {
        try {
            const data = await getTenantBookings({ status: bookingFilter || undefined, page: bookingPage, limit: 20 });
            setBookings(data?.bookings || []);
        } catch (err) { console.error('Failed to load bookings:', err); }
    };

    // ---- Handlers ----
    const handleCreateTenant = async (e) => {
        e.preventDefault(); setError('');
        try {
            const newTenant = await createTenant(tenantForm);
            setTenant(newTenant);
            setSuccess('Car wash registered successfully! Pending admin approval.');
        } catch (err) { setError(err.response?.data?.error || 'Failed to register car wash'); }
    };

    const handleCreateService = async (e) => {
        e.preventDefault(); setError('');
        try {
            await createService({ ...serviceForm, price: parseFloat(serviceForm.price) });
            setServiceForm({ name: '', description: '', price: '', durationMinutes: 30, bufferMinutes: 5 });
            loadServices();
            setSuccess('Service created successfully!');
        } catch (err) { setError(err.response?.data?.error || 'Failed to create service'); }
    };

    const handleUpdateService = async (e) => {
        e.preventDefault(); setError('');
        try {
            await updateService(editingService.id, { ...serviceForm, price: parseFloat(serviceForm.price) });
            setEditingService(null);
            setServiceForm({ name: '', description: '', price: '', durationMinutes: 30, bufferMinutes: 5 });
            loadServices();
            setSuccess('Service updated!');
        } catch (err) { setError(err.response?.data?.error || 'Failed to update service'); }
    };

    const handleDeleteService = async (id) => {
        if (!confirm('Delete this service?')) return;
        try { await deleteService(id); loadServices(); setSuccess('Service deleted!'); }
        catch (err) { setError(err.response?.data?.error || 'Failed to delete service'); }
    };

    const startEditService = (svc) => {
        setEditingService(svc);
        setServiceForm({
            name: svc.name, description: svc.description || '', price: svc.price.toString(),
            durationMinutes: svc.durationMinutes, bufferMinutes: svc.bufferMinutes || 0,
        });
    };

    const handleGenerateSlots = async (e) => {
        e.preventDefault(); setError('');
        try { await generateSlots(slotGenForm); loadSlots(); setSuccess('Slots generated!'); }
        catch (err) { setError(err.response?.data?.error || 'Failed to generate slots'); }
    };

    const handleToggleSlotBlock = async (slot) => {
        try {
            if (slot.status === 'blocked') await unblockSlot(slot.id);
            else await blockSlot(slot.id);
            loadSlots();
        } catch (err) { setError(err.response?.data?.error || 'Failed to update slot'); }
    };

    const handleSaveOperatingHours = async () => {
        try { await setOperatingHours(operatingHours); setSuccess('Operating hours saved!'); }
        catch (err) { setError(err.response?.data?.error || 'Failed to save hours'); }
    };

    const updateHour = (dayOfWeek, field, value) => {
        setOperatingHoursState(prev => {
            const existing = prev.find(h => h.dayOfWeek === dayOfWeek);
            if (existing) return prev.map(h => h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h);
            return [...prev, { dayOfWeek, openTime: '09:00', closeTime: '18:00', isClosed: false, [field]: value }];
        });
    };

    const handleUpdateBookingStatus = async (bookingId, newStatus) => {
        try { await updateBookingStatus(bookingId, newStatus); loadBookings(); setSuccess('Booking updated!'); }
        catch (err) { setError(err.response?.data?.error || 'Failed to update booking'); }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm('Cancel this booking?')) return;
        try { await cancelBookingAsManager(bookingId, 'Cancelled by manager'); loadBookings(); setSuccess('Booking cancelled!'); }
        catch (err) { setError(err.response?.data?.error || 'Failed to cancel booking'); }
    };

    // Auto-clear messages
    useEffect(() => {
        if (success || error) {
            const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
            return () => clearTimeout(t);
        }
    }, [success, error]);

    // Image upload handler
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB');
            return;
        }
        setUploading(true);
        try {
            const data = await uploadCarWashImage(file);
            setTenant(prev => ({ ...prev, image_url: data.imageUrl }));
            setSuccess('Image uploaded successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    // ---- Render ----
    if (loading) return <div className="mgr-loading"><div className="mgr-spinner" /></div>;

    // ---- No Tenant -> Registration ----
    if (!tenant) {
        return (
            <div className="mgr">
                <div className="mgr-card mgr-create-card">
                    <h1>Register Your Car Wash</h1>
                    <p>Get started by creating your business profile</p>

                    {error && <div className="mgr-toast error"><XCircle size={16} />{error}</div>}
                    {success && <div className="mgr-toast success"><CheckCircle2 size={16} />{success}</div>}

                    <form onSubmit={handleCreateTenant}>
                        <div className="mgr-form-grid">
                            <div className="mgr-form-group full">
                                <label className="mgr-form-label">Car Wash Name *</label>
                                <input className="mgr-input" type="text" value={tenantForm.name}
                                    onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })}
                                    placeholder="e.g., Sparkle Clean Car Wash" required />
                            </div>
                            <div className="mgr-form-group full">
                                <label className="mgr-form-label">Address *</label>
                                <input className="mgr-input" type="text" value={tenantForm.address}
                                    onChange={e => setTenantForm({ ...tenantForm, address: e.target.value })}
                                    placeholder="123 Main St, City, State" required />
                            </div>
                            <div className="mgr-form-group">
                                <label className="mgr-form-label">Contact Email *</label>
                                <input className="mgr-input" type="email" value={tenantForm.email}
                                    onChange={e => setTenantForm({ ...tenantForm, email: e.target.value })}
                                    placeholder="contact@yourcarwash.com" required />
                            </div>
                            <div className="mgr-form-group">
                                <label className="mgr-form-label">Phone</label>
                                <input className="mgr-input" type="tel" value={tenantForm.phone}
                                    onChange={e => setTenantForm({ ...tenantForm, phone: e.target.value })}
                                    placeholder="+1 (555) 123-4567" />
                            </div>
                            <div className="mgr-form-group full">
                                <label className="mgr-form-label">Description</label>
                                <textarea className="mgr-input" rows={3} value={tenantForm.description}
                                    onChange={e => setTenantForm({ ...tenantForm, description: e.target.value })}
                                    placeholder="Tell customers about your car wash..." />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.25rem' }}>
                            <button type="submit" className="mgr-btn primary full">
                                <Car size={18} /> Register Car Wash
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ---- Main Dashboard ----
    return (
        <div className="mgr">
            {/* Toast Messages */}
            {error && <div className="mgr-toast error"><XCircle size={16} />{error}</div>}
            {success && <div className="mgr-toast success"><CheckCircle2 size={16} />{success}</div>}

            {/* Header */}
            <div className="mgr-header">
                <div className="mgr-header-left">
                    <label className="mgr-avatar-upload" title="Click to change image">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            hidden
                        />
                        {tenant.image_url ? (
                            <img src={tenant.image_url} alt={tenant.name} className="mgr-avatar-img" />
                        ) : (
                            <div className="mgr-avatar-placeholder">
                                <Car size={28} />
                            </div>
                        )}
                        <div className="mgr-avatar-overlay">
                            {uploading ? <span className="mgr-avatar-spinner" /> : <Camera size={16} />}
                        </div>
                    </label>
                    <div>
                        <h1>{tenant.name}</h1>
                        <div className="mgr-header-sub">
                            <MapPin size={14} /> {tenant.address}
                            {tenant.status === 'pending' && (
                                <span className="mgr-badge pending"><AlertCircle size={12} /> Pending</span>
                            )}
                            {tenant.status === 'active' && (
                                <span className="mgr-badge active"><CheckCircle2 size={12} /> Active</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mgr-tabs">
                {[
                    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
                    { key: 'services', label: 'Services', icon: <Wrench size={15} /> },
                    { key: 'slots', label: 'Slots & Hours', icon: <Clock size={15} /> },
                    { key: 'bookings', label: 'Bookings', icon: <CalendarCheck size={15} /> },
                ].map(t => (
                    <button key={t.key} className={`mgr-tab ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.key)}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ====== OVERVIEW ====== */}
            {activeTab === 'overview' && (
                <>
                    <div className="mgr-stats">
                        <div className="mgr-stat">
                            <span className="mgr-stat-label">Today's Bookings</span>
                            <span className="mgr-stat-value">{stats?.todayBookings || 0}</span>
                        </div>
                        <div className="mgr-stat">
                            <span className="mgr-stat-label">Upcoming</span>
                            <span className="mgr-stat-value">{stats?.upcomingBookings || 0}</span>
                        </div>
                        <div className="mgr-stat">
                            <span className="mgr-stat-label">Today's Revenue</span>
                            <span className="mgr-stat-value">${stats?.todayRevenue?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="mgr-stat">
                            <span className="mgr-stat-label">Monthly Revenue</span>
                            <span className="mgr-stat-value">${stats?.monthlyRevenue?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>

                    <div className="mgr-card">
                        <h2><CalendarDays size={18} /> Today's Schedule</h2>
                        {stats?.todaySchedule?.length > 0 ? (
                            stats.todaySchedule.map(b => (
                                <div key={b.id} className="mgr-schedule-item">
                                    <span className="mgr-schedule-time">{b.slotTime}</span>
                                    <div className="mgr-schedule-info">
                                        <span className="mgr-schedule-customer">{b.customerName}</span>
                                        <span className="mgr-schedule-service">{b.serviceName}</span>
                                    </div>
                                    <span className={`mgr-status ${b.status}`}>{b.status?.replace('_', ' ')}</span>
                                </div>
                            ))
                        ) : (
                            <div className="mgr-empty">
                                <div className="mgr-empty-icon">📅</div>
                                No bookings scheduled for today
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ====== SERVICES ====== */}
            {activeTab === 'services' && (
                <>
                    <div className="mgr-card" style={{ marginBottom: '1.25rem' }}>
                        <h2>{editingService ? <><Pencil size={16} /> Edit Service</> : <><Plus size={16} /> Add New Service</>}</h2>
                        <form onSubmit={editingService ? handleUpdateService : handleCreateService}>
                            <div className="mgr-form-grid">
                                <div className="mgr-form-group">
                                    <label className="mgr-form-label">Service Name *</label>
                                    <input className="mgr-input" value={serviceForm.name}
                                        onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                                        placeholder="e.g., Basic Wash" required />
                                </div>
                                <div className="mgr-form-group">
                                    <label className="mgr-form-label">Price ($) *</label>
                                    <input className="mgr-input" type="number" step="0.01" min="0"
                                        value={serviceForm.price}
                                        onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                                        placeholder="19.99" required />
                                </div>
                                <div className="mgr-form-group">
                                    <label className="mgr-form-label">Duration (min) *</label>
                                    <input className="mgr-input" type="number" min="5" max="480"
                                        value={serviceForm.durationMinutes}
                                        onChange={e => setServiceForm({ ...serviceForm, durationMinutes: parseInt(e.target.value) })}
                                        required />
                                </div>
                                <div className="mgr-form-group">
                                    <label className="mgr-form-label">Buffer (min)</label>
                                    <input className="mgr-input" type="number" min="0" max="60"
                                        value={serviceForm.bufferMinutes}
                                        onChange={e => setServiceForm({ ...serviceForm, bufferMinutes: parseInt(e.target.value) })} />
                                </div>
                                <div className="mgr-form-group full">
                                    <label className="mgr-form-label">Description</label>
                                    <textarea className="mgr-input" rows={2} value={serviceForm.description}
                                        onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                                        placeholder="Describe what's included..." />
                                </div>
                            </div>
                            <div className="mgr-actions" style={{ marginTop: '1rem' }}>
                                <button type="submit" className="mgr-btn primary">
                                    {editingService ? 'Update Service' : 'Add Service'}
                                </button>
                                {editingService && (
                                    <button type="button" className="mgr-btn secondary"
                                        onClick={() => { setEditingService(null); setServiceForm({ name: '', description: '', price: '', durationMinutes: 30, bufferMinutes: 5 }); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Service Cards */}
                    {services.length === 0 ? (
                        <div className="mgr-card">
                            <div className="mgr-empty">
                                <div className="mgr-empty-icon">🛠️</div>
                                No services yet — add your first one above!
                            </div>
                        </div>
                    ) : (
                        <div className="mgr-services-list">
                            {services.map(svc => (
                                <div key={svc.id} className="mgr-service-card">
                                    <div className="mgr-service-top">
                                        <span className="mgr-service-name">{svc.name}</span>
                                        <span className="mgr-service-price">${parseFloat(svc.price).toFixed(2)}</span>
                                    </div>
                                    {svc.description && <p className="mgr-service-desc">{svc.description}</p>}
                                    <div className="mgr-service-meta">
                                        <span><Timer size={13} /> {svc.durationMinutes} min</span>
                                        {svc.bufferMinutes > 0 && <span>+{svc.bufferMinutes}m buffer</span>}
                                        <span className={`mgr-status ${svc.isActive ? 'completed' : 'cancelled'}`}>
                                            {svc.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="mgr-service-actions">
                                        <button className="mgr-btn secondary sm" onClick={() => startEditService(svc)}>
                                            <Pencil size={13} /> Edit
                                        </button>
                                        <button className="mgr-btn danger sm" onClick={() => handleDeleteService(svc.id)}>
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ====== SLOTS & HOURS ====== */}
            {activeTab === 'slots' && (
                <>
                    <div className="mgr-grid-2">
                        {/* Generate Slots */}
                        <div className="mgr-card">
                            <h2><Plus size={16} /> Generate Slots</h2>
                            <form onSubmit={handleGenerateSlots}>
                                <div className="mgr-form-grid">
                                    <div className="mgr-form-group">
                                        <label className="mgr-form-label">Start Date</label>
                                        <input className="mgr-input" type="date" value={slotGenForm.startDate}
                                            onChange={e => setSlotGenForm({ ...slotGenForm, startDate: e.target.value })} required />
                                    </div>
                                    <div className="mgr-form-group">
                                        <label className="mgr-form-label">End Date</label>
                                        <input className="mgr-input" type="date" value={slotGenForm.endDate}
                                            onChange={e => setSlotGenForm({ ...slotGenForm, endDate: e.target.value })} required />
                                    </div>
                                    <div className="mgr-form-group">
                                        <label className="mgr-form-label">Duration</label>
                                        <select className="mgr-input" value={slotGenForm.slotDuration}
                                            onChange={e => setSlotGenForm({ ...slotGenForm, slotDuration: parseInt(e.target.value) })}>
                                            <option value="30">30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="90">1.5 hours</option>
                                            <option value="120">2 hours</option>
                                        </select>
                                    </div>
                                    <div className="mgr-form-group">
                                        <label className="mgr-form-label">Capacity</label>
                                        <input className="mgr-input" type="number" min="1" max="100"
                                            value={slotGenForm.capacity}
                                            onChange={e => setSlotGenForm({ ...slotGenForm, capacity: parseInt(e.target.value) })} required />
                                    </div>
                                </div>
                                <button type="submit" className="mgr-btn primary" style={{ marginTop: '1rem' }}>
                                    Generate Slots
                                </button>
                            </form>
                        </div>

                        {/* Operating Hours */}
                        <div className="mgr-card">
                            <h2><Clock size={16} /> Operating Hours</h2>
                            {DAYS_OF_WEEK.map((day, i) => {
                                const hr = operatingHours.find(h => h.dayOfWeek === i) || {
                                    openTime: '09:00', closeTime: '18:00', isClosed: false,
                                };
                                return (
                                    <div key={day} className="mgr-hours-row">
                                        <span className={`mgr-hours-day ${hr.isClosed ? 'closed' : ''}`}>{day}</span>
                                        <input className="mgr-input" type="time" value={hr.openTime}
                                            onChange={e => updateHour(i, 'openTime', e.target.value)} disabled={hr.isClosed} />
                                        <input className="mgr-input" type="time" value={hr.closeTime}
                                            onChange={e => updateHour(i, 'closeTime', e.target.value)} disabled={hr.isClosed} />
                                        <button type="button"
                                            className={`mgr-toggle ${hr.isClosed ? 'off' : ''}`}
                                            onClick={() => updateHour(i, 'isClosed', !hr.isClosed)}
                                            title={hr.isClosed ? 'Closed — click to open' : 'Open — click to close'} />
                                    </div>
                                );
                            })}
                            <button className="mgr-btn primary" style={{ marginTop: '0.75rem' }} onClick={handleSaveOperatingHours}>
                                Save Hours
                            </button>
                        </div>
                    </div>

                    {/* Slots Viewer */}
                    <div className="mgr-card">
                        <h2><CalendarDays size={16} /> Slots for Date</h2>
                        <div style={{ marginBottom: '1rem', maxWidth: 180 }}>
                            <input className="mgr-input" type="date" value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)} />
                        </div>
                        {slots.length === 0 ? (
                            <div className="mgr-empty">
                                <div className="mgr-empty-icon">🕐</div>
                                No slots for this date. Generate some above!
                            </div>
                        ) : (
                            <div className="mgr-slots-grid">
                                {slots.map(slot => (
                                    <div key={slot.id}
                                        className={`mgr-slot ${slot.status === 'blocked' ? 'blocked' : ''}`}
                                        onClick={() => handleToggleSlotBlock(slot)}
                                        title={slot.status === 'blocked' ? 'Click to unblock' : 'Click to block'}>
                                        <strong>{slot.startTime}</strong>
                                        <span className="mgr-slot-cap">
                                            {slot.bookedCount}/{slot.maxCapacity}
                                            {slot.status === 'blocked' && ' 🚫'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ====== BOOKINGS ====== */}
            {activeTab === 'bookings' && (
                <div className="mgr-card">
                    <h2><CalendarCheck size={18} /> Manage Bookings</h2>

                    <div className="mgr-filters">
                        {['', 'reserved', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(f => (
                            <button key={f} className={`mgr-filter ${bookingFilter === f ? 'active' : ''}`}
                                onClick={() => setBookingFilter(f)}>
                                {f === '' ? 'All' : f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {bookings.length === 0 ? (
                        <div className="mgr-empty">
                            <div className="mgr-empty-icon">📋</div>
                            No bookings found
                        </div>
                    ) : (
                        <div className="mgr-table-wrap">
                            <table className="mgr-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Customer</th>
                                        <th>Service</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(bk => (
                                        <tr key={bk.id}>
                                            <td>
                                                <strong>{bk.bookingDate && format(parseISO(bk.bookingDate), 'MMM d, yyyy')}</strong>
                                                <br /><span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{bk.startTime}</span>
                                            </td>
                                            <td>
                                                <div className="mgr-customer-cell">
                                                    <strong>{bk.customer?.name || 'N/A'}</strong>
                                                    <span>{bk.customer?.email || ''}</span>
                                                </div>
                                            </td>
                                            <td>{bk.service?.name || 'N/A'}</td>
                                            <td style={{ fontWeight: 600 }}>${bk.totalAmount?.toFixed(2) || '0.00'}</td>
                                            <td><span className={`mgr-status ${bk.status}`}>{bk.status?.replace('_', ' ')}</span></td>
                                            <td>
                                                <div className="mgr-actions">
                                                    {BOOKING_STATUS_FLOW[bk.status]?.map(ns => (
                                                        <button key={ns}
                                                            className={`mgr-btn sm ${ns === 'cancelled' || ns === 'no_show' ? 'danger' : 'secondary'}`}
                                                            onClick={() => ns === 'cancelled' ? handleCancelBooking(bk.id) : handleUpdateBookingStatus(bk.id, ns)}>
                                                            {ns.replace('_', ' ')}
                                                        </button>
                                                    ))}
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
        </div>
    );
}
