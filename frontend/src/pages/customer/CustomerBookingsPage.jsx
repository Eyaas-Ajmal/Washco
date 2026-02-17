import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, DollarSign, AlertCircle, CheckCircle, XCircle, Search, Calendar } from 'lucide-react';
import { getMyBookings, cancelMyBooking, createReview } from '../../api/bookings.api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import './CustomerBookings.css';

const STATUS_CONFIG = {
    reserved: { className: 'status-reserved', icon: Clock, label: 'Reserved' },
    confirmed: { className: 'status-confirmed', icon: CheckCircle, label: 'Confirmed' },
    in_progress: { className: 'status-progress', icon: Clock, label: 'In Progress' },
    completed: { className: 'status-completed', icon: CheckCircle, label: 'Completed' },
    cancelled: { className: 'status-cancelled', icon: XCircle, label: 'Cancelled' },
    no_show: { className: 'status-noshow', icon: AlertCircle, label: 'No Show' },
};

export default function CustomerBookingsPage() {
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await getMyBookings({});
            setAllBookings(data.bookings || []);
        } catch (err) {
            console.error('Failed to load bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const bookings = allBookings.filter((b) => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return ['reserved', 'confirmed', 'in_progress'].includes(b.status);
        if (filter === 'completed') return b.status === 'completed';
        if (filter === 'cancelled') return ['cancelled', 'no_show'].includes(b.status);
        return true;
    });

    const handleCancel = async (bookingId) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await cancelMyBooking(bookingId);
            loadBookings();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel booking');
        }
    };

    const handleReview = async () => {
        try {
            await createReview({
                bookingId: reviewModal.id,
                rating: reviewData.rating,
                comment: reviewData.comment,
            });
            setReviewModal(null);
            setReviewData({ rating: 5, comment: '' });
            loadBookings();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit review');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'completed', label: 'History' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    return (
        <div className="customer-bookings container">
            <div className="bookings-page-header">
                <div>
                    <h1>My Bookings</h1>
                    <p>Track your appointments and history</p>
                </div>
                <div className="filter-segment-control">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            className={`segment-btn ${filter === f.id ? 'active' : ''}`}
                            onClick={() => setFilter(f.id)}
                        >
                            {filter === f.id && (
                                <motion.div
                                    className="segment-bg"
                                    layoutId="segmentBg"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="segment-label">{f.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            ) : bookings.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-emoji">📅</div>
                    <h3>No bookings found</h3>
                    <p>Looks like you don't have any bookings in this category.</p>
                    <a href="/">
                        <Button variant="primary">Book a Wash</Button>
                    </a>
                </div>
            ) : (
                <motion.div
                    className="bookings-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {bookings.map((booking) => {
                        const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.reserved;
                        const StatusIcon = statusConfig.icon;
                        const dateObj = new Date(booking.bookingDate);

                        return (
                            <motion.div key={booking.id} variants={itemVariants}>
                                <div className="ticket-card">
                                    {/* Left Stub: Date */}
                                    <div className="ticket-stub">
                                        <div className="ticket-date">
                                            <span className="month">{format(dateObj, 'MMM')}</span>
                                            <span className="day">{format(dateObj, 'd')}</span>
                                            <span className="day-name">{format(dateObj, 'EEE')}</span>
                                        </div>
                                        <div className="ticket-time">
                                            <Clock size={14} />
                                            {booking.startTime}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="ticket-divider">
                                        <div className="notch-top"></div>
                                        <div className="dashed-line"></div>
                                        <div className="notch-bottom"></div>
                                    </div>

                                    {/* Right Content */}
                                    <div className="ticket-content">
                                        <div className="ticket-main">
                                            <div className="ticket-header">
                                                <div className={`status-badge-pill ${statusConfig.className}`}>
                                                    <StatusIcon size={12} />
                                                    {statusConfig.label}
                                                </div>
                                                <div className="ticket-price">
                                                    ${booking.totalAmount.toFixed(2)}
                                                </div>
                                            </div>

                                            <h3 className="ticket-title">{booking.tenant.name}</h3>

                                            <div className="ticket-details">
                                                <div className="detail-row">
                                                    <MapPin size={14} className="detail-icon" />
                                                    <span>{booking.tenant.address}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <div className="service-icon">🚗</div>
                                                    <span className="font-medium text-white">{booking.service.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ticket-actions">
                                            {['reserved', 'confirmed'].includes(booking.status) && (
                                                <Button
                                                    variant="danger" // Will use styling from Components.css
                                                    size="sm"
                                                    onClick={() => handleCancel(booking.id)}
                                                    className="w-full"
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                            {booking.status === 'completed' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => setReviewModal(booking)}
                                                    className="w-full"
                                                >
                                                    Write Review
                                                </Button>
                                            )}
                                            {['cancelled', 'no_show'].includes(booking.status) && (
                                                <div className="cancelled-text">
                                                    Booking Cancelled
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Review Modal */}
            <AnimatePresence>
                {reviewModal && (
                    <div className="modal-overlay" onClick={() => setReviewModal(null)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="review-modal-card"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Rate your experience</h3>
                                <button className="close-btn" onClick={() => setReviewModal(null)}>✕</button>
                            </div>

                            <div className="modal-body">
                                <p className="mb-4">How was <strong>{reviewModal.tenant.name}</strong>?</p>

                                <div className="star-rating-lg">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            className={`star-btn-lg ${star <= reviewData.rating ? 'active' : ''}`}
                                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    className="review-textarea"
                                    rows={4}
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    placeholder="Share your feedback..."
                                />
                            </div>

                            <div className="modal-footer">
                                <Button variant="ghost" onClick={() => setReviewModal(null)}>Cancel</Button>
                                <Button variant="primary" onClick={handleReview}>Submit</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
