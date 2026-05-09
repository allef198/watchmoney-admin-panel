import React, { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';

const RISK_LEVELS = { HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo' };

const analyzeUserRisk = (user, allWithdrawals, allUsers) => {
  const reasons = [];
  let riskScore = 0;

  const userWithdrawals = allWithdrawals.filter(w => w.uid === user.uid);
  const rejectedWithdrawals = userWithdrawals.filter(w => w.status === 'rejected').length;
  const successfulWithdrawals = userWithdrawals.filter(w => w.status === 'paid' || w.status === 'approved');

  // Risk factor: Multiple rejected withdrawals
  if (rejectedWithdrawals > 2) {
    reasons.push(`${rejectedWithdrawals} saques rejeitados`);
    riskScore += rejectedWithdrawals;
  }

  // Risk factor: Withdrawals on the same day of account creation
  if (user.createdAt && successfulWithdrawals.some(w => isSameDay(w.createdAt.toDate(), user.createdAt.toDate()))) {
    reasons.push('Saque no mesmo dia de criação da conta');
    riskScore += 2;
  }

  // Risk factor: Frequent withdrawals in a short period
  if (successfulWithdrawals.length > 5) {
    const firstWithdrawalDate = successfulWithdrawals[0].createdAt.toDate();
    const lastWithdrawalDate = successfulWithdrawals[successfulWithdrawals.length - 1].createdAt.toDate();
    const diffTime = Math.abs(lastWithdrawalDate - firstWithdrawalDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      reasons.push(`+5 saques em menos de 7 dias`);
      riskScore += 3;
    }
  }

  // Risk factor: User is a referrer with many suspicious referrals
  if (user.referralCode) {
    const invitedUsers = allUsers.filter(u => u.referredBy === user.referralCode);
    const suspiciousInvitedCount = invitedUsers.filter(u => u.blocked || u.withdrawBlocked).length;
    if (suspiciousInvitedCount > 1) {
      reasons.push(`${suspiciousInvitedCount} convidados com atividades suspeitas`);
      riskScore += suspiciousInvitedCount;
    }
  }

  // Risk factor: PIX key used by another user
  const userPixKeys = new Set(userWithdrawals.map(w => w.pixKey).filter(Boolean));
  const otherUsersWithdrawals = allWithdrawals.filter(w => w.uid !== user.uid);
  for (const pixKey of userPixKeys) {
    if (otherUsersWithdrawals.some(w => w.pixKey === pixKey)) {
      reasons.push(`Chave PIX usada por outro usuário`);
      riskScore += 4;
      break; // Add reason only once
    }
  }

  let riskLevel = RISK_LEVELS.LOW;
  if (riskScore >= 4) riskLevel = RISK_LEVELS.HIGH;
  else if (riskScore > 0) riskLevel = RISK_LEVELS.MEDIUM;

  return { riskLevel, reasons: reasons.length > 0 ? reasons : ['Nenhum alerta'] };
};

const AntiFraudUserTable = ({ users, withdrawals, onAction }) => {
  const processedUsers = useMemo(() => {
    if (!users.length || !withdrawals.length) return [];
    
    return users
      .map(user => ({
        ...user,
        ...analyzeUserRisk(user, withdrawals, users),
        totalWithdrawn: withdrawals
          .filter(w => w.uid === user.uid && (w.status === 'paid' || w.status === 'approved'))
          .reduce((acc, w) => acc + (w.amountRequested || 0), 0),
        withdrawalCount: withdrawals.filter(w => w.uid === user.uid).length,
      }))
      .filter(user => user.riskLevel !== RISK_LEVELS.LOW) // Only show users with some risk
      .sort((a, b) => {
        const riskOrder = { [RISK_LEVELS.HIGH]: 3, [RISK_LEVELS.MEDIUM]: 2, [RISK_LEVELS.LOW]: 1 };
        return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
      });
  }, [users, withdrawals]);

  if (!processedUsers.length) {
    return <div className="empty-state">Nenhum usuário com atividades suspeitas foi encontrado.</div>
  }

  return (
    <div className="table-wrap card">
      <h2 style={{padding: '16px', borderBottom: '1px solid #eee'}}>Usuários Suspeitos</h2>
      <table className="withdraw-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Nível de Risco</th>
            <th>Motivos do Alerta</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {processedUsers.map(user => (
            <tr key={user.uid}>
              <td>
                <div className="cell-user">
                  <strong>{user.email || 'N/A'}</strong>
                  <span className="muted">{user.uid}</span>
                </div>
              </td>
              <td>
                <span className={`risk-badge risk-${user.riskLevel.toLowerCase()}`}>{user.riskLevel}</span>
              </td>
              <td>
                <ul className="simple-list">{user.reasons.map(r => <li key={r}>{r}</li>)}</ul>
              </td>
              <td>
                {user.blocked && <span className="status-badge status-rejected">Conta Bloqueada</span>}
                {user.withdrawBlocked && <span className="status-badge status-pending">Saque Bloqueado</span>}
                {!user.blocked && !user.withdrawBlocked && <span className="status-badge status-paid">Ativo</span>}
              </td>
              <td className="actions-col">
                <div className="row-actions">
                  <button className="btn btn-sm" onClick={() => onAction('view-details', user)}>Detalhes</button>
                  <button className="btn btn-sm btn-danger" onClick={() => onAction('block-withdraw', user)}>Bloq. Saque</button>
                  <button className="btn btn-sm btn-danger" onClick={() => onAction('block-account', user)}>Bloq. Conta</button>
                  <button className="btn btn-sm" onClick={() => onAction('add-note', user)}>Anotação</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AntiFraudUserTable;
