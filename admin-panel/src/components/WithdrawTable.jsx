import { useState } from 'react';
import {
  doc,
  serverTimestamp,
  writeBatch,
  collection,
} from 'firebase/firestore';
import { db, auth, ADMIN_UID } from '../firebase.js';
import {
  ADMIN_LOG_FIELDS,
  FIRESTORE_COLLECTIONS,
  WITHDRAW_REQUEST_FIELDS,
} from '../firestoreSchema.js';
import StatusBadge from './StatusBadge.jsx';
import ConfirmModal from './ConfirmModal.jsx';

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = value.toDate ? value.toDate() : new Date(value);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

const ACTIONS = {
  approve: {
    title: 'Aprovar saque',
    description: 'Confirma a aprovação desta solicitação? O status será alterado para "Aprovado".',
    confirmLabel: 'Aprovar',
    variant: 'primary',
    requireReason: false,
    newStatus: 'approved',
    logAction: 'approve',
  },
  reject: {
    title: 'Rejeitar saque',
    description: 'Informe o motivo da rejeição. O usuário poderá ver esse motivo no app.',
    confirmLabel: 'Rejeitar',
    variant: 'danger',
    requireReason: true,
    reasonPlaceholder: 'Ex.: Chave Pix incorreta…',
    warning: 'A devolução de pontos deve ser feita com segurança em Cloud Function ou rotina transacional.',
    newStatus: 'rejected',
    logAction: 'reject',
  },
  pay: {
    title: 'Marcar como pago',
    description: 'Confirma que o pagamento foi efetuado via Pix? O status mudará para "Pago".',
    confirmLabel: 'Marcar como pago',
    variant: 'success',
    requireReason: false,
    newStatus: 'paid',
    logAction: 'pay',
  },
};

export default function WithdrawTable({ items, loading, isFiltered }) {
  const [modal, setModal] = useState({ open: false, action: null, request: null });
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, message }

  const openAction = (action, request) => {
    setModal({ open: true, action, request });
  };

  const closeModal = () => {
    if (working) return;
    setModal({ open: false, action: null, request: null });
  };

  const handleConfirm = async (reason) => {
    const cfg = ACTIONS[modal.action];
    const req = modal.request;
    if (!cfg || !req) return;

    const admin = auth.currentUser;
    if (!admin || admin.uid !== ADMIN_UID) {
      setFeedback({ type: 'error', message: 'Somente o admin autorizado pode executar esta ação.' });
      return;
    }

    setWorking(true);
    try {
      const batch = writeBatch(db);
      const requestRef = doc(db, FIRESTORE_COLLECTIONS.withdrawRequests, req.id);
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));
      const requestFields = WITHDRAW_REQUEST_FIELDS;
      const logFields = ADMIN_LOG_FIELDS;

      const updateData = {
        [requestFields.status]: cfg.newStatus,
        [requestFields.updatedAt]: serverTimestamp(),
        [requestFields.reviewedAt]: serverTimestamp(),
        [requestFields.reviewedBy]: admin.uid,
      };
      if (cfg.newStatus === 'rejected') {
        updateData[requestFields.rejectionReason] = reason || '';
      }
      if (cfg.newStatus === 'paid') {
        updateData[requestFields.paidAt] = serverTimestamp();
      }

      batch.update(requestRef, updateData);

      batch.set(logRef, {
        [logFields.action]: cfg.logAction,
        [logFields.requestId]: req.id,
        [logFields.targetUid]: req.uid || null,
        [logFields.targetEmail]: req.email || null,
        [logFields.previousStatus]: req.status || null,
        [logFields.newStatus]: cfg.newStatus,
        [logFields.amountRequested]: req.amountRequested ?? null,
        [logFields.pointsRequired]: req.pointsRequired ?? null,
        [logFields.reason]: reason || null,
        [logFields.adminUid]: admin.uid,
        [logFields.adminEmail]: admin.email || null,
        [logFields.createdAt]: serverTimestamp(),
      });

      await batch.commit();
      setFeedback({
        type: 'success',
        message: `Saque ${req.id.slice(0, 6)}… atualizado para "${cfg.newStatus}".`,
      });
      setModal({ open: false, action: null, request: null });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message:
          err.code === 'permission-denied'
            ? 'Permissão negada pelo Firestore. Verifique as regras.'
            : `Erro ao atualizar: ${err.message}`,
      });
    } finally {
      setWorking(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const cfg = modal.action ? ACTIONS[modal.action] : null;

  if (loading) {
    return <div className="empty-state" data-testid="table-loading">Carregando solicitações…</div>;
  }

  if (!items.length) {
    return (
      <div className="empty-state" data-testid="table-empty">
        {isFiltered
          ? 'Nenhum saque encontrado com esses filtros.'
          : 'Ainda não há solicitações de saque.'}
      </div>
    );
  }

  return (
    <>
      {feedback && (
        <div className={`alert alert-${feedback.type}`} data-testid={`alert-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="table-wrap">
        <table className="withdraw-table" data-testid="withdraw-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Usuário</th>
              <th>Chave Pix</th>
              <th className="num">Valor</th>
              <th className="num">Pontos</th>
              <th>Status</th>
              <th className="actions-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} data-testid={`row-${r.id}`}>
                <td className="cell-date">{formatDate(r.createdAt)}</td>
                <td>
                  <div className="cell-user">
                    <strong>{r.fullName || '—'}</strong>
                    <span className="muted">{r.email || r.uid || '—'}</span>
                  </div>
                </td>
                <td className="cell-pix">
                  <code>{r.pixKey || '—'}</code>
                </td>
                <td className="num"><strong>{formatCurrency(r.amountRequested)}</strong></td>
                <td className="num">{r.pointsRequired ?? '—'}</td>
                <td>
                  <StatusBadge status={r.status} />
                  {r.status === 'rejected' && r.rejectionReason && (
                    <div className="cell-reason" title={r.rejectionReason}>
                      Motivo: {r.rejectionReason}
                    </div>
                  )}
                </td>
                <td className="actions-col">
                  <div className="row-actions">
                    {r.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => openAction('approve', r)}
                          data-testid={`approve-${r.id}`}
                        >
                          Aprovar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => openAction('reject', r)}
                          data-testid={`reject-${r.id}`}
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openAction('pay', r)}
                        data-testid={`pay-${r.id}`}
                      >
                        Marcar como pago
                      </button>
                    )}
                    {(r.status === 'rejected' || r.status === 'paid') && (
                      <span className="muted small">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cfg && (
        <ConfirmModal
          open={modal.open}
          title={cfg.title}
          description={cfg.description}
          confirmLabel={cfg.confirmLabel}
          variant={cfg.variant}
          requireReason={cfg.requireReason}
          reasonPlaceholder={cfg.reasonPlaceholder}
          warning={cfg.warning}
          onConfirm={handleConfirm}
          onClose={closeModal}
          loading={working}
        />
      )}
    </>
  );
}
