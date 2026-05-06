import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase.js';
import { ADMIN_LOG_FIELDS, FIRESTORE_COLLECTIONS } from '../firestoreSchema.js';

const ACTION_LABELS = {
  approve: { text: 'Aprovou', color: 'approved' },
  reject: { text: 'Rejeitou', color: 'rejected' },
  pay: { text: 'Marcou como pago', color: 'paid' },
};

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = value.toDate ? value.toDate() : new Date(value);
    return d.toLocaleString('pt-BR');
  } catch {
    return '—';
  }
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.adminLogs),
      orderBy(ADMIN_LOG_FIELDS.createdAt, 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler adminLogs. Verifique as regras do Firestore.'
            : `Erro: ${err.message}`
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <div className="dashboard" data-testid="logs-page">
      <header className="page-header">
        <div>
          <h1>Logs</h1>
          <p className="muted">Histórico de ações administrativas (últimas 200).</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="empty-state">Carregando logs…</div>
        ) : logs.length === 0 ? (
          <div className="empty-state" data-testid="logs-empty">
            Nenhum registro de ação ainda.
          </div>
        ) : (
          <ul className="log-list" data-testid="log-list">
            {logs.map((log) => {
              const meta = ACTION_LABELS[log.action] || { text: log.action, color: 'pending' };
              return (
                <li key={log.id} className="log-item">
                  <div className={`log-dot dot-${meta.color}`} />
                  <div className="log-content">
                    <div className="log-line">
                      <strong>{meta.text}</strong>{' '}
                      saque <code>{log.requestId}</code>
                      {log.targetEmail && <> de <strong>{log.targetEmail}</strong></>}
                    </div>
                    <div className="log-meta">
                      por <span>{log.adminEmail || log.adminUid}</span> • {formatDate(log.createdAt)}
                      {log.reason && <> • motivo: <em>“{log.reason}”</em></>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
