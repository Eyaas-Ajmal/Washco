import * as slotsService from './slots.service.js';
import { createAuditLog } from '../../utils/audit.js';
import { getClientIp } from '../../utils/helpers.js';

/**
 * Get available slots (public)
 */
export const getAvailable = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const slots = await slotsService.getAvailableSlots(
            req.tenantId,
            startDate,
            endDate
        );
        res.json({ success: true, data: slots });
    } catch (error) {
        next(error);
    }
};

/**
 * Get slots for manager
 */
export const getForManager = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const slots = await slotsService.getSlotsForManager(
            req.tenantId,
            startDate,
            endDate
        );
        res.json({ success: true, data: slots });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate slots
 */
export const generate = async (req, res, next) => {
    try {
        const { startDate, endDate, slotDuration, capacity } = req.body;
        const result = await slotsService.generateSlots(
            req.tenantId,
            startDate,
            endDate,
            slotDuration,
            capacity
        );

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'GENERATE_SLOTS',
            entityType: 'slots',
            newValues: { startDate, endDate, created: result.created },
            ipAddress: getClientIp(req),
        });

        res.status(201).json({
            success: true,
            message: `Created ${result.created} new slots.`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update slot
 */
export const update = async (req, res, next) => {
    try {
        const slot = await slotsService.updateSlot(
            req.params.id,
            req.tenantId,
            req.body
        );
        res.json({ success: true, data: slot });
    } catch (error) {
        next(error);
    }
};

/**
 * Block slot
 */
export const block = async (req, res, next) => {
    try {
        const slot = await slotsService.toggleSlotBlock(
            req.params.id,
            req.tenantId,
            true
        );
        res.json({ success: true, data: slot });
    } catch (error) {
        next(error);
    }
};

/**
 * Unblock slot
 */
export const unblock = async (req, res, next) => {
    try {
        const slot = await slotsService.toggleSlotBlock(
            req.params.id,
            req.tenantId,
            false
        );
        res.json({ success: true, data: slot });
    } catch (error) {
        next(error);
    }
};

/**
 * Get operating hours
 */
export const getOperatingHours = async (req, res, next) => {
    try {
        const hours = await slotsService.getOperatingHours(req.tenantId);
        res.json({ success: true, data: hours });
    } catch (error) {
        next(error);
    }
};

/**
 * Set operating hours
 */
export const setOperatingHours = async (req, res, next) => {
    try {
        const hours = await slotsService.setOperatingHours(
            req.tenantId,
            req.body.hours
        );

        await createAuditLog({
            userId: req.user.id,
            tenantId: req.tenantId,
            action: 'UPDATE_OPERATING_HOURS',
            entityType: 'operating_hours',
            newValues: req.body.hours,
            ipAddress: getClientIp(req),
        });

        res.json({ success: true, data: hours });
    } catch (error) {
        next(error);
    }
};

export default {
    getAvailable,
    getForManager,
    generate,
    update,
    block,
    unblock,
    getOperatingHours,
    setOperatingHours,
};
