
import { useEffect, useMemo, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase.js';
import { Link } from 'react-router-dom';
import { FIRESTORE_COLLECTIONS, mapWithdrawRequestDoc, mapUserDoc, mapGlobalNoticeDoc, mapAdminLogDoc } from '../firestoreSchema.js';
import { formatCurrency, formatPoints, formatDateTime } from '../utils/formatters.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';

const safeSum = (arr, field) => (arr || []).reduce((acc, item) => acc + (Number(item[field]) || 0), 0);

const getShortUid = (value) => {
  if (!value || typeof value !== 'string') return 'UID não informado';
  return value.slice(0, 8);
};

export default function Dashboard() {
  const [data, setData] = useState({ users: [], withdrawRequests: [], appConfig: {}, globalNotifications: [], adminLogs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const collections = {
        users: FIRESTORE_COLLECTIONS.users,
        withdrawRequests: FIRESTORE_COLLECTIONS.withdrawRequests,
        appConfig: FIRESTORE_COLLECTIONS.appConfig,
        globalNotifications: FIRESTORE_COLLECTIONS.globalNotifications,
        adminLogs: FIRESTORE_COLLECTIONS.adminLogs
      };

      const [usersSnap, withdrawRequestsSnap, appConfigSnap, globalNotificationsSnap, adminLogsSnap] = await Promise.all([
        getDocs(query(collection(db, collections.users))),
        getDocs(query(collection(db, collections.withdrawRequests), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, collections.appConfig))),
        getDocs(query(collection(db, collections.globalNotifications))),
        getDocs(query(collection(db, collections.adminLogs), orderBy('timestamp', 'desc'), limit(5)))
      ]);

      setData({
        users: usersSnap.docs.map(mapUserDoc),
        withdrawRequests: withdrawRequestsSnap.docs.map(mapWithdrawRequestDoc),
        appConfig: appConfigSnap.docs.length > 0 ? appConfigSnap.docs[0].data() : {},
        globalNotifications: globalNotificationsSnap.docs.map(mapGlobalNoticeDoc),
        adminLogs: adminLogsSnap.docs.map(mapAdminLogDoc)
      });
    } catch (err) {
      console.error("Falha ao carregar dados do dashboard:", err);
      setError("Não foi possível carregar os dados do dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const { users = [], withdrawRequests = [], globalNotifications = [], appConfig = {} } = data;
    const withdrawByStatus = status => (withdrawRequests || []).filter(r => r.status === status);
    
    const pendingWithdraws = withdrawByStatus('pending');
    const paidWithdraws = withdrawByStatus('paid');
    
    const topUsersByPoints = [...(users || [])].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);

    return {
      totalUsers: (users || []).length,
      activeUsers: (users || []).filter(u => !u.blocked).length,
      pendingWithdrawsSum: safeSum(pendingWithdraws, 'amountRequested'),
      pendingWithdrawsCount: pendingWithdraws.length,
      totalPaidSum: safeSum(paidWithdraws, 'amountRequested'),
      totalPointsInCirculation: safeSum(users, 'points'),
      activeNotices: (globalNotifications || []).filter(n => n.active).length,
      quickSettings: { 
        ...appConfig, 
        globalNoticeActive: (globalNotifications || []).some(n => n.active) 
      },
      topUsers: topUsersByPoints,
    };
  }, [data]);

  if (loading) return <div className="loading-screen">Carregando Dashboard...</div>;
  if (error) return <div className="page-header"><h1>Erro</h1><p className="muted">{error}</p></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Visão geral e estatísticas do sistema.</p>
        </div>
      </div>

      <div className="stats-grid-4">
          <StatCard title="Usuários Ativos" value={stats.activeUsers} />
          <StatCard title="Saques Pendentes" value={formatCurrency(stats.pendingWithdrawsSum)} subValue={`${stats.pendingWithdrawsCount} solicitações`} />
          <StatCard title="Total Pago (realizado)" value={formatCurrency(stats.totalPaidSum)} />
          <StatCard title="Pontos em Circulação" value={formatPoints(stats.totalPointsInCirculation)} />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <RecentWithdrawsCard withdrawRequests={data.withdrawRequests || []} />
          <TopUsersCard topUsers={stats.topUsers || []} />
        </div>
        <div className="dashboard-column">
            <QuickSettingsCard settings={stats.quickSettings || {}} />
            <RecentLogsCard adminLogs={data.adminLogs || []} />
        </div>
      </div>
    </>
  );
}

const RecentWithdrawsCard = ({ withdrawRequests = [] }) => (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">Últimos Saques Solicitados</h2>
    </div>
    {withdrawRequests.length > 0 ? (
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Usuário</th><th>Valor</th><th>Status</th></tr></thead>
          <tbody>
            {withdrawRequests.slice(0, 5).map(req => (
              <tr key={req.id}>
                <td>{req.userEmail || req.email || req.fullName || getShortUid(req.uid || req.userId)}</td>
                <td>{formatCurrency(req.amountRequested ?? req.amount ?? 0)}</td>
                <td><StatusBadge status={req.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="card-body"><p className="muted">Nenhuma solicitação de saque recente.</p></div>
    )}
    <div className="card-footer">
      <Link to="/financeiro" className="btn btn-sm btn-ghost">Ver Todos os Saques</Link>
    </div>
  </div>
);

const TopUsersCard = ({ topUsers = [] }) => (
  <div className="card">
    <div className="card-header">
      <h2 className="card-title">Top 5 Usuários (por pontos)</h2>
    </div>
    {topUsers.length > 0 ? (
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Usuário</th><th>Pontos</th></tr></thead>
          <tbody>
            {topUsers.map(user => (
              <tr key={user.id}>
                <td>{user.email || 'Email não informado'}</td>
                <td>{formatPoints(user.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="card-body"><p className="muted">Não há usuários suficientes para exibir.</p></div>
    )}
    <div className="card-footer">
      <Link to="/usuarios" className="btn btn-sm btn-ghost">Ver Todos os Usuários</Link>
    </div>
  </div>
);

const QuickSettingsCard = ({ settings = {} }) => (
    <div className="card">
        <div className="card-header"><h2 className="card-title">Configurações Rápidas</h2></div>
        <div className="card-body">
          <SettingItem label="Saques" value={settings.withdrawEnabled ? "Ativados" : "Desativados"} />
          <SettingItem label="Modo Manutenção" value={settings.maintenanceMode ? "Ativo" : "Inativo"} />
          <SettingItem label="Pontos por Real" value={formatPoints(settings.pointsPerReal)} />
          <SettingItem label="Saque Mínimo" value={formatCurrency(settings.minWithdrawAmount)} />
        </div>
        <div className="card-footer">
           <Link to="/configuracoes" className="btn btn-sm btn-ghost">Alterar Configurações</Link>
       </div>
   </div>
);

const RecentLogsCard = ({ adminLogs = [] }) => (
    <div className="card">
        <div className="card-header"><h2 className="card-title">Logs de Atividade Recente</h2></div>
        <div className="card-body">
           {adminLogs.length > 0 ? adminLogs.map(log => (
               <div key={log.id} className="log-item-dashboard">
                  <p><strong>{log.adminEmail || 'Sistema'}</strong> {log.action}</p>
                  <p className="muted text-sm">{formatDateTime(log.createdAt ?? log.timestamp)}</p>
               </div>
           )) : <p className="muted">Nenhum log recente.</p>}
        </div>
        <div className="card-footer">
           <Link to="/logs" className="btn btn-sm btn-ghost">Ver Todos os Logs</Link>
       </div>
   </div>
);

const SettingItem = ({ label, value }) => (
    <div className="detail-row">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value ?? 'Não definido'}</span>
    </div>
);
