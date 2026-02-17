import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleRoute, GuestRoute } from './routes/Guards';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import CarWashDetailPage from './pages/public/CarWashDetailPage';

// Customer pages
import CustomerBookingsPage from './pages/customer/CustomerBookingsPage';

// Manager pages
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// Redirect admins/managers away from homepage to their dashboards
function HomeRedirect() {
    const { user, isAuthenticated } = useAuth();
    if (isAuthenticated && user?.role === 'super_admin') return <Navigate to="/admin" replace />;
    if (isAuthenticated && user?.role === 'manager') return <Navigate to="/manager" replace />;
    return <HomePage />;
}

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                {/* Public routes — admins/managers get redirected to their dashboards */}
                <Route index element={<HomeRedirect />} />
                <Route path="/carwash/:slug" element={<CarWashDetailPage />} />

                {/* Guest-only routes (login/register) */}
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    {/* Customer routes */}
                    <Route element={<RoleRoute allowedRoles={['customer']} />}>
                        <Route path="/bookings" element={<CustomerBookingsPage />} />
                    </Route>

                    {/* Manager routes */}
                    <Route element={<RoleRoute allowedRoles={['manager']} />}>
                        <Route path="/manager" element={<ManagerDashboardPage />} />
                    </Route>

                    {/* Super Admin routes */}
                    <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
                        <Route path="/admin" element={<AdminDashboardPage />} />
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={
                    <div className="container" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                        <h1>404</h1>
                        <p>Page not found</p>
                    </div>
                } />
            </Route>
        </Routes>
    );
}
