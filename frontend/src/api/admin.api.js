import client from './client';

export const getDashboard = async () => {
    const { data } = await client.get('/admin/dashboard');
    return data.data;
};

export const getTenants = async ({ status, search, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);

    const { data } = await client.get(`/admin/tenants?${params}`);
    return data.data;
};

export const approveTenant = async (id) => {
    const { data } = await client.patch(`/admin/tenants/${id}/approve`);
    return data.data;
};

export const suspendTenant = async (id) => {
    const { data } = await client.patch(`/admin/tenants/${id}/suspend`);
    return data.data;
};

export const getUsers = async ({ role, page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    params.append('page', page);
    params.append('limit', limit);

    const { data } = await client.get(`/admin/users?${params}`);
    return data.data;
};

export const deleteUser = async (id) => {
    const { data } = await client.delete(`/admin/users/${id}`);
    return data;
};

export const createManager = async ({ email, password, fullName, phone }) => {
    const { data } = await client.post('/admin/users/create-manager', { email, password, fullName, phone });
    return data;
};

export const getAuditLogs = async ({ userId, tenantId, action, page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (tenantId) params.append('tenantId', tenantId);
    if (action) params.append('action', action);
    params.append('page', page);
    params.append('limit', limit);

    const { data } = await client.get(`/admin/audit-logs?${params}`);
    return data.data;
};
