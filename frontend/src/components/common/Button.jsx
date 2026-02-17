import { motion } from 'framer-motion';
import './Components.css';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    type = 'button',
    disabled = false,
    ...props
}) {
    // Construct class names based on props
    const buttonClasses = `btn btn-${variant} btn-${size} ${className}`;

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </motion.button>
    );
}
