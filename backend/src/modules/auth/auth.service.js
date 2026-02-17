import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import * as authRepository from './auth.repository.js';
import { generateToken, hashToken, parseDuration } from '../../utils/helpers.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../middleware/errorHandler.js';

/**
 * Register a new user
 */
export const register = async ({ email, password, fullName, phone, role = 'customer' }) => {
    // Check if user already exists
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
        throw new ConflictError('An account with this email already exists.');
    }

    // Hash password
    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
    });

    // Create user
    const user = await authRepository.create({
        email,
        passwordHash,
        fullName,
        phone,
        role,
    });

    return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
    };
};

/**
 * Login user and generate tokens
 */
export const login = async ({ email, password }) => {
    // Find user
    const user = await authRepository.findByEmail(email);
    if (!user) {
        throw new UnauthorizedError('Invalid email or password.');
    }

    // Verify password
    const isValid = await argon2.verify(user.password_hash, password);
    if (!isValid) {
        throw new UnauthorizedError('Invalid email or password.');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const { refreshToken, refreshTokenHash, expiresAt } = generateRefreshToken();

    // Store refresh token
    await authRepository.createRefreshToken(user.id, refreshTokenHash, expiresAt);

    return {
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: user.tenant_id,
        },
        accessToken,
        refreshToken,
        expiresAt,
    };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required.');
    }

    const tokenHash = hashToken(refreshToken);
    const tokenData = await authRepository.findRefreshToken(tokenHash);

    if (!tokenData) {
        throw new UnauthorizedError('Invalid refresh token.');
    }

    if (tokenData.is_revoked) {
        throw new UnauthorizedError('Refresh token has been revoked.');
    }

    if (new Date(tokenData.expires_at) < new Date()) {
        throw new UnauthorizedError('Refresh token has expired.');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role,
        tenant_id: tokenData.tenant_id,
    });

    return {
        accessToken,
        user: {
            id: tokenData.user_id,
            email: tokenData.email,
            fullName: tokenData.full_name,
            role: tokenData.role,
            tenantId: tokenData.tenant_id,
        },
    };
};

/**
 * Logout user (revoke refresh token)
 */
export const logout = async (refreshToken) => {
    if (!refreshToken) return;

    const tokenHash = hashToken(refreshToken);
    await authRepository.revokeRefreshToken(tokenHash);
};

/**
 * Logout from all devices
 */
export const logoutAll = async (userId) => {
    await authRepository.revokeAllUserTokens(userId);
};

/**
 * Get user profile
 */
export const getProfile = async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) {
        throw new BadRequestError('User not found.');
    }

    return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenant_id,
        isVerified: user.is_verified,
        createdAt: user.created_at,
    };
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, data) => {
    const user = await authRepository.update(userId, data);
    return user;
};

// Helper functions
function generateAccessToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
}

function generateRefreshToken() {
    const refreshToken = generateToken(32);
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + parseDuration(config.jwt.refreshExpiresIn));

    return { refreshToken, refreshTokenHash, expiresAt };
}

export default {
    register,
    login,
    refreshAccessToken,
    logout,
    logoutAll,
    getProfile,
    updateProfile,
};
