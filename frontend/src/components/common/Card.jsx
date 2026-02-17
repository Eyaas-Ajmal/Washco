import { motion } from 'framer-motion';
import './Components.css';

export default function Card({ children, className = '', hoverEffect = false, ...props }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`card ${className}`}
            whileHover={hoverEffect ? { y: -5, boxShadow: 'var(--shadow-glass)' } : {}}
            {...props}
        >
            {children}
        </motion.div>
    );
}
