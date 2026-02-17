import * as slotsRepository from './slots.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../middleware/errorHandler.js';

/**
 * Get available slots for a tenant
 */
export const getAvailableSlots = async (tenantId, startDate, endDate) => {
    const slots = await slotsRepository.findByTenantAndDateRange(
        tenantId,
        startDate,
        endDate,
        'available'
    );

    return slots.map(formatSlot);
};

/**
 * Get all slots for manager
 */
export const getSlotsForManager = async (tenantId, startDate, endDate) => {
    const slots = await slotsRepository.findByTenantAndDateRange(
        tenantId,
        startDate,
        endDate
    );

    return slots.map(formatManagerSlot);
};

/**
 * Generate slots for date range
 */
export const generateSlots = async (tenantId, startDate, endDate, slotDuration = 60, capacity = 1) => {
    // Get operating hours
    const operatingHours = await slotsRepository.getOperatingHours(tenantId);

    if (operatingHours.length === 0) {
        throw new BadRequestError('Please set operating hours first.');
    }

    const hoursMap = new Map();
    for (const oh of operatingHours) {
        hoursMap.set(oh.day_of_week, oh);
    }

    // Convert dates to YYYY-MM-DD strings to avoid timezone issues
    const toDateString = (d) => {
        if (d instanceof Date) {
            // Get UTC date components (Joi sends UTC dates)
            return d.toISOString().split('T')[0];
        }
        return d; // Already a string
    };

    const startStr = toDateString(startDate);
    const endStr = toDateString(endDate);

    // Parse as local dates for iteration
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    const slots = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const oh = hoursMap.get(dayOfWeek);

        if (!oh || oh.is_closed) continue;

        // Format date as YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const slotDate = `${year}-${month}-${day}`;

        const [openHour, openMin] = oh.open_time.split(':').map(Number);
        const [closeHour, closeMin] = oh.close_time.split(':').map(Number);

        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        for (let m = openMinutes; m + slotDuration <= closeMinutes; m += slotDuration) {
            const startHour = Math.floor(m / 60);
            const startMin = m % 60;
            const endHour = Math.floor((m + slotDuration) / 60);
            const endMin = (m + slotDuration) % 60;

            const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`;
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

            slots.push({
                tenantId,
                slotDate,
                startTime,
                endTime,
                maxCapacity: capacity,
            });
        }
    }

    console.log(`[SLOTS] Generating ${slots.length} slots from ${startStr} to ${endStr}`);

    const created = await slotsRepository.bulkCreate(slots);
    return { created: created.length, total: slots.length };
};

/**
 * Update slot
 */
export const updateSlot = async (id, tenantId, data) => {
    const slot = await slotsRepository.findById(id);

    if (!slot) {
        throw new NotFoundError('Slot not found.');
    }

    if (slot.tenant_id !== tenantId) {
        throw new ForbiddenError('Access denied.');
    }

    return await slotsRepository.update(id, data);
};

/**
 * Block/unblock slot
 */
export const toggleSlotBlock = async (id, tenantId, block) => {
    const slot = await slotsRepository.findById(id);

    if (!slot) {
        throw new NotFoundError('Slot not found.');
    }

    if (slot.tenant_id !== tenantId) {
        throw new ForbiddenError('Access denied.');
    }

    if (block) {
        return await slotsRepository.blockSlot(id);
    } else {
        return await slotsRepository.unblockSlot(id);
    }
};

/**
 * Get operating hours
 */
export const getOperatingHours = async (tenantId) => {
    const hours = await slotsRepository.getOperatingHours(tenantId);
    return hours.map(formatOperatingHour);
};

/**
 * Set operating hours
 */
export const setOperatingHours = async (tenantId, hours) => {
    const result = await slotsRepository.setOperatingHours(tenantId, hours);
    return result.map(formatOperatingHour);
};

// Helpers
function formatSlot(slot) {
    return {
        id: slot.id,
        date: slot.slot_date,
        startTime: slot.start_time.substring(0, 5),
        endTime: slot.end_time.substring(0, 5),
        available: slot.max_capacity - slot.booked_count,
        status: slot.status,
    };
}

function formatOperatingHour(oh) {
    return {
        dayOfWeek: oh.day_of_week,
        openTime: oh.open_time.substring(0, 5),
        closeTime: oh.close_time.substring(0, 5),
        isClosed: oh.is_closed,
    };
}

function formatManagerSlot(slot) {
    return {
        id: slot.id,
        date: slot.slot_date,
        startTime: slot.start_time.substring(0, 5),
        endTime: slot.end_time.substring(0, 5),
        maxCapacity: slot.max_capacity,
        bookedCount: slot.booked_count,
        status: slot.status,
    };
}

export default {
    getAvailableSlots,
    getSlotsForManager,
    generateSlots,
    updateSlot,
    toggleSlotBlock,
    getOperatingHours,
    setOperatingHours,
};
