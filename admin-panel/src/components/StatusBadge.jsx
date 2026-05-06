const LABELS = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  paid: 'Pago',
};

export default function StatusBadge({ status }) {
  const cls = ['status-badge', `status-${status || 'unknown'}`].join(' ');
  return (
    <span className={cls} data-testid={`status-badge-${status}`}>
      <span className="status-dot" />
      {LABELS[status] || status || '—'}
    </span>
  );
}
