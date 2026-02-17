import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}

export function RoleRoute({ allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
            </div>
        );
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export function GuestRoute() {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" style={{ width: 40, height: 40 }}></div>
            </div>
        );
    }

    if (isAuthenticated) {
        // Redirect based on role
        const from = location.state?.from?.pathname;
        if (from) {
            return <Navigate to={from} replace />;
        }

        switch (user?.role) {
            case 'super_admin':
                return <Navigate to="/admin" replace />;
            case 'manager':
                return <Navigate to="/manager" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}
