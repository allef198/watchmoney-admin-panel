import { useEffect, useState } from 'react';

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Descreva o motivo…',
  warning,
  onConfirm,
  onClose,
  loading = false,
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  if (!open) return null;

  const disabled = loading || (requireReason && reason.trim().length < 3);

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="confirm-modal">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fechar" data-testid="modal-close">
            ×
          </button>
        </div>
        <div className="modal-body">
          {description && <p>{description}</p>}
          {requireReason && (
            <textarea
              className="textarea"
              rows={4}
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-testid="modal-reason-input"
              autoFocus
            />
          )}
          {warning && <div className="warning-box" data-testid="modal-warning">⚠ {warning}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading} data-testid="modal-cancel">
            {cancelLabel}
          </button>
          <button
            className={`btn btn-${variant}`}
            onClick={() => onConfirm(reason.trim())}
            disabled={disabled}
            data-testid="modal-confirm"
          >
            {loading ? 'Processando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
