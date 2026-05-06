import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, ADMIN_UID } from '../firebase.js';
import {
  ADMIN_LOG_FIELDS,
  FIRESTORE_COLLECTIONS,
  WITHDRAW_REQUEST_FIELDS,
  mapUserDoc,
  mapWithdrawRequestDoc,
} from '../firestoreSchema.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import {
  MISSING,
  formatCurrency,
  formatDateTime,
  formatPoints,
  timestampToMillis,
  toNumber,
} from '../utils/formatters.js';

export default function UserDetails() {
  const { uid = '' } = useParams();
  const [user, setUser] = useState(null);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [historyDocs, setHistoryDocs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingWithdraws, setLoadingWithdraws] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [working, setWorking] = useState(false);
  const [modal, setModal] = useState({ open: false, action: null });

  useEffect(() => {
    if (!uid) return;
    setLoadingUser(true);
    const unsub = onSnapshot(
      doc(db, FIRESTORE_COLLECTIONS.users, uid),
      (snap) => {
        if (!snap.exists()) {
          setUser(null);
          setError('Usuário não encontrado.');
        } else {
          setUser(mapUserDoc(snap));
        }
        setLoadingUser(false);
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler este usuário. Verifique as regras do Firestore.'
            : `Erro ao carregar usuário: ${err.message}`
        );
        setLoadingUser(false);
      }
    );
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    setLoadingWithdraws(true);
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.withdrawRequests),
      where(WITHDRAW_REQUEST_FIELDS.uid, '==', uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map(mapWithdrawRequestDoc)
          .sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
        setWithdrawRequests(list);
        setLoadingWithdraws(false);
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler saques deste usuário. Verifique as regras do Firestore.'
            : `Erro ao carregar saques do usuário: ${err.message}`
        );
        setLoadingWithdraws(false);
      }
    );
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    setLoadingHistory(true);
    const unsub = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.users, uid, 'history'),
      (snap) => {
        const list = snap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => timestampToMillis(b.createdAt || b.updatedAt) - timestampToMillis(a.createdAt || a.updatedAt))
          .slice(0, 10);
        setHistoryDocs(list);
        setLoadingHistory(false);
      },
      () => {
        setHistoryDocs([]);
        setLoadingHistory(false);
      }
    );
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    setLoadingNotifications(true);
    const unsub = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.users, uid, 'notifications'),
      (snap) => {
        const list = snap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => timestampToMillis(b.createdAt || b.updatedAt) - timestampToMillis(a.createdAt || a.updatedAt))
          .slice(0, 10);
        setNotifications(list);
        setLoadingNotifications(false);
      },
      () => {
        setNotifications([]);
        setLoadingNotifications(false);
      }
    );
    return () => unsub();
  }, [uid]);

  const summary = useMemo(() => {
    const totals = {
      requested: 0,
      paid: 0,
      rejected: 0,
      pending: 0,
    };

    for (const request of withdrawRequests) {
      const amount = toNumber(request.amountRequested) ?? 0;
      totals.requested += amount;
      if (request.status === 'paid') totals.paid += amount;
      if (request.status === 'rejected') totals.rejected += amount;
      if (request.status === 'pending') totals.pending += amount;
    }

    return totals;
  }, [withdrawRequests]);

  const historyItems = useMemo(() => {
    const rawHistory = Array.isArray(user?.history) ? user.history : [];
    const mappedRaw = rawHistory.map((item, index) => (
      item && typeof item === 'object'
        ? { id: `history-field-${index}`, ...item }
        : { id: `history-field-${index}`, message: String(item) }
    ));

    return [...historyDocs, ...mappedRaw]
      .sort((a, b) => timestampToMillis(b.createdAt || b.updatedAt) - timestampToMillis(a.createdAt || a.updatedAt))
      .slice(0, 10);
  }, [historyDocs, user]);

  const blockConfig = modal.action === 'block'
    ? {
      title: 'Bloquear usuário',
      description: 'O usuário será marcado como bloqueado no Firestore.',
      confirmLabel: 'Bloquear usuário',
      variant: 'danger',
      nextBlocked: true,
      logAction: 'block_user',
    }
    : {
      title: 'Desbloquear usuário',
      description: 'O usuário voltará a ficar ativo no Firestore.',
      confirmLabel: 'Desbloquear usuário',
      variant: 'success',
      nextBlocked: false,
      logAction: 'unblock_user',
    };

  const handleBlockChange = async () => {
    const admin = auth.currentUser;
    if (!admin || admin.uid !== ADMIN_UID) {
      setFeedback({ type: 'error', message: 'Acesso negado.' });
      return;
    }

    setWorking(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, FIRESTORE_COLLECTIONS.users, uid);
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));
      const logFields = ADMIN_LOG_FIELDS;

      batch.update(userRef, blockConfig.nextBlocked
        ? {
          blocked: true,
          blockedAt: serverTimestamp(),
          blockedBy: ADMIN_UID,
          updatedAt: serverTimestamp(),
        }
        : {
          blocked: false,
          unblockedAt: serverTimestamp(),
          unblockedBy: ADMIN_UID,
          updatedAt: serverTimestamp(),
        });

      batch.set(logRef, {
        [logFields.action]: blockConfig.logAction,
        [logFields.targetUid]: uid,
        [logFields.targetEmail]: user?.email || null,
        [logFields.adminUid]: admin.uid,
        [logFields.adminEmail]: admin.email || null,
        [logFields.createdAt]: serverTimestamp(),
      });

      await batch.commit();
      setFeedback({
        type: 'success',
        message: blockConfig.nextBlocked ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.',
      });
      setModal({ open: false, action: null });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.code === 'permission-denied'
            ? 'Permissão negada pelo Firestore. Verifique as regras.'
            : `Erro ao atualizar usuário: ${err.message}`,
      });
    } finally {
      setWorking(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const loading = loadingUser || loadingWithdraws;

  return (
    <div className="dashboard" data-testid="user-details-page">
      <header className="page-header">
        <div>
          <h1>Detalhes do usuário</h1>
          <p className="muted">{uid || MISSING}</p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-ghost" to="/usuarios">Voltar</Link>
          {user && (
            user.blocked ? (
              <button className="btn btn-success" onClick={() => setModal({ open: true, action: 'unblock' })}>
                Desbloquear usuário
              </button>
            ) : (
              <button className="btn btn-danger" onClick={() => setModal({ open: true, action: 'block' })}>
                Bloquear usuário
              </button>
            )
          )}
        </div>
      </header>

      {error && <div className="alert alert-error" data-testid="user-details-error">{error}</div>}
      {feedback && <div className={`alert alert-${feedback.type}`} data-testid={`user-feedback-${feedback.type}`}>{feedback.message}</div>}

      {loading ? (
        <div className="card"><div className="empty-state">Carregando detalhes...</div></div>
      ) : !user ? (
        <div className="card"><div className="empty-state">Usuário não encontrado.</div></div>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard label="Total solicitado" value={formatCurrency(summary.requested)} accent="pending" />
            <StatCard label="Total pago" value={formatCurrency(summary.paid)} accent="paid" />
            <StatCard label="Total rejeitado" value={formatCurrency(summary.rejected)} accent="rejected" />
            <StatCard label="Total pendente" value={formatCurrency(summary.pending)} accent="approved" />
          </section>

          <section className="detail-grid">
            <div className="card settings-card">
              <h3>Conta</h3>
              <InfoRow label="E-mail" value={user.email || MISSING} />
              <InfoRow label="UID" value={user.uid} mono />
              <InfoRow label="Pontos atuais" value={formatPoints(user.points)} />
              <InfoRow label="Conta criada em" value={formatDateTime(user.createdAt)} />
              <InfoRow label="Última atualização" value={formatDateTime(user.updatedAt)} />
              <InfoRow label="Status" value={<AccountStatusBadge blocked={user.blocked} />} />
            </div>

            <div className="card settings-card">
              <h3>Últimos saques</h3>
              <MiniWithdrawList items={withdrawRequests.slice(0, 6)} loading={loadingWithdraws} />
            </div>
          </section>

          <section className="detail-grid">
            <div className="card settings-card">
              <h3>Histórico recente</h3>
              <SimpleEventList items={historyItems} loading={loadingHistory} emptyLabel="Nenhum histórico recente encontrado." />
            </div>

            <div className="card settings-card">
              <h3>Avisos recentes</h3>
              <SimpleEventList items={notifications} loading={loadingNotifications} emptyLabel="Nenhum aviso recente encontrado." />
            </div>
          </section>
        </>
      )}

      <ConfirmModal
        open={modal.open}
        title={blockConfig.title}
        description={blockConfig.description}
        confirmLabel={blockConfig.confirmLabel}
        variant={blockConfig.variant}
        onConfirm={handleBlockChange}
        onClose={() => !working && setModal({ open: false, action: null })}
        loading={working}
      />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value stat-value-money">{value}</div>
      <div className={`stat-accent stat-${accent}-accent`} />
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="settings-row">
      <div className="settings-label">{label}</div>
      <div className={'settings-value' + (mono ? ' mono' : '')}>{value}</div>
    </div>
  );
}

function AccountStatusBadge({ blocked }) {
  return (
    <span className={`status-badge ${blocked ? 'status-rejected' : 'status-paid'}`}>
      <span className="status-dot" />
      {blocked ? 'Bloqueado' : 'Ativo'}
    </span>
  );
}

function MiniWithdrawList({ items, loading }) {
  if (loading) return <div className="empty-state empty-state-sm">Carregando saques...</div>;
  if (!items.length) return <div className="empty-state empty-state-sm">Nenhum saque encontrado.</div>;

  return (
    <ul className="simple-list">
      {items.map((request) => (
        <li key={request.id} className="simple-list-item">
          <div>
            <strong>{formatCurrency(request.amountRequested)}</strong>
            <div className="muted small">{formatDateTime(request.createdAt)}</div>
          </div>
          <StatusBadge status={request.status} />
        </li>
      ))}
    </ul>
  );
}

function SimpleEventList({ items, loading, emptyLabel }) {
  if (loading) return <div className="empty-state empty-state-sm">Carregando...</div>;
  if (!items.length) return <div className="empty-state empty-state-sm">{emptyLabel}</div>;

  return (
    <ul className="simple-list">
      {items.map((item) => (
        <li key={item.id} className="simple-list-item simple-list-item-block">
          <strong>{item.title || item.action || item.type || item.message || item.id}</strong>
          {(item.message || item.description || item.body) && (
            <span className="muted">{item.message || item.description || item.body}</span>
          )}
          <span className="muted small">{formatDateTime(item.createdAt || item.updatedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
