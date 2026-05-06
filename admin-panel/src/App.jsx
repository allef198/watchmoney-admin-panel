import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, ADMIN_UID } from './firebase.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Financeiro from './pages/Financeiro.jsx';
import Users from './pages/Users.jsx';
import UserDetails from './pages/UserDetails.jsx';
import Logs from './pages/Logs.jsx';
import Settings from './pages/Settings.jsx';
import GlobalNotice from './pages/GlobalNotice.jsx';
import Sidebar from './components/Sidebar.jsx';
import AccessDenied from './components/AccessDenied.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-screen" data-testid="app-loading">
        <div className="spinner" />
        <p>Carregando…</p>
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Autenticado mas não é admin
  if (user.uid !== ADMIN_UID) {
    return <AccessDenied user={user} onLogout={handleLogout} />;
  }

  // Admin autenticado
  return (
    <div className="app-shell">
      <Sidebar onLogout={handleLogout} user={user} />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/saques" element={<Dashboard />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/usuarios/:uid" element={<UserDetails />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="/aviso-global" element={<GlobalNotice />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
