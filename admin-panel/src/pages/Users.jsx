import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  FIRESTORE_COLLECTIONS,
  mapUserDoc,
  mapWithdrawRequestDoc,
} from '../firestoreSchema.js';
import {
  MISSING,
  formatCurrency,
  formatDateTime,
  formatPoints,
  timestampToMillis,
  toNumber,
} from '../utils/formatters.js';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'blocked', label: 'Bloqueados' },
];

function buildWithdrawStats(requests) {
  const stats = new Map();

  for (const request of requests) {
    if (!request.uid) continue;
    const current = stats.get(request.uid) || {
      count: 0,
      paid: 0,
      rejected: 0,
    };
    const amount = toNumber(request.amountRequested) ?? 0;
    current.count += 1;
    if (request.status === 'paid') current.paid += amount;
    if (request.status === 'rejected') current.rejected += amount;
    stats.set(request.uid, current);
  }

  return stats;
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingWithdraws, setLoadingWithdraws] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoadingUsers(true);
    const unsub = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.users),
      (snap) => {
        const list = snap.docs
          .map(mapUserDoc)
          .sort((a, b) => timestampToMillis(b.updatedAt || b.createdAt) - timestampToMillis(a.updatedAt || a.createdAt));
        setUsers(list);
        setLoadingUsers(false);
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler users. Verifique as regras do Firestore.'
            : `Erro ao carregar usuários: ${err.message}`
        );
        setLoadingUsers(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingWithdraws(true);
    const unsub = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.withdrawRequests),
      (snap) => {
        setWithdrawRequests(snap.docs.map(mapWithdrawRequestDoc));
        setLoadingWithdraws(false);
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler withdrawRequests. Verifique as regras do Firestore.'
            : `Erro ao carregar saques dos usuários: ${err.message}`
        );
        setLoadingWithdraws(false);
      }
    );
    return () => unsub();
  }, []);

  const withdrawStats = useMemo(() => buildWithdrawStats(withdrawRequests), [withdrawRequests]);

  const counts = useMemo(() => {
    const blocked = users.filter((user) => user.blocked === true).length;
    return {
      total: users.length,
      active: users.length - blocked,
      blocked,
      points: users.reduce((total, user) => total + (toNumber(user.points) ?? 0), 0),
    };
  }, [users]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      if (statusFilter === 'active' && user.blocked === true) return false;
      if (statusFilter === 'blocked' && user.blocked !== true) return false;
      if (!term) return true;
      return [user.email, user.uid]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [users, search, statusFilter]);

  const loading = loadingUsers || loadingWithdraws;
  const openUser = (userUid) => navigate(`/usuarios/${encodeURIComponent(userUid)}`);

  return (
    <div className="dashboard" data-testid="users-page">
      <header className="page-header">
        <div>
          <h1>Usuários</h1>
          <p className="muted">Acompanhe contas, pontos e histórico de saques.</p>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Total de usuários" value={counts.total} accent="pending" testid="users-total" />
        <StatCard label="Usuários ativos" value={counts.active} accent="paid" testid="users-active" />
        <StatCard label="Usuários bloqueados" value={counts.blocked} accent="rejected" testid="users-blocked" />
        <StatCard label="Pontos totais" value={formatPoints(counts.points)} accent="approved" testid="users-points" compact />
      </section>

      <section className="toolbar">
        <div className="filter-tabs" role="tablist" data-testid="users-filter-tabs">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              className={'filter-tab' + (statusFilter === filter.key ? ' active' : '')}
              onClick={() => setStatusFilter(filter.key)}
              data-testid={`users-filter-${filter.key}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="search"
            placeholder="Buscar por e-mail ou UID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            data-testid="users-search"
          />
        </div>
      </section>

      {error && <div className="alert alert-error" data-testid="users-error">{error}</div>}

      <section className="card table-card">
        {loading ? (
          <div className="empty-state" data-testid="users-loading">Carregando usuários...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" data-testid="users-empty">
            {search || statusFilter !== 'all'
              ? 'Nenhum usuário encontrado com esses filtros.'
              : 'Ainda não há usuários cadastrados.'}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="withdraw-table" data-testid="users-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>UID</th>
                  <th className="num">Pontos atuais</th>
                  <th className="num">Total de saques</th>
                  <th className="num">Total pago</th>
                  <th className="num">Total rejeitado</th>
                  <th>Última atividade</th>
                  <th>Status</th>
                  <th className="actions-col">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const stats = withdrawStats.get(user.uid) || { count: 0, paid: 0, rejected: 0 };
                  return (
                    <tr
                      key={user.uid}
                      className="clickable-row"
                      data-testid={`user-row-${user.uid}`}
                      tabIndex={0}
                      onClick={(event) => {
                        if (event.target.closest('a, button')) return;
                        openUser(user.uid);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') openUser(user.uid);
                      }}
                    >
                      <td>
                        <Link className="table-link" to={`/usuarios/${encodeURIComponent(user.uid)}`}>
                          {user.email || MISSING}
                        </Link>
                      </td>
                      <td className="mono-cell">{user.uid}</td>
                      <td className="num">{formatPoints(user.points)}</td>
                      <td className="num">{stats.count}</td>
                      <td className="num">{formatCurrency(stats.paid)}</td>
                      <td className="num">{formatCurrency(stats.rejected)}</td>
                      <td className="cell-date">{formatDateTime(user.updatedAt || user.createdAt)}</td>
                      <td><AccountStatusBadge blocked={user.blocked} /></td>
                      <td className="actions-col">
                        <Link className="btn btn-sm btn-ghost" to={`/usuarios/${encodeURIComponent(user.uid)}`}>
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, accent, testid, compact = false }) {
  return (
    <div className={`stat-card stat-${accent}`} data-testid={testid}>
      <div className="stat-label">{label}</div>
      <div className={'stat-value' + (compact ? ' stat-value-money' : '')}>{value}</div>
      <div className={`stat-accent stat-${accent}-accent`} />
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
