import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS, mapUserDoc, mapWithdrawRequestDoc } from '../firestoreSchema';
import AntiFraudUserTable from '../components/AntiFraudUserTable';
import ConfirmModal from '../components/ConfirmModal';
import FraudNoteModal from '../components/FraudNoteModal';
import UserDetailsModal from '../components/UserDetailsModal'; // Assuming this exists

const RISK_LEVELS = { HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo' };

export default function AntiFraud() {
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    // Fetching logic remains the same
    const unsubscribers = [];
    const dataLoaded = { users: false, withdrawals: false };
    const checkAllDataLoaded = () => {
      if (Object.values(dataLoaded).every(Boolean)) setLoading(false);
    };
    const userUnsub = onSnapshot(collection(db, FIRESTORE_COLLECTIONS.users), snap => {
      setUsers(snap.docs.map(mapUserDoc));
      dataLoaded.users = true;
      checkAllDataLoaded();
    }, err => { setError(`Erro: ${err.message}`); setLoading(false); });
    const withdrawUnsub = onSnapshot(collection(db, FIRESTORE_COLLECTIONS.withdrawRequests), snap => {
      setWithdrawals(snap.docs.map(mapWithdrawRequestDoc));
      dataLoaded.withdrawals = true;
      checkAllDataLoaded();
    }, err => { setError(`Erro: ${err.message}`); setLoading(false); });
    unsubscribers.push(userUnsub, withdrawUnsub);
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const processedUsers = useMemo(() => {
    // This logic should be shared or passed down, but for simplicity, we recalculate here.
    // In a real app, this would be derived from a single source of truth.
    if (!users.length) return [];
    return users.map(user => ({
        ...user,
        // Simplified risk analysis for summary - in reality, this would be more complex
        riskLevel: user.blocked || user.withdrawBlocked ? RISK_LEVELS.HIGH : RISK_LEVELS.LOW 
    }));
  }, [users]);

  const summaryStats = useMemo(() => {
    const pixKeyUsage = withdrawals.reduce((acc, w) => {
      if (w.pixKey && w.uid) {
        if (!acc[w.pixKey]) acc[w.pixKey] = new Set();
        acc[w.pixKey].add(w.uid);
      }
      return acc;
    }, {});
    return {
      usersWithAlert: processedUsers.filter(u => u.riskLevel !== RISK_LEVELS.LOW).length,
      suspiciousPendingWithdrawals: 0, // Placeholder
      withdrawBlockedUsers: users.filter(u => u.withdrawBlocked).length,
      blockedAccounts: users.filter(u => u.blocked).length,
      repeatedPixKeys: Object.values(pixKeyUsage).filter(uids => uids.size > 1).length,
      suspiciousReferrers: 0, // Placeholder
    };
  }, [users, withdrawals, processedUsers]);

  const handleAction = (type, data) => setModal({ type, data });

  const handleCloseModal = () => setModal({ type: null, data: null });

  const handleBlockAction = async (actionType, reason) => {
    const user = modal.data;
    if (!user || !reason) return;

    const batch = writeBatch(db);
    const userRef = doc(db, FIRESTORE_COLLECTIONS.users, user.uid);

    const updateData = {
      updatedAt: serverTimestamp(),
      fraudNote: `[${new Date().toISOString()}] ${actionType === 'account' ? 'Conta bloqueada' : 'Saque bloqueado'}. Motivo: ${reason}`,
    };

    if (actionType === 'account') updateData.blocked = true;
    if (actionType === 'withdraw') updateData.withdrawBlocked = true;

    batch.update(userRef, updateData);

    try {
      await batch.commit();
      setFeedback({ type: 'success', message: `Usuário ${actionType === 'account' ? 'bloqueado' : 'com saque bloqueado'}.` });
    } catch (err) {
      setFeedback({ type: 'error', message: `Erro ao processar: ${err.message}` });
    } finally {
      handleCloseModal();
    }
  };

  return (
    <div className="dashboard">
      <header className="page-header"><h1>Anti-fraude</h1><p className="muted">Análise de atividades suspeitas.</p></header>
      
      {feedback.message && <div className={`alert alert-${feedback.type}`}>{feedback.message}</div>}
      
      <section className="stats-grid">{/* Stats cards remain the same */}</section>

      <div style={{ marginTop: '2rem' }}>
        {loading ? <p>Carregando...</p> : <AntiFraudUserTable users={users} withdrawals={withdrawals} onAction={handleAction} />}
      </div>

      {modal.type === 'view-details' && <UserDetailsModal user={modal.data} open={true} onClose={handleCloseModal} />} 

      {modal.type === 'add-note' && (
        <FraudNoteModal user={modal.data} isOpen={true} onClose={handleCloseModal} onFeedback={setFeedback} />
      )}

      {(modal.type === 'block-account' || modal.type === 'block-withdraw') && (
        <ConfirmModal
          open={true}
          onClose={handleCloseModal}
          title={modal.type === 'block-account' ? 'Bloquear Conta' : 'Bloquear Saques'}
          description={`Você tem certeza que deseja ${modal.type === 'block-account' ? 'bloquear a conta' : 'bloquear os saques'} de ${modal.data.email}?`}
          warning="Esta ação é irreversível e será registrada."
          requireReason={true}
          onConfirm={(reason) => handleBlockAction(modal.type === 'block-account' ? 'account' : 'withdraw', reason)}
        />
      )}
    </div>
  );
}
