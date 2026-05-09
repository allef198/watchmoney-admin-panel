
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-shell">
            <Sidebar isMobileOpen={isSidebarOpen} closeMobileSidebar={() => setSidebarOpen(false)} />
            <div className="app-main">
                <Header toggleSidebar={() => setSidebarOpen(prev => !prev)} />
                <main className="app-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
