import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Database — supports either DATABASE_URL or individual fields
  DATABASE_URL: Joi.string().uri().optional(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.when('DATABASE_URL', { is: Joi.exist(), then: Joi.string().optional(), otherwise: Joi.string().required() }),
  DB_USER: Joi.when('DATABASE_URL', { is: Joi.exist(), then: Joi.string().optional(), otherwise: Joi.string().required() }),
  DB_PASSWORD: Joi.when('DATABASE_URL', { is: Joi.exist(), then: Joi.string().optional(), otherwise: Joi.string().required() }),
  DB_SSL: Joi.string().default('false'),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().min(32).required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  console.error('❌ Environment validation error:', error.message);
  process.exit(1);
}

// Build database config: prefer DATABASE_URL if provided
const sslConfig = envVars.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const dbConfig = envVars.DATABASE_URL
  ? {
    connectionString: envVars.DATABASE_URL,
    ssl: sslConfig,
  }
  : {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    database: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    ssl: sslConfig,
  };

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,

  db: dbConfig,

  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
  },

  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
  },

  cors: {
    origin: envVars.CORS_ORIGIN,
  },

  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
};

export default config;
