import React from 'react';
import { formatDateTime, MISSING } from '../utils/formatters';

const InfoRow = ({ label, value }) => (
    <div className="settings-row">
      <div className="settings-label">{label}</div>
      <div className="settings-value">{value}</div>
    </div>
);

const ReferrerDetailsModal = ({ user, invitedUsers, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalhes do Indicador</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <InfoRow label="UID" value={user.uid} />
          <InfoRow label="Nome" value={user.fullName || MISSING} />
          <InfoRow label="Email" value={user.email || MISSING} />
          <InfoRow label="Código de Convite" value={user.referralCode || MISSING} />
          
          <h3>Convidados</h3>
          <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Convidado</th>
                        <th>Email</th>
                        <th>Válido</th>
                        <th>Primeiro Saque</th>
                    </tr>
                </thead>
                <tbody>
                    {invitedUsers.map(invited => (
                        <tr key={invited.uid}>
                            <td>{invited.fullName || MISSING}</td>
                            <td>{invited.email || MISSING}</td>
                            <td>{invited.isConsideredValid ? 'Sim' : 'Não'}</td>
                            <td>{invited.firstWithdrawalReferralBonusPaid ? 'Sim' : 'Não'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default ReferrerDetailsModal;
