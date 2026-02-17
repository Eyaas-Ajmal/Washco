import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Clock, ChevronRight, Check, Calendar, Info } from 'lucide-react';
import { getCarWashBySlug, getCarWashServices, getCarWashSlots, getReviews } from '../../api/tenants.api';
import { createBooking } from '../../api/bookings.api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import './CarWashDetail.css';

export default function CarWashDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [carWash, setCarWash] = useState(null);
    const [services, setServices] = useState([]);
    const [slots, setSlots] = useState([]);
    const [reviews, setReviews] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Booking state
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, [slug]);

    useEffect(() => {
        if (carWash) {
            loadSlots();
        }
    }, [selectedDate, carWash]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cwData, servData] = await Promise.all([
                getCarWashBySlug(slug),
                getCarWashServices(slug),
            ]);
            setCarWash(cwData);
            setServices(servData);

            // Auto-select first service if available
            if (servData.length > 0) setSelectedService(servData[0]);

            // Load reviews separately so a failure doesn't block booking
            try {
                const revData = await getReviews(cwData.id);
                setReviews(revData || { reviews: [], averageRating: 0, totalReviews: 0 });
            } catch {
                // Reviews API may not exist yet — that's okay
            }
        } catch (err) {
            setError('Failed to load car wash details');
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async () => {
        try {
            const data = await getCarWashSlots(slug, selectedDate, selectedDate);
            setSlots(data);
        } catch (err) {
            console.error('Failed to load slots:', err);
        }
    };

    const handleBook = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/carwash/${slug}` } } });
            return;
        }

        if (!selectedService || !selectedSlot) {
            setError('Please select a service and time slot');
            return;
        }

        setBookingLoading(true);
        setError('');

        try {
            await createBooking({
                tenantId: carWash.id,
                serviceId: selectedService.id,
                slotId: selectedSlot.id,
            });
            setBookingSuccess(true);
            setSelectedSlot(null);
            loadSlots();
        } catch (err) {
            setError(err.response?.data?.error || 'Booking failed. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="cw-loading-screen">
                <div className="cw-spinner"></div>
            </div>
        );
    }

    if (!carWash) {
        return (
            <div className="container cw-center-message">
                <h2>Car wash not found</h2>
                <Button variant="ghost" onClick={() => navigate('/')}>Return Home</Button>
            </div>
        );
    }

    const dateOptions = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(), i);
        return {
            value: format(date, 'yyyy-MM-dd'),
            day: format(date, 'EEE'),
            dayNum: format(date, 'd'),
            fullLabel: format(date, 'MMM d'),
        };
    });

    return (
        <div className="cw-page">
            {/* Hero Section */}
            <div className="cw-hero" style={carWash.imageUrl ? { backgroundImage: `url(${carWash.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                <div className="cw-hero-overlay"></div>
                <div className="container cw-hero-content">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cw-hero-info"
                    >
                        <div className="cw-badge">
                            <Star size={12} className="fill-current" />
                            <span>Top Rated</span>
                        </div>
                        <h1 className="cw-title">{carWash.name}</h1>
                        <div className="cw-meta-row">
                            <div className="cw-meta-item">
                                <MapPin size={16} />
                                {carWash.address}
                            </div>
                            <div className="cw-dot"></div>
                            <div className="cw-meta-item">
                                <Star size={16} className="text-yellow-400 fill-current" />
                                <span className="font-bold">{reviews.averageRating?.toFixed(1) || '0.0'}</span>
                                <span className="cw-reviews-count">({reviews.totalReviews} reviews)</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container cw-grid-layout">
                {/* Left Column: Services & Info */}
                <div className="cw-main-col">
                    <section className="cw-section">
                        <div className="cw-section-header">
                            <h2>Select Service</h2>
                            <p>Choose the best package for your car</p>
                        </div>

                        <div className="cw-services-list">
                            {services.length === 0 ? (
                                <div className="cw-no-slots" style={{ padding: '2rem', textAlign: 'center' }}>
                                    <Info size={20} />
                                    <span>No services available yet. The car wash hasn't set up their services.</span>
                                </div>
                            ) : (
                                services.map((service) => (
                                    <motion.div
                                        key={service.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`cw-service-card ${selectedService?.id === service.id ? 'active' : ''}`}
                                        onClick={() => setSelectedService(service)}
                                    >
                                        <div className="cw-service-info">
                                            <div className="cw-service-header">
                                                <h3>{service.name}</h3>
                                                {selectedService?.id === service.id && <Check size={18} className="cw-check-icon" />}
                                            </div>
                                            <p className="cw-service-desc">{service.description}</p>
                                            <div className="cw-service-meta">
                                                <span className="cw-duration">
                                                    <Clock size={14} />
                                                    {service.durationMinutes} min
                                                </span>
                                            </div>
                                        </div>
                                        <div className="cw-service-price">
                                            ${service.price.toFixed(0)}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>

                    {reviews.reviews.length > 0 && (
                        <section className="cw-section cw-reviews-section">
                            <div className="cw-section-header">
                                <h2>What People Say</h2>
                            </div>
                            <div className="cw-reviews-grid">
                                {reviews.reviews.slice(0, 3).map((review) => (
                                    <div key={review.id} className="cw-review-card">
                                        <div className="cw-review-header">
                                            <div className="cw-avatar">{review.customerName[0]}</div>
                                            <div>
                                                <div className="cw-reviewer-name">{review.customerName}</div>
                                                <div className="cw-review-stars">{'⭐'.repeat(review.rating)}</div>
                                            </div>
                                        </div>
                                        <p className="cw-review-text">"{review.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Sticky Booking Widget */}
                <div className="cw-sidebar-col">
                    <Card className="cw-booking-widget">
                        {bookingSuccess ? (
                            <div className="cw-success-state">
                                <div className="cw-success-icon">
                                    <Check size={32} />
                                </div>
                                <h3>Booking Confirmed!</h3>
                                <p>We'll see you on {format(new Date(selectedDate), 'MMM d')}.</p>
                                <Button className="w-full mt-4" onClick={() => navigate('/bookings')}>
                                    View My Bookings
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="cw-widget-header">
                                    <h3>Book Appointment</h3>
                                </div>

                                {/* Date Picker */}
                                <div className="cw-widget-section">
                                    <label className="cw-label">
                                        <Calendar size={14} />
                                        Select Date
                                    </label>
                                    <div className="cw-date-scroller">
                                        {dateOptions.map((d) => (
                                            <button
                                                key={d.value}
                                                className={`cw-date-btn ${selectedDate === d.value ? 'active' : ''}`}
                                                onClick={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
                                            >
                                                <span className="cw-day-name">{d.day}</span>
                                                <span className="cw-day-num">{d.dayNum}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Slot Picker */}
                                <div className="cw-widget-section">
                                    <label className="cw-label">
                                        <Clock size={14} />
                                        Available Time
                                    </label>
                                    <div className="cw-slots-grid">
                                        {slots.length === 0 ? (
                                            <div className="cw-no-slots">
                                                <Info size={16} />
                                                <span>No slots available</span>
                                            </div>
                                        ) : (
                                            slots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    disabled={slot.available === 0}
                                                    className={`cw-slot-btn ${selectedSlot?.id === slot.id ? 'active' : ''} ${slot.available === 0 ? 'disabled' : ''}`}
                                                    onClick={() => slot.available > 0 && setSelectedSlot(slot)}
                                                >
                                                    {slot.startTime}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Summary & Action */}
                                <div className="cw-summary">
                                    <div className="cw-summary-row">
                                        <span>Service</span>
                                        <span>{selectedService ? selectedService.name : '-'}</span>
                                    </div>
                                    <div className="cw-summary-total">
                                        <span>Total</span>
                                        <span className="cw-total-price">
                                            ${selectedService ? selectedService.price.toFixed(2) : '0.00'}
                                        </span>
                                    </div>

                                    {error && <div className="cw-error-msg">{error}</div>}

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full mt-4"
                                        onClick={handleBook}
                                        disabled={!selectedService || !selectedSlot || bookingLoading}
                                    >
                                        {bookingLoading ? 'Processing...' : 'Confirm Booking'}
                                    </Button>

                                    {!isAuthenticated && (
                                        <p className="cw-login-hint">You'll need to login to complete booking</p>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
