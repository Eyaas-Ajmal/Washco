import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);

            // If the user came from a specific page, go there
            // Otherwise, redirect based on role
            if (from !== '/' && from !== '/login') {
                navigate(from, { replace: true });
                return;
            }

            // Default redirects based on role
            const userRole = result?.user?.role || result?.role; // Handle potential structure differences

            switch (userRole) {
                case 'super_admin':
                    navigate('/admin', { replace: true });
                    break;
                case 'manager':
                    navigate('/manager', { replace: true });
                    break;
                case 'customer':
                default:
                    navigate('/bookings', { replace: true }); // Customer lands on their bookings or home
                    break;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to manage your car wash bookings"
        >
            <form onSubmit={handleSubmit} className="auth-form">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="auth-error-alert"
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}

                <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                />

                <div className="auth-field-group">
                    <div className="auth-label-row">
                        <label htmlFor="password" className="input-label">Password</label>
                        <Link to="#" className="auth-forgot-link">
                            Forgot password?
                        </Link>
                    </div>
                    {/* Input component handles the input field itself */}
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="no-label-margin" // Helper to remove default label margin if needed
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="auth-submit-btn"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="btn-content">
                            <span className="spinner-sm" />
                            Signing in...
                        </span>
                    ) : (
                        <span className="btn-content">
                            Sign In <ArrowRight size={18} />
                        </span>
                    )}
                </Button>
            </form>

            <div className="auth-footer">
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                    Create account
                </Link>
            </div>
        </AuthLayout>
    );
}
