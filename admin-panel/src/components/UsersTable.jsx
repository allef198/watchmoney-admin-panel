import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime, formatPoints, MISSING } from '../utils/formatters';

const AccountStatusBadge = ({ blocked }) => (
  <span className={`status-badge ${blocked ? 'status-rejected' : 'status-paid'}`}>
    <span className="status-dot" />
    {blocked ? 'Bloqueado' : 'Ativo'}
  </span>
);

const WithdrawStatusBadge = ({ blocked }) => (
    <span className={`status-badge ${blocked ? 'status-rejected' : 'status-approved'}`}>
      <span className="status-dot" />
      {blocked ? 'Bloqueado' : 'Liberado'}
    </span>
);

const UsersTable = ({ users, onAction }) => {
  if (!users.length) {
    return <div className="empty-state">Nenhum usuário encontrado.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="withdraw-table" data-testid="users-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th className="num">Pontos</th>
            <th className="num">Total Ganho</th>
            <th className="num">Total Sacado</th>
            <th>Status da Conta</th>
            <th>Status de Saque</th>
            <th>Código de Convite</th>
            <th>Data de Criação</th>
            <th className="actions-col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid}>
              <td>
                <div>
                    <strong>{user.fullName || 'Nome não informado'}</strong>
                    <span className="muted">{user.email || MISSING}</span>
                    <Link to={`/usuarios/${user.uid}`} className="muted small">{user.uid.slice(0,8)}...</Link>
                </div>
              </td>
              <td className="num">{formatPoints(user.points)}</td>
              <td className="num">{formatPoints(user.totalPointsEarned)}</td>
              <td className="num">{formatPoints(user.totalPointsWithdrawn)}</td>
              <td><AccountStatusBadge blocked={user.blocked} /></td>
              <td><WithdrawStatusBadge blocked={user.withdrawBlocked} /></td>
              <td>{user.referralCode || MISSING}</td>
              <td className="cell-date">{formatDateTime(user.createdAt)}</td>
              <td className="actions-col">
                <div className="row-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => onAction('view', user)}>Ver detalhes</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => onAction('view-referrals', user)}>Ver Convites</button>
                  <button className={`btn btn-sm btn-${user.blocked ? 'success' : 'danger'}`} onClick={() => onAction(user.blocked ? 'unblock-account' : 'block-account', user)}>{user.blocked ? 'Desbloquear' : 'Bloquear'} Conta</button>
                  <button className={`btn btn-sm btn-${user.withdrawBlocked ? 'success' : 'danger'}`} onClick={() => onAction(user.withdrawBlocked ? 'unblock-withdraw' : 'block-withdraw', user)}>{user.withdrawBlocked ? 'Liberar' : 'Bloquear'} Saque</button>
                  <button className="btn btn-sm btn-primary" onClick={() => onAction('adjust-points', user)}>Ajustar Pontos</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
