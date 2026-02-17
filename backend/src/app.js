import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/env.js';
import logger from './utils/logger.js';
import { defaultLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import tenantsRoutes from './modules/tenants/tenants.routes.js';
import tenantsPublicRoutes from './modules/tenants/tenants.public.routes.js';
import servicesRoutes from './modules/services/services.routes.js';
import slotsRoutes from './modules/slots/slots.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(cookieParser());

// Rate limiting (applied to all routes)
app.use(defaultLimiter);

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
        if (res.statusCode >= 400) {
            logger.warn(log);
        } else if (config.env === 'development') {
            logger.info(log);
        }
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'WashCO API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/carwashes', tenantsPublicRoutes);
app.use('/api/manager/services', servicesRoutes);
app.use('/api/manager/slots', slotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    logger.info(`🚀 WashCO API running on port ${PORT}`);
    logger.info(`📚 Environment: ${config.env}`);
});

export default app;
