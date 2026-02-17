import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-brand-section">
                        <Link to="/" className="footer-logo">
                            <span className="logo-emoji">🌊</span>
                            <span className="logo-text">WashCO</span>
                        </Link>
                        <p className="footer-desc">
                            The smartest way to book premium car wash services.
                            Experience shine like never before.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-link" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" className="social-link" aria-label="Twitter"><Twitter size={20} /></a>
                            <a href="#" className="social-link" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" className="social-link" aria-label="LinkedIn"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links-section">
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul className="footer-nav">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/bookings">My Bookings</Link></li>
                            <li><Link to="/login">Sign In</Link></li>
                            <li><Link to="/register">Create Account</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="footer-links-section">
                        <h4 className="footer-heading">Services</h4>
                        <ul className="footer-nav">
                            <li><a href="#">Exterior Wash</a></li>
                            <li><a href="#">Interior Detailing</a></li>
                            <li><a href="#">Full Service</a></li>
                            <li><a href="#">Ceramic Coating</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-contact-section">
                        <h4 className="footer-heading">Contact Us</h4>
                        <ul className="contact-list">
                            <li>
                                <MapPin size={18} className="contact-icon" />
                                <span>123 Shine Avenue, Clean City, ST 12345</span>
                            </li>
                            <li>
                                <Phone size={18} className="contact-icon" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li>
                                <Mail size={18} className="contact-icon" />
                                <span>support@washco.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} WashCO. All rights reserved.</p>
                    <div className="footer-legal">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
