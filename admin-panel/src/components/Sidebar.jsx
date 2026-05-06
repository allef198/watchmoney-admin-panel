import { NavLink } from 'react-router-dom';
import { ADMIN_UID } from '../firebase.js';

export default function Sidebar({ onLogout, user }) {
  return (
    <aside className="sidebar" data-testid="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">W</div>
        <div>
          <div className="brand-title">WatchMoney</div>
          <div className="brand-subtitle">Admin Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} data-testid="nav-dashboard">
          <span className="nav-icon">▦</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/saques" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} data-testid="nav-saques">
          <span className="nav-icon">₿</span>
          <span>Saques</span>
        </NavLink>
        <NavLink to="/financeiro" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} data-testid="nav-financeiro">
          <span className="nav-icon">R$</span>
          <span>Financeiro</span>
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} data-testid="nav-logs">
          <span className="nav-icon">≡</span>
          <span>Logs</span>
        </NavLink>
        <NavLink to="/configuracoes" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} data-testid="nav-config">
          <span className="nav-icon">⚙</span>
          <span>Configurações</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{(user?.email || '?').charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-email" title={user?.email}>{user?.email}</div>
            <div className="user-role">
              {user?.uid === ADMIN_UID ? 'Administrador' : 'Usuário'}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-block" onClick={onLogout} data-testid="logout-btn">
          Sair
        </button>
      </div>
    </aside>
  );
}
