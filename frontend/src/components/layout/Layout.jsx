import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
    const location = useLocation();

    return (
        <div className="layout min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300 flex flex-col">
            <Header />
            <main
                className="main-content flex-grow"
                style={{ width: '100%', minHeight: 'calc(100vh - 70px)' }}
            >
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
