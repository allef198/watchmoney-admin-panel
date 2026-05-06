import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  FIRESTORE_COLLECTIONS,
  WITHDRAW_REQUEST_FIELDS,
  mapWithdrawRequestDoc,
} from '../firestoreSchema.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  MISSING,
  formatCurrency,
  formatDateTime,
  formatPoints,
  toNumber,
} from '../utils/formatters.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'paid', label: 'Pagos' },
  { key: 'rejected', label: 'Rejeitados' },
];

const STATUS_CARDS = [
  { key: 'pending', label: 'Pendentes', accent: 'pending' },
  { key: 'approved', label: 'Aprovados', accent: 'approved' },
  { key: 'paid', label: 'Pagos', accent: 'paid' },
  { key: 'rejected', label: 'Rejeitados', accent: 'rejected' },
];

function sumAmount(items) {
  return items.reduce((total, item) => total + (toNumber(item.amountRequested) ?? 0), 0);
}

export default function Financeiro() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    setError('');
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.withdrawRequests),
      orderBy(WITHDRAW_REQUEST_FIELDS.createdAt, 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRequests(snap.docs.map(mapWithdrawRequestDoc));
        setLoading(false);
      },
      (err) => {
        console.error('Firestore finance listener error:', err);
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler withdrawRequests. Verifique as regras do Firestore.'
            : `Erro ao carregar financeiro: ${err.message}`
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const summary = useMemo(() => {
    const base = {
      pending: { count: 0, total: 0 },
      approved: { count: 0, total: 0 },
      paid: { count: 0, total: 0 },
      rejected: { count: 0, total: 0 },
    };

    for (const request of requests) {
      if (!base[request.status]) continue;
      base[request.status].count += 1;
      base[request.status].total += toNumber(request.amountRequested) ?? 0;
    }

    return base;
  }, [requests]);

  const totals = useMemo(() => ({
    requested: sumAmount(requests),
    paid: summary.paid.total,
    pending: summary.pending.total,
    rejected: summary.rejected.total,
  }), [requests, summary]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  return (
    <div className="dashboard" data-testid="finance-page">
      <header className="page-header">
        <div>
          <h1>Financeiro</h1>
          <p className="muted">Resumo financeiro das solicitações de saque.</p>
        </div>
      </header>

      <section className="stats-grid">
        {STATUS_CARDS.map((card) => (
          <FinanceCard
            key={card.key}
            label={card.label}
            value={formatCurrency(summary[card.key].total)}
            count={summary[card.key].count}
            accent={card.accent}
          />
        ))}
      </section>

      <section className="card settings-card finance-totals" data-testid="finance-totals">
        <h3>Totais</h3>
        <div className="settings-row">
          <div className="settings-label">Total solicitado</div>
          <div className="settings-value">{formatCurrency(totals.requested)}</div>
        </div>
        <div className="settings-row">
          <div className="settings-label">Total pago</div>
          <div className="settings-value">{formatCurrency(totals.paid)}</div>
        </div>
        <div className="settings-row">
          <div className="settings-label">Total pendente</div>
          <div className="settings-value">{formatCurrency(totals.pending)}</div>
        </div>
        <div className="settings-row">
          <div className="settings-label">Total rejeitado</div>
          <div className="settings-value">{formatCurrency(totals.rejected)}</div>
        </div>
      </section>

      <section className="toolbar">
        <div className="filter-tabs" role="tablist" data-testid="finance-filter-tabs">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              className={'filter-tab' + (statusFilter === filter.key ? ' active' : '')}
              onClick={() => setStatusFilter(filter.key)}
              data-testid={`finance-filter-${filter.key}`}
            >
              {filter.label}
              {filter.key !== 'all' && (
                <span className="filter-count">{summary[filter.key]?.count ?? 0}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="alert alert-error" data-testid="finance-error">{error}</div>}

      <section className="card table-card">
        <FinanceTable items={filtered} loading={loading} isFiltered={statusFilter !== 'all'} />
      </section>
    </div>
  );
}

function FinanceCard({ label, value, count, accent }) {
  return (
    <div className={`stat-card stat-${accent}`} data-testid={`finance-stat-${accent}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value stat-value-money">{value}</div>
      <div className="stat-subvalue">{count} {count === 1 ? 'pedido' : 'pedidos'}</div>
      <div className={`stat-accent stat-${accent}-accent`} />
    </div>
  );
}

function FinanceTable({ items, loading, isFiltered }) {
  if (loading) {
    return <div className="empty-state" data-testid="finance-loading">Carregando financeiro…</div>;
  }

  if (!items.length) {
    return (
      <div className="empty-state" data-testid="finance-empty">
        {isFiltered
          ? 'Nenhum pedido encontrado com esse filtro.'
          : 'Ainda não há pedidos de saque.'}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="withdraw-table" data-testid="finance-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>E-mail</th>
            <th>Nome</th>
            <th className="num">Valor solicitado</th>
            <th className="num">Pontos usados</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((request) => (
            <tr key={request.id}>
              <td className="cell-date">{formatDateTime(request.createdAt, '—')}</td>
              <td>{request.email || MISSING}</td>
              <td>{request.fullName || MISSING}</td>
              <td className="num"><strong>{formatCurrency(request.amountRequested)}</strong></td>
              <td className="num">{formatPoints(request.pointsRequired)}</td>
              <td><StatusBadge status={request.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
