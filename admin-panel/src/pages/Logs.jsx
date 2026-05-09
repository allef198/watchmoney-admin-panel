
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../firestoreSchema';
import { translateAction, getLogType, exportLogsToCSV } from '../utils/logUtils';
import { formatDateTime } from '../utils/formatters';
import LogDetailsModal from '../components/LogDetailsModal';
import LogFilters from '../components/LogFilters';

const PAGE_SIZE = 50;

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('Todos');
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async (loadMore = false) => {
        if (!loadMore) setLoading(true);
        setError(null);
        try {
            let q = query(collection(db, FIRESTORE_COLLECTIONS.adminLogs), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
            if (loadMore && lastDoc) q = query(q, startAfter(lastDoc));

            const docSnap = await getDocs(q);
            if (docSnap.empty) {
                setHasMore(false);
                if (!loadMore) setLogs([]);
                return;
            }

            const newLogs = docSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLastDoc(docSnap.docs[docSnap.docs.length - 1]);
            setLogs(prev => loadMore ? [...prev, ...newLogs] : newLogs);
            setHasMore(docSnap.docs.length === PAGE_SIZE);
        } catch (err) {
            console.error("Error fetching logs:", err);
            setError('Não foi possível carregar os logs.');
        } finally {
            if (!loadMore) setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const typeMatch = typeFilter === 'Todos' || getLogType(log.action) === typeFilter;
            if (!typeMatch) return false;

            const term = searchTerm.toLowerCase();
            if (!term) return true;

            const targetId = log.targetId || log.targetUid || log.requestId || '';
            const adminId = log.adminUid || '';
            const adminEmail = log.adminEmail || '';
            const action = log.action || '';

            return targetId.toLowerCase().includes(term) || 
                   adminId.toLowerCase().includes(term) || 
                   adminEmail.toLowerCase().includes(term) || 
                   action.toLowerCase().includes(term);
        });
    }, [logs, searchTerm, typeFilter]);

    const summaryStats = useMemo(() => {
        const now = new Date();
        const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        return {
            total: logs.length,
            saque: logs.filter(l => getLogType(l.action) === 'Saque').length,
            usuario: logs.filter(l => getLogType(l.action) === 'Usuário').length,
            configuracao: logs.filter(l => getLogType(l.action) === 'Configuração').length,
            pontos: logs.filter(l => getLogType(l.action) === 'Pontos').length,
            last24h: logs.filter(l => l.createdAt?.toDate() > last24h).length,
        };
    }, [logs]);

    if (loading && logs.length === 0) return <div className="loading-screen">Carregando logs...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <>
            <div className="page-header">
                <h1>Logs de Auditoria</h1>
                <button className="btn btn-primary" onClick={() => exportLogsToCSV(filteredLogs)} disabled={filteredLogs.length === 0}>Exportar CSV</button>
            </div>

            <div className="stats-grid-4">
                <StatCard title="Logs Carregados" value={summaryStats.total} />
                <StatCard title="Ações de Saque" value={summaryStats.saque} />
                <StatCard title="Ações de Usuário" value={summaryStats.usuario} />
                <StatCard title="Últimas 24h" value={summaryStats.last24h} />
            </div>
            
            <LogFilters 
                onSearch={setSearchTerm} 
                onFilterChange={({ type }) => setTypeFilter(type)} 
            />

            <div className="card">
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr><th>Data</th><th>Admin</th><th>Ação</th><th>Tipo</th><th>Alvo</th><th></th></tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.createdAt ? formatDateTime(log.createdAt.toDate()) : 'N/A'}</td>
                                        <td>{log.adminEmail || log.adminUid?.substring(0, 8) || 'N/A'}</td>
                                        <td>{translateAction(log.action)}</td>
                                        <td><span className={`badge-logtype ${getLogType(log.action).toLowerCase()}`}>{getLogType(log.action)}</span></td>
                                        <td>{(log.targetId || log.targetUid || log.requestId)?.substring(0, 8) || 'N/A'}</td>
                                        <td><button onClick={() => setSelectedLog(log)} className="btn btn-sm btn-ghost">Detalhes</button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}} className="muted">Nenhum log encontrado para os filtros selecionados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {hasMore && filteredLogs.length > 0 && (
                    <div className="card-footer" style={{textAlign: 'center'}}>
                        <button className="btn btn-ghost" onClick={() => fetchLogs(true)} disabled={loading}>{loading ? 'Carregando...': 'Carregar Mais'}</button>
                    </div>
                )}
            </div>
            {selectedLog && <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
};

const StatCard = ({ title, value }) => (
    <div className="card card-body">
        <h3 className="stat-title-sm">{title}</h3>
        <p className="stat-value-lg">{value}</p>
    </div>
);

export default Logs;
