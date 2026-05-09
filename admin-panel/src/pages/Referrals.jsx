import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS, mapUserDoc, mapReferralBonusDoc } from '../firestoreSchema';
import ReferrersTable from '../components/ReferrersTable';
import PendingBonusesTable from '../components/PendingBonusesTable';
import ReferrerDetailsModal from '../components/ReferrerDetailsModal';

const Referrals = () => {
  const [users, setUsers] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });

  useEffect(() => {
    const usersQuery = query(collection(db, FIRESTORE_COLLECTIONS.users));
    const bonusesQuery = query(collection(db, FIRESTORE_COLLECTIONS.referralPendingFirstWithdrawalRewards));

    const usersUnsub = onSnapshot(usersQuery, (snap) => setUsers(snap.docs.map(mapUserDoc)), (err) => setError(`Users: ${err.message}`));
    const bonusesUnsub = onSnapshot(bonusesQuery, (snap) => setBonuses(snap.docs.map(mapReferralBonusDoc)), (err) => setError(`Bonuses: ${err.message}`));

    setLoading(false);
    return () => { usersUnsub(); bonusesUnsub(); };
  }, []);

  const processedData = useMemo(() => {
    const referrers = users.filter(u => u.referralCode);
    const invited = users.filter(u => u.referredBy);

    referrers.forEach(referrer => {
        referrer.invitedUsers = invited.filter(i => i.referredBy === referrer.uid);
        referrer.validInvitedUsers = referrer.invitedUsers.filter(i => i.firstWithdrawalReferralBonusPaid).length;
        referrer.pendingBonuses = bonuses.filter(b => b.referrerUid === referrer.uid).length;
    });

    return { referrers, invited, bonuses };
  }, [users, bonuses]);

  const handleAction = (type, data) => {
    if (type === 'details') {
      const invitedUsers = processedData.invited.filter(u => u.referredBy === data.uid);
      setModal({ type: 'details', data: { user: data, invitedUsers } });
    }
    if (type === 'copy') navigator.clipboard.writeText(data);
  };

  const summaryCards = useMemo(() => ({
    totalReferrers: processedData.referrers.length,
    totalInvited: processedData.invited.length,
    totalValidInvited: processedData.invited.filter(u=>u.firstWithdrawalReferralBonusPaid).length,
    totalPendingBonuses: processedData.bonuses.length,
  }),[processedData]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;

  return (
    <div className="dashboard">
      <h1>Convites e Indicações</h1>

      <section className="stats-grid">
        <div className="stat-card">Usuários com código: {summaryCards.totalReferrers}</div>
        <div className="stat-card">Total de convidados: {summaryCards.totalInvited}</div>
        <div className="stat-card">Convidados válidos: {summaryCards.totalValidInvited}</div>
        <div className="stat-card">Bônus pendentes: {summaryCards.totalPendingBonuses}</div>
      </section>

      <h2>Ranking de Indicadores</h2>
      <ReferrersTable referrers={processedData.referrers} onAction={handleAction} />

      <h2>Bônus de Primeiro Saque Pendentes</h2>
      <PendingBonusesTable bonuses={processedData.bonuses} onAction={handleAction} />

      {modal.type === 'details' && 
        <ReferrerDetailsModal 
            isOpen={true} 
            user={modal.data.user} 
            invitedUsers={modal.data.invitedUsers} 
            onClose={() => setModal({ type: null, data: null })} 
        />
      }
    </div>
  );
};

export default Referrals;
