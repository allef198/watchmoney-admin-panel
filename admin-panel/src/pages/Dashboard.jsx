import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import WithdrawTable from '../components/WithdrawTable.jsx';
import {
  FIRESTORE_COLLECTIONS,
  WITHDRAW_REQUEST_FIELDS,
  mapWithdrawRequestDoc,
} from '../firestoreSchema.js';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'rejected', label: 'Rejeitados' },
  { key: 'paid', label: 'Pagos' },
];

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

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
        const list = snap.docs.map(mapWithdrawRequestDoc);
        setRequests(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler withdrawRequests. Verifique as regras do Firestore.'
            : `Erro ao carregar saques: ${err.message}`
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, paid: 0 };
    for (const r of requests) {
      if (c[r.status] !== undefined) c[r.status] += 1;
    }
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [r.userEmail, r.fullName, r.pixKey]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [requests, statusFilter, search]);

  return (
    <div className="dashboard" data-testid="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Gerencie as solicitações de saque do WatchMoney.</p>
        </div>
      </header>

      {/* Cards de estatísticas */}
      <section className="stats-grid">
        <StatCard label="Pendentes" value={counts.pending} accent="pending" testid="stat-pending" />
        <StatCard label="Aprovados" value={counts.approved} accent="approved" testid="stat-approved" />
        <StatCard label="Rejeitados" value={counts.rejected} accent="rejected" testid="stat-rejected" />
        <StatCard label="Pagos" value={counts.paid} accent="paid" testid="stat-paid" />
      </section>

      {/* Filtros e busca */}
      <section className="toolbar">
        <div className="filter-tabs" role="tablist" data-testid="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={'filter-tab' + (statusFilter === f.key ? ' active' : '')}
              onClick={() => setStatusFilter(f.key)}
              data-testid={`filter-${f.key}`}
            >
              {f.label}
              {f.key !== 'all' && <span className="filter-count">{counts[f.key] ?? 0}</span>}
            </button>
          ))}
        </div>

        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="search"
            placeholder="Buscar por e-mail, nome ou chave Pix…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-input"
          />
        </div>
      </section>

      {error && <div className="alert alert-error" data-testid="dashboard-error">{error}</div>}

      <section className="card table-card">
        <WithdrawTable
          items={filtered}
          loading={loading}
          isFiltered={statusFilter !== 'all' || !!search.trim()}
        />
      </section>
    </div>
  );
}

function StatCard({ label, value, accent, testid }) {
  return (
    <div className={`stat-card stat-${accent}`} data-testid={testid}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-accent stat-${accent}-accent`} />
    </div>
  );
}
