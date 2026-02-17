import { motion } from 'framer-motion';
import './Components.css';

export default function Input({
    label,
    id,
    error,
    type = 'text',
    className = '',
    ...props
}) {
    return (
        <div className={`input-group ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="input-label"
                >
                    {label}
                </label>
            )}
            <motion.input
                whileFocus={{ scale: 1.01 }}
                type={type}
                id={id}
                className={`input-field ${error ? 'error' : ''}`}
                {...props}
            />
            {error && (
                <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="input-error-msg"
                >
                    {error}
                </motion.span>
            )}
        </div>
    );
}
