
import { useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const getPageTitle = (pathname) => {
    const titles = {
        '/': 'Dashboard',
        '/usuarios': 'Usuários',
        '/financeiro': 'Saques e Financeiro',
        '/convites': 'Convites',
        '/anti-fraude': 'Anti-Fraude',
        '/configuracoes': 'Configurações',
        '/logs': 'Logs de Atividade',
        '/notificacoes': 'Notificações',
    };
    if (titles[pathname]) return titles[pathname];
    if (pathname.startsWith('/usuarios/')) return 'Detalhes do Usuário';
    return 'WatchMoney Admin';
};

const Header = ({ toggleSidebar }) => {
    const location = useLocation();
    const [user] = useAuthState(auth);
    const title = getPageTitle(location.pathname);

    const handleLogout = () => {
        if (confirm('Tem certeza que deseja sair?')) {
            auth.signOut().catch(err => console.error('Falha ao fazer logout:', err));
        }
    };

    return (
        <header className="app-header">
            <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Abrir menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
            <div className="header-content">
                <h1 className="header-title">{title}</h1>
                {user && (
                    <div className="header-user">
                         <div className="user-info">
                            <span className="user-email" title={user.email}>{user.email}</span>
                            <span className="user-role">Admin</span>
                        </div>
                        <button onClick={handleLogout} className="btn btn-sm btn-ghost logout-btn" title="Sair">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
