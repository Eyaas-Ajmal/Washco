import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="auth-container">
            {/* Animated Background */}
            <div className="auth-background">
                <div className="auth-blob blob-1"></div>
                <div className="auth-blob blob-2"></div>
                <div className="auth-blob blob-3"></div>
            </div>

            {/* Content Card */}
            <div className="auth-card-wrapper">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="auth-card"
                >
                    <div className="auth-header">
                        <Link to="/">
                            <motion.div
                                whileHover={{ rotate: 5, scale: 1.1 }}
                                className="auth-logo"
                            >
                                🌊
                            </motion.div>
                        </Link>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="auth-title"
                        >
                            {title}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="auth-subtitle"
                        >
                            {subtitle}
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
