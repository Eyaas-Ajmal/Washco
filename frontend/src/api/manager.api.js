import client from './client';

// Services
export const getServices = async () => {
    const { data } = await client.get('/manager/services');
    return data.data;
};

export const createService = async (serviceData) => {
    const { data } = await client.post('/manager/services', serviceData);
    return data.data;
};

export const updateService = async (id, updates) => {
    const { data } = await client.put(`/manager/services/${id}`, updates);
    return data.data;
};

export const deleteService = async (id) => {
    const { data } = await client.delete(`/manager/services/${id}`);
    return data.data;
};

// Slots
export const getSlots = async (startDate, endDate) => {
    const { data } = await client.get('/manager/slots', {
        params: { startDate, endDate },
    });
    return data.data;
};

export const generateSlots = async ({ startDate, endDate, slotDuration, capacity }) => {
    const { data } = await client.post('/manager/slots/generate', {
        startDate,
        endDate,
        slotDuration,
        capacity,
    });
    return data.data;
};

export const blockSlot = async (id) => {
    const { data } = await client.post(`/manager/slots/${id}/block`);
    return data.data;
};

export const unblockSlot = async (id) => {
    const { data } = await client.post(`/manager/slots/${id}/unblock`);
    return data.data;
};

// Operating Hours
export const getOperatingHours = async () => {
    const { data } = await client.get('/manager/slots/operating-hours');
    return data.data;
};

export const setOperatingHours = async (hours) => {
    const { data } = await client.put('/manager/slots/operating-hours', { hours });
    return data.data;
};
