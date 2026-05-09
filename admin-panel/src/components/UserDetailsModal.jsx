import { formatDateTime, formatPoints } from '../utils/formatters';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalhes do Usuário</h3>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Nome Completo" value={user.fullName || 'Não preenchido'} />
            <DetailItem label="UID" value={user.id} wide />
            <DetailItem label="Pontos" value={formatPoints(user.points)} />
            <DetailItem label="Data de Cadastro" value={formatDateTime(user.createdAt)} />
            <DetailItem label="Última Atualização" value={formatDateTime(user.updatedAt)} />
            <DetailItem label="Status da Conta" value={user.isBlocked ? 'Bloqueada' : 'Ativa'} />
            <DetailItem label="Status do Saque" value={user.isWithdrawBlocked ? 'Bloqueado' : 'Permitido'} />
            <DetailItem label="ID do Indicador" value={user.referrerId || 'Nenhum'} />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-ghost">Fechar</button>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, wide = false }) => (
  <div className={`detail-item ${wide ? 'wide' : ''}`}>
    <span className="detail-label">{label}</span>
    <span className="detail-value" title={value}>{value}</span>
  </div>
);

export default UserDetailsModal;
