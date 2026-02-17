import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
    Search, MapPin, Calendar, Star, Shield, ArrowRight,
    CheckCircle, Sparkles, Clock, Droplets, Zap
} from 'lucide-react';
import { getCarWashes } from '../../api/tenants.api';
import Button from '../../components/common/Button';
import './HomePage.css';

/* ─── animation helpers ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.12, ease: [.22, 1, .36, 1] },
    }),
};

function Section({ children, className = '', id }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <section
            ref={ref}
            id={id}
            className={className}
            style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(40px)', transition: 'all 0.7s cubic-bezier(.22,1,.36,1)' }}
        >
            {children}
        </section>
    );
}

/* ─── Main Component ─── */
export default function HomePage() {
    const [carWashes, setCarWashes] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadCarWashes(); }, []);

    const loadCarWashes = async (q = '') => {
        setLoading(true);
        try {
            const data = await getCarWashes({ search: q });
            setCarWashes(data.tenants || []);
        } catch (err) {
            console.error('Failed to load car washes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => { e.preventDefault(); loadCarWashes(search); };

    return (
        <div className="hp">

            {/* ═══ HERO ═══ */}
            <section className="hp-hero">
                {/* decorative blobs */}
                <div className="hp-hero__blob hp-hero__blob--1" />
                <div className="hp-hero__blob hp-hero__blob--2" />
                <div className="hp-hero__blob hp-hero__blob--3" />

                <div className="container hp-hero__inner">
                    <motion.div className="hp-hero__text" initial="hidden" animate="visible">
                        <motion.span className="hp-hero__pill" variants={fadeUp} custom={0}>
                            <Sparkles size={14} />
                            <span>India's #1 Car Wash Platform</span>
                        </motion.span>

                        <motion.h1 className="hp-hero__title" variants={fadeUp} custom={1}>
                            Your car deserves<br />
                            <span className="hp-hero__title-accent">a perfect shine.</span>
                        </motion.h1>

                        <motion.p className="hp-hero__desc" variants={fadeUp} custom={2}>
                            Find premium car washes near you, pick a slot, and drive away sparkling — all in under a minute.
                        </motion.p>

                        <motion.form className="hp-search" onSubmit={handleSearch} variants={fadeUp} custom={3}>
                            <Search className="hp-search__icon" size={20} />
                            <input
                                className="hp-search__input"
                                type="text"
                                placeholder="Search by name or location…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="hp-search__btn">
                                Search
                                <ArrowRight size={16} />
                            </button>
                        </motion.form>

                        <motion.div className="hp-hero__proof" variants={fadeUp} custom={4}>
                            <div className="hp-hero__avatars">
                                {['😊', '😎', '🤩', '🥳'].map((e, i) => (
                                    <span key={i} className="hp-hero__avatar">{e}</span>
                                ))}
                            </div>
                            <p><strong>50,000+</strong> happy car owners already trust us</p>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="hp-hero__visual"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="hp-hero__card-stack">
                            <div className="hp-hero__float-card hp-hero__float-card--1">
                                <Droplets size={20} /> Premium Foam Wash
                            </div>
                            <div className="hp-hero__float-card hp-hero__float-card--2">
                                <Clock size={20} /> Next slot: 2:30 PM
                            </div>
                            <div className="hp-hero__float-card hp-hero__float-card--3">
                                <Star size={20} fill="currentColor" /> 4.9 Rating
                            </div>
                            <div className="hp-hero__car-emoji">🚗</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══ STATS BAR ═══ */}
            <Section className="hp-stats">
                <div className="container hp-stats__inner">
                    {[
                        { num: '500+', label: 'Car Washes', icon: <MapPin size={22} /> },
                        { num: '50k+', label: 'Bookings Done', icon: <Calendar size={22} /> },
                        { num: '4.9★', label: 'Avg Rating', icon: <Star size={22} /> },
                        { num: '100%', label: 'Satisfaction', icon: <Shield size={22} /> },
                    ].map((s, i) => (
                        <div className="hp-stats__item" key={i}>
                            <span className="hp-stats__icon">{s.icon}</span>
                            <div>
                                <span className="hp-stats__num">{s.num}</span>
                                <span className="hp-stats__label">{s.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ═══ HOW IT WORKS ═══ */}
            <Section className="hp-steps" id="how-it-works">
                <div className="container">
                    <div className="hp-section-head">
                        <span className="hp-section-head__tag">Simple Process</span>
                        <h2>Book in 3 easy steps</h2>
                        <p>No hassle, no waiting — just a shiny car.</p>
                    </div>

                    <div className="hp-steps__grid">
                        {[
                            { icon: <MapPin size={28} />, num: '01', title: 'Find', desc: 'Browse car washes near you and compare services, ratings & prices.', color: '#6366f1' },
                            { icon: <Calendar size={28} />, num: '02', title: 'Book', desc: 'Pick your preferred date & time slot — confirmation is instant.', color: '#8b5cf6' },
                            { icon: <CheckCircle size={28} />, num: '03', title: 'Shine', desc: 'Show up, relax while your car gets pampered, and drive away happy.', color: '#06b6d4' },
                        ].map((step, i) => (
                            <div className="hp-step" key={i}>
                                <div className="hp-step__num">{step.num}</div>
                                <div className="hp-step__icon" style={{ '--step-color': step.color }}>
                                    {step.icon}
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ═══ FEATURED LISTINGS ═══ */}
            <Section className="hp-listings" id="listings">
                <div className="container">
                    <div className="hp-section-head">
                        <span className="hp-section-head__tag">Top Picks</span>
                        <h2>Popular car washes</h2>
                        <p>Our most-booked locations this week</p>
                    </div>

                    {loading ? (
                        <div className="hp-loader"><div className="hp-loader__spin" /></div>
                    ) : carWashes.length === 0 ? (
                        <div className="hp-empty">
                            <Search size={48} strokeWidth={1} />
                            <h3>No car washes found</h3>
                            <p>Try a different search or check back soon.</p>
                        </div>
                    ) : (
                        <div className="hp-card-grid">
                            {carWashes.map((cw) => (
                                <Link to={`/carwash/${cw.slug}`} key={cw.id} className="hp-cw-link">
                                    <div className="hp-cw">
                                        <div className="hp-cw__img">
                                            {cw.imageUrl ? (
                                                <img src={cw.imageUrl} alt={cw.name} />
                                            ) : (
                                                <span>🚗</span>
                                            )}
                                            <div className="hp-cw__badge">
                                                <Star size={12} fill="currentColor" />
                                                {cw.avgRating?.toFixed(1) || '—'}
                                            </div>
                                        </div>
                                        <div className="hp-cw__body">
                                            <h3 className="hp-cw__name">{cw.name}</h3>
                                            <p className="hp-cw__addr">
                                                <MapPin size={14} />
                                                {cw.address}
                                            </p>
                                            <div className="hp-cw__tags">
                                                <span>Exterior</span>
                                                <span>Detailing</span>
                                            </div>
                                            <div className="hp-cw__foot">
                                                <span className="hp-cw__reviews">{cw.reviewCount || 0} reviews</span>
                                                <span className="hp-cw__booknow">
                                                    Book Now <ArrowRight size={14} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </Section>

            {/* ═══ WHY US ═══ */}
            <Section className="hp-why" id="why-us">
                <div className="container">
                    <div className="hp-section-head">
                        <span className="hp-section-head__tag">Why WashCO</span>
                        <h2>Built for car lovers</h2>
                        <p>We partner only with the best — so you don't have to worry.</p>
                    </div>

                    <div className="hp-why__grid">
                        {[
                            { icon: <Shield size={24} />, title: 'Verified Partners', desc: 'Every car wash on our platform is hand-verified for quality and professionalism.' },
                            { icon: <Zap size={24} />, title: 'Instant Booking', desc: 'No calls, no waiting. Pick a slot and get confirmed in seconds.' },
                            { icon: <Droplets size={24} />, title: 'Premium Products', desc: 'Only pH-neutral, scratch-free formulas used by our partner washes.' },
                            { icon: <Star size={24} />, title: 'Honest Reviews', desc: 'Real ratings from real customers — no fakes, no paid reviews.' },
                            { icon: <Clock size={24} />, title: 'Flexible Scheduling', desc: 'Early morning or late evening — book a slot that fits your life.' },
                            { icon: <CheckCircle size={24} />, title: 'Satisfaction Guaranteed', desc: "Not happy? We'll make it right or refund your booking — no questions asked." },
                        ].map((item, i) => (
                            <div className="hp-why__card" key={i}>
                                <div className="hp-why__icon">{item.icon}</div>
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ═══ CTA ═══ */}
            <Section className="hp-cta">
                <div className="container hp-cta__inner">
                    <h2>Ready for a sparkling ride?</h2>
                    <p>Join 50,000+ happy car owners. Find the best car wash near you today.</p>
                    <div className="hp-cta__actions">
                        <Link to="/register">
                            <Button variant="primary" size="lg">
                                Get Started Free
                                <ArrowRight size={18} />
                            </Button>
                        </Link>
                        <a href="#how-it-works">
                            <Button variant="ghost" size="lg">
                                Learn More
                            </Button>
                        </a>
                    </div>
                </div>
            </Section>
        </div>
    );
}
