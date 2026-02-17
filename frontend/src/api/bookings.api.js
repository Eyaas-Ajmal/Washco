import client from './client';

// Customer
export const createBooking = async ({ tenantId, serviceId, slotId, notes }) => {
    const { data } = await client.post('/bookings', {
        tenantId,
        serviceId,
        slotId,
        notes,
    });
    return data.data;
};

export const getMyBookings = async ({ status, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);

    const { data } = await client.get(`/bookings/my?${params}`);
    return data.data;
};

export const cancelMyBooking = async (bookingId, reason) => {
    const { data } = await client.patch(`/bookings/${bookingId}/cancel`, { reason });
    return data.data;
};

// Manager
export const getTenantBookings = async ({ status, startDate, endDate, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', page);
    params.append('limit', limit);

    const { data } = await client.get(`/bookings/tenant?${params}`);
    return data.data;
};

export const updateBookingStatus = async (bookingId, status) => {
    const { data } = await client.patch(`/bookings/${bookingId}/status`, { status });
    return data.data;
};

export const cancelBookingAsManager = async (bookingId, reason) => {
    const { data } = await client.patch(`/bookings/${bookingId}/manager-cancel`, { reason });
    return data.data;
};

export const getDashboardStats = async () => {
    const { data } = await client.get('/bookings/dashboard');
    return data.data;
};

// Reviews
export const createReview = async ({ bookingId, rating, comment }) => {
    const { data } = await client.post('/reviews', { bookingId, rating, comment });
    return data.data;
};
