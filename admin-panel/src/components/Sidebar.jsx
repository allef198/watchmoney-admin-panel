
import { NavLink } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const NAV_LINKS = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/usuarios', label: 'Usuários', icon: '👥' },
    { to: '/financeiro', label: 'Saques', icon: '💰' },
    { to: '/convites', label: 'Convites', icon: '🤝' },
    { to: '/anti-fraude', label: 'Anti-Fraude', icon: '🛡️' },
    { to: '/notificacoes', label: 'Notificações', icon: '🔔' },
    { to: '/configuracoes', label: 'Configurações', icon: '⚙️' },
    { to: '/logs', label: 'Logs', icon: '📜' },
];

const Sidebar = ({ isMobileOpen, closeMobileSidebar }) => {
    const [user] = useAuthState(auth);

    const handleLogout = () => {
        if (confirm('Tem certeza que deseja sair?')) {
            auth.signOut().catch(err => console.error('Falha ao fazer logout:', err));
        }
    };

    const sidebarContent = (
        <>
            <div className="sidebar-brand">
                <div className="brand-logo">W</div>
                <div className="brand-info">
                    <span className="brand-title">WatchMoney</span>
                    <span className="brand-subtitle">Admin Panel</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {NAV_LINKS.map(link => (
                    <NavLink 
                        key={link.to} 
                        to={link.to} 
                        className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} 
                        onClick={closeMobileSidebar}
                    >
                        <span className="nav-icon">{link.icon}</span>
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            <footer className="sidebar-footer">
                {user && (
                     <div className="user-card">
                        <div className="user-avatar">{user.email ? user.email.charAt(0).toUpperCase() : 'A'}</div>
                        <div className="user-info">
                            <span className="user-email" title={user.email}>{user.email}</span>
                            <span className="user-role">Administrador</span>
                        </div>
                    </div>
                )}
                <button onClick={handleLogout} className="btn btn-ghost btn-block logout-btn-sidebar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span>Sair</span>
                </button>
            </footer>
        </>
    );

    return (
        <>
            <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                {sidebarContent}
            </aside>
            {isMobileOpen && <div className="sidebar-overlay" onClick={closeMobileSidebar}></div>}
        </>
    );
};

export default Sidebar;
