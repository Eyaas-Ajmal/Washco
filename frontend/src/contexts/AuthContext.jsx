import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken } from '../api/auth.api';
import { getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const userData = await getProfile();
            setUser(userData);
        } catch (error) {
            // Try refresh
            try {
                await refreshToken();
                const userData = await getProfile();
                setUser(userData);
            } catch {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        setUser(data.user);
        return data;
    };

    const register = async (name, email, password, role) => {
        const data = await apiRegister({ fullName: name, email, password, role });
        return data;
    };

    const logout = async () => {
        try {
            await apiLogout();
        } finally {
            setUser(null);
        }
    };

    const updateUser = (updates) => {
        setUser((prev) => ({ ...prev, ...updates }));
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isManager: user?.role === 'manager',
        isSuperAdmin: user?.role === 'super_admin',
        login,
        register,
        logout,
        updateUser,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default AuthContext;
