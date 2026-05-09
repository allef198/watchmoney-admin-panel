import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import {
  FIRESTORE_COLLECTIONS,
  ADMIN_LOG_FIELDS,
  mapWithdrawRequestDoc,
} from '../firestoreSchema.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  formatCurrency,
  formatDateTime,
  formatPoints,
  toNumber,
  MISSING,
  toDate
} from '../utils/formatters.js';
import WithdrawDetailsModal from '../components/WithdrawDetailsModal';
import AdminNoteModal from '../components/AdminNoteModal';
import ConfirmModal from '../components/ConfirmModal';


const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'paid', label: 'Pagos' },
  { key: 'rejected', label: 'Rejeitados' },
];

const DATE_FILTERS = [
    { key: 'all', label: 'Qualquer Data' },
    { key: 'today', label: 'Hoje' },
    { key: 'last7', label: 'Últimos 7 dias' },
    { key: 'last30', label: 'Últimos 30 dias' },
];

const SORT_OPTIONS = [
    { key: 'most-recent', label: 'Mais Recentes' },
    { key: 'oldest', label: 'Mais Antigos' },
    { key: 'highest-value', label: 'Maior Valor' },
    { key: 'lowest-value', label: 'Menor Valor' },
];

const Financeiro = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sort, setSort] = useState('most-recent');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState({ type: null, request: null });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const q = query(collection(db, FIRESTORE_COLLECTIONS.withdrawRequests), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
        setRequests(snap.docs.map(mapWithdrawRequestDoc));
        setLoading(false);
    }, (err) => {
        setError(`Erro ao carregar saques: ${err.message}`);
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests || [];

    if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter);

    if (dateFilter !== 'all') {
        const now = new Date();
        let limit = new Date();
        if(dateFilter === 'today') limit.setHours(0,0,0,0);
        if(dateFilter === 'last7') limit.setDate(now.getDate() - 7);
        if(dateFilter === 'last30') limit.setDate(now.getDate() - 30);

        filtered = filtered.filter(r => {
          const createdAtDate = toDate(r.createdAt);
          return createdAtDate && createdAtDate >= limit;
        });
    }

    if (search) {
        const term = search.toLowerCase();
        filtered = filtered.filter(r => 
            (r.email || '').toLowerCase().includes(term) || 
            (r.fullName || '').toLowerCase().includes(term) || 
            (r.uid || '').toLowerCase().includes(term) ||
            (r.pixKey || '').toLowerCase().includes(term)
        );
    }

    if (sort === 'highest-value') filtered.sort((a,b) => (b.amountRequested ?? b.amount ?? 0) - (a.amountRequested ?? a.amount ?? 0));
    if (sort === 'lowest-value') filtered.sort((a,b) => (a.amountRequested ?? a.amount ?? 0) - (b.amountRequested ?? b.amount ?? 0));
    if (sort === 'oldest') filtered.reverse();

    return filtered;
  }, [requests, statusFilter, dateFilter, search, sort]);

    const summary = useMemo(() => {
        const s = { pending: { count: 0, total: 0 }, approved: { count: 0, total: 0 }, paid: { count: 0, total: 0 }, rejected: { count: 0, total: 0 } };
        (requests || []).forEach(r => {
            if (s[r.status]) {
                s[r.status].count++;
                s[r.status].total += toNumber(r.amountRequested ?? r.amount) || 0;
            }
        });
        return s;
    }, [requests]);

  const handleAction = useCallback(async (type, request, reason = null) => {
    if (!request || !request.id) return;
      try {
        const batch = writeBatch(db);
        const requestRef = doc(db, FIRESTORE_COLLECTIONS.withdrawRequests, request.id);
        const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));

        let newStatus = request.status;
        let logAction = ``;

        if (type === 'approve') { newStatus = 'approved'; logAction = 'approve_withdrawal'; }
        if (type === 'reject') { newStatus = 'rejected'; logAction = 'reject_withdrawal'; }
        if (type === 'pay') { newStatus = 'paid'; logAction = 'mark_withdrawal_paid'; }

        const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            reviewedBy: auth.currentUser?.uid || 'unknown',
        };

        if(type === 'reject') updateData.rejectionReason = reason;
        if(type === 'pay') updateData.paidAt = serverTimestamp();

        batch.update(requestRef, updateData);

        batch.set(logRef, {
            [ADMIN_LOG_FIELDS.action]: logAction,
            [ADMIN_LOG_FIELDS.targetId]: request.id,
            [ADMIN_LOG_FIELDS.targetUid]: request.uid,
            [ADMIN_LOG_FIELDS.adminUid]: auth.currentUser?.uid || 'unknown',
            [ADMIN_LOG_FIELDS.previousStatus]: request.status,
            [ADMIN_LOG_FIELDS.newStatus]: newStatus,
            [ADMIN_LOG_FIELDS.reason]: reason || null,
            [ADMIN_LOG_FIELDS.createdAt]: serverTimestamp(),
        });

        await batch.commit();
        setFeedback({type: 'success', message: 'Ação executada com sucesso!'});
      } catch (err) {
        console.error(err);
        setFeedback({type: 'error', message: `Erro: ${err.message}`});
      }
      setModal({ type: null, request: null });
  }, []);
  
  const exportToCSV = () => {
      const headers = ['ID do Saque', 'UID', 'Nome', 'Email', 'Valor', 'Pontos', 'Chave Pix', 'Tipo Pix', 'Status', 'Data de Solicitação', 'Observação Interna'];
      const rows = (filteredAndSortedRequests || []).map(r => 
          [r.id, r.uid, r.fullName, r.email, r.amountRequested ?? r.amount, r.pointsRequired, r.pixKey, r.pixKeyType, r.status, formatDateTime(r.createdAt), r.adminNote].join(',')
      );
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'saques.csv';
      link.click();
  };

  const copyToClipboard = (text) => {
    if(!text) return;
      navigator.clipboard.writeText(text).then(() => setFeedback({type: 'success', message: 'Copiado!'}));
  }

  return (
    <div className="dashboard">
      <h1>Financeiro</h1>
      <section className="stats-grid">
          <div className="stat-card">Pendentes: {summary.pending.count} ({formatCurrency(summary.pending.total)})</div>
          <div className="stat-card">Aprovados: {summary.approved.count} ({formatCurrency(summary.approved.total)})</div>
          <div className="stat-card">Pagos: {summary.paid.count} ({formatCurrency(summary.paid.total)})</div>
          <div className="stat-card">Rejeitados: {summary.rejected.count} ({formatCurrency(summary.rejected.total)})</div>
      </section>
      <section className="toolbar">
          <input type="search" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>{(STATUS_FILTERS || []).map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>{(DATE_FILTERS || []).map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select>
          <select value={sort} onChange={e => setSort(e.target.value)}>{(SORT_OPTIONS || []).map(o=><option key={o.key} value={o.key}>{o.label}</option>)}</select>
          <button onClick={exportToCSV} className="btn">Exportar CSV</button>
      </section>

      {feedback && <div className={`alert alert-${feedback.type}`}>{feedback.message}</div>}

      <div className="table-wrap">
        {loading ? <p>Carregando...</p> : error ? <p>{error}</p> : 
            <table className="withdraw-table">
                <thead>
                    <tr>
                        <th>Usuário</th>
                        <th>Valor</th>
                        <th>Chave Pix</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {(filteredAndSortedRequests || []).map(r => (
                        <tr key={r.id}>
                            <td><div><strong>{r.fullName || MISSING}</strong><span className="muted">{r.email || MISSING}</span></div></td>
                            <td>{formatCurrency(r.amountRequested ?? r.amount)}</td>
                            <td><div><span>{r.pixKey || MISSING}</span><button onClick={()=>copyToClipboard(r.pixKey)}>Copiar</button></div></td>
                            <td><StatusBadge status={r.status} /></td>
                            <td>{formatDateTime(r.createdAt)}</td>
                            <td className="actions-col">
                                <button onClick={() => setModal({ type: 'details', request: r })}>Detalhes</button>
                                {r.status === 'pending' && <button onClick={() => setModal({ type: 'approve', request: r })}>Aprovar</button>}
                                {(r.status === 'pending' || r.status === 'approved') && <button onClick={() => setModal({ type: 'reject', request: r })}>Rejeitar</button>}
                                {r.status === 'approved' && <button onClick={() => setModal({ type: 'pay', request: r })}>Pagar</button>}
                                <button onClick={() => setModal({ type: 'note', request: r })}>Nota</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        }
      </div>

      {modal.type === 'details' && <WithdrawDetailsModal request={modal.request} isOpen={true} onClose={() => setModal({type:null, request:null})} />}
      {modal.type === 'note' && <AdminNoteModal request={modal.request} isOpen={true} onClose={() => setModal({type:null, request:null})} onFeedback={setFeedback} />}
      {['approve', 'pay'].includes(modal.type) && <ConfirmModal open={true} title={`Confirmar ${modal.type}`} description="Você tem certeza?" onConfirm={() => handleAction(modal.type, modal.request)} onClose={() => setModal({type:null, request:null})} />}
      {modal.type === 'reject' && <ConfirmModal open={true} title="Rejeitar Saque" description="Qual o motivo?" requireReason={true} onConfirm={(reason) => handleAction('reject', modal.request, reason)} onClose={() => setModal({type:null, request:null})} />}

    </div>
  );
};

export default Financeiro;
