
import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS, mapUserDoc } from '../firestoreSchema';
import { formatDateTime, formatPoints } from '../utils/formatters';
import { exportUsersToCSV } from '../utils/export';
import UserDetailsModal from '../components/UserDetailsModal';
import AdjustPointsModal from '../components/AdjustPointsModal';
import ConfirmModal from '../components/ConfirmModal';
import { logAdminAction } from '../utils/logUtils';

const getShortUid = (value) => {
  if (!value || typeof value !== 'string') return 'UID inválido';
  return value.slice(0, 8);
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isPointsModalOpen, setPointsModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, FIRESTORE_COLLECTIONS.users);
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(mapUserDoc);
      setUsers(usersList);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const safeUsers = users || [];
    return safeUsers.filter(user => {
      if (!user) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.email?.toLowerCase().includes(searchLower) || 
        user.uid?.toLowerCase().includes(searchLower);

      const matchesFilter = filter === 'all' || 
        (filter === 'active' && !user.blocked) ||
        (filter === 'blocked' && user.blocked);

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filter]);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUsers(prevUsers => prevUsers.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    fetchUsers(); // Re-fetch to ensure consistency
  }, [fetchUsers]);

  const handleAction = async (action, user, reason = '') => {
    if (!user || !user.uid) return;
    setLoading(true);
    
    const userRef = doc(db, FIRESTORE_COLLECTIONS.users, user.uid);
    let updateData = {};
    let logAction = '';

    switch(action) {
        case 'block_user':
            updateData = { blocked: true };
            logAction = 'Bloqueio de usuário';
            break;
        case 'unblock_user':
            updateData = { blocked: false };
            logAction = 'Desbloqueio de usuário';
            break;
        default:
            setLoading(false);
            return;
    }

    try {
        await updateDoc(userRef, updateData);
        await logAdminAction(logAction, { targetUid: user.uid, reason });
        
        setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, ...updateData } : u));
        
    } catch (error) {
        console.error(`Falha ao ${action} o usuário:`, error);
        setError(`Falha ao executar a ação.`);
    } finally {
        setLoading(false);
        setConfirmModalOpen(false);
        setConfirmAction(null);
    }
  };

  const openConfirmation = (action, user) => {
    setSelectedUser(user);
    setConfirmAction({ action });
    setConfirmModalOpen(true);
  };

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <div className="page-header">
        <h1>Usuários</h1>
        <button className="btn btn-primary" onClick={() => exportUsersToCSV(filteredUsers || [])}>Exportar CSV</button>
      </div>

      <div className="filters-bar card card-body">
         <input 
            type="text" 
            placeholder="Buscar por email ou UID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-control">
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="blocked">Bloqueados</option>
          </select>
      </div>

      <div className="card">
          <div className="table-wrap">
              <table className="table">
                  <thead>
                      <tr><th>Email</th><th>UID</th><th>Pontos</th><th>Cadastro</th><th>Status</th><th>Ações</th></tr>
                  </thead>
                  <tbody>
                  {loading && !users.length ? (
                      <tr><td colSpan="6">Carregando...</td></tr>
                  ) : (filteredUsers || []).length > 0 ? (
                      (filteredUsers || []).map(user => (
                          <tr key={user.uid}>
                              <td>{user.email || 'Não informado'}</td>
                              <td>{getShortUid(user.uid)}</td>
                              <td>{formatPoints(user.points, '0')}</td>
                              <td>{formatDateTime(user.createdAt)}</td>
                              <td>{user.blocked ? <span className="status-badge status-rejected">Bloqueado</span> : <span className="status-badge status-paid">Ativo</span>}</td>
                              <td className="actions-col">
                                  <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedUser(user); setDetailsModalOpen(true); }}>Detalhes</button>
                                  <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedUser(user); setPointsModalOpen(true); }}>Ajustar</button>
                                  {user.blocked ? (
                                      <button className="btn btn-sm btn-ghost" onClick={() => openConfirmation('unblock_user', user)}>Desbloquear</button>
                                  ) : (
                                      <button className="btn btn-sm btn-danger" onClick={() => openConfirmation('block_user', user)}>Bloquear</button>
                                  )}
                              </td>
                          </tr>
                      ))
                  ) : (
                      <tr><td colSpan="6" className="text-center muted">Nenhum usuário encontrado.</td></tr>
                  )}
                  </tbody>
              </table>
          </div>
      </div>

      {isDetailsModalOpen && <UserDetailsModal user={selectedUser} onClose={() => setDetailsModalOpen(false)} />} 
      {isPointsModalOpen && <AdjustPointsModal user={selectedUser} onClose={() => setPointsModalOpen(false)} onSave={handleUserUpdate} />} 
      
      {isConfirmModalOpen && (
          <ConfirmModal
              open={isConfirmModalOpen}
              title={confirmAction?.action.includes('unblock') ? "Confirmar Desbloqueio" : "Confirmar Bloqueio"}
              description={`Você tem certeza que deseja ${confirmAction?.action.includes('unblock') ? 'desbloquear' : 'bloquear'} este usuário?`}
              onConfirm={(reason) => handleAction(confirmAction.action, selectedUser, reason)}
              onClose={() => setConfirmModalOpen(false)}
              loading={loading}
              requireReason={confirmAction?.action.includes('block')}
              variant={confirmAction?.action.includes('unblock') ? 'primary' : 'danger'}
          />
      )}
    </>
  );
};

export default Users;
