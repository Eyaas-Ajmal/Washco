import client from './client';

// Public
export const getCarWashes = async ({ search, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);

    const { data } = await client.get(`/tenants?${params}`);
    return data.data;
};

export const getCarWashBySlug = async (slug) => {
    const { data } = await client.get(`/tenants/${slug}`);
    return data.data;
};

export const getCarWashServices = async (slug) => {
    const { data } = await client.get(`/carwashes/${slug}/services`);
    return data.data;
};

export const getCarWashSlots = async (slug, startDate, endDate) => {
    const { data } = await client.get(`/carwashes/${slug}/slots`, {
        params: { startDate, endDate },
    });
    return data.data;
};

export const getCarWashHours = async (slug) => {
    const { data } = await client.get(`/carwashes/${slug}/hours`);
    return data.data;
};

export const getReviews = async (tenantId, page = 1, limit = 10) => {
    const { data } = await client.get(`/reviews/tenant/${tenantId}`, {
        params: { page, limit },
    });
    return data.data;
};

// Manager
export const getOwnTenant = async () => {
    const { data } = await client.get('/tenants/manager/own');
    return data.data;
};

export const updateTenant = async (updates) => {
    const { data } = await client.patch('/tenants/manager/own', updates);
    return data.data;
};

export const createTenant = async (tenantData) => {
    const { data } = await client.post('/tenants', tenantData);
    return data.data;
};

export const uploadCarWashImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await client.post('/tenants/manager/own/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};
