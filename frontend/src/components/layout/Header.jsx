import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import { Sun, Moon, LogOut, User, Menu } from 'lucide-react';
import './Header.css';

export default function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <header className="header">
            <div className="container">
                <div className="header-content">
                    <Link to="/" className="logo">
                        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                            <defs>
                                <linearGradient id="grad1" x1="0" y1="0" x2="48" y2="48">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                            <circle cx="24" cy="24" r="22" stroke="url(#grad1)" strokeWidth="2.5" />
                            <circle cx="16" cy="32" r="4" fill="#6366f1" />
                            <circle cx="32" cy="32" r="4" fill="#8b5cf6" />
                            <path d="M14 24c2-6 6-12 10-12s8 6 10 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span>WashCO</span>
                    </Link>

                    <nav className="nav">
                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {(!isAuthenticated || user?.role === 'customer') && (
                            <Link to="/" className={`nav-link ${isActive('/')}`}>Find Car Washes</Link>
                        )}

                        {isAuthenticated ? (
                            <>
                                {user.role === 'customer' && (
                                    <Link to="/bookings" className={`nav-link ${isActive('/bookings')}`}>My Bookings</Link>
                                )}
                                {user.role === 'manager' && (
                                    <Link to="/manager" className={`nav-link ${isActive('/manager')}`}>Dashboard</Link>
                                )}
                                {user.role === 'super_admin' && (
                                    <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>Admin</Link>
                                )}

                                <div className="user-menu">
                                    <span className="user-name">{user.fullName}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="gap-2"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Login</Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="primary" size="sm">Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
