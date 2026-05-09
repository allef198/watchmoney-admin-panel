
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, ADMIN_UID } from './firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Financeiro from './pages/Financeiro';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import Referrals from './pages/Referrals';
import AntiFraud from './pages/AntiFraud';
import AccessDenied from './components/AccessDenied';

const App = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="loading-screen">Carregando autenticação...</div>;
  }

  if (!user) {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
  }

  // Check if the logged-in user is the admin.
  const isAdmin = user.uid === ADMIN_UID;

  return (
      <Layout>
          <Routes>
              <Route path="/" element={isAdmin ? <Dashboard /> : <AccessDenied />} />
              <Route path="/usuarios" element={isAdmin ? <Users /> : <AccessDenied />} />
              <Route path="/financeiro" element={isAdmin ? <Financeiro /> : <AccessDenied />} />
              <Route path="/convites" element={isAdmin ? <Referrals /> : <AccessDenied />} />
              <Route path="/configuracoes" element={isAdmin ? <Settings /> : <AccessDenied />} />
              <Route path="/logs" element={isAdmin ? <Logs /> : <AccessDenied />} />
              <Route path="/notificacoes" element={isAdmin ? <Notifications /> : <AccessDenied />} />
              <Route path="/anti-fraude" element={isAdmin ? <AntiFraud /> : <AccessDenied />} />
              <Route path="/login" element={<Navigate to="/" />} />
              <Route path="*" element={<div className='page-header'><h1>404: Página Não Encontrada</h1></div>} />
          </Routes>
      </Layout>
  );
};

export default App;
