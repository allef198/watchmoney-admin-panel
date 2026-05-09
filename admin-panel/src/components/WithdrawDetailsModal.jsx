import React from 'react';
import { formatDateTime, formatPoints, formatCurrency, MISSING } from '../utils/formatters';

const InfoRow = ({ label, value, mono = false }) => (
    <div className="settings-row">
      <div className="settings-label">{label}</div>
      <div className={'settings-value' + (mono ? ' mono' : '')}>{value}</div>
    </div>
);

const WithdrawDetailsModal = ({ request, isOpen, onClose }) => {
  if (!isOpen || !request) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Detalhes do Saque</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
            <InfoRow label="ID do Saque" value={request.id} mono />
            <InfoRow label="UID do Usuário" value={request.uid} mono />
            <InfoRow label="Nome" value={request.fullName || MISSING} />
            <InfoRow label="Email" value={request.email || MISSING} />
            <InfoRow label="Valor" value={formatCurrency(request.amountRequested)} />
            <InfoRow label="Pontos" value={formatPoints(request.pointsRequired)} />
            <InfoRow label="Chave Pix" value={request.pixKey || MISSING} />
            <InfoRow label="Tipo de Pix" value={request.pixKeyType || MISSING} />
            <InfoRow label="Status" value={request.status} />
            <InfoRow label="Data de Criação" value={formatDateTime(request.createdAt)} />
            <InfoRow label="Data de Aprovação" value={formatDateTime(request.reviewedAt)} />
            <InfoRow label="Data de Pagamento" value={formatDateTime(request.paidAt)} />
            <InfoRow label="Motivo da Rejeição" value={request.rejectionReason || MISSING} />
            <InfoRow label="Observação do Admin" value={request.adminNote || MISSING} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawDetailsModal;
