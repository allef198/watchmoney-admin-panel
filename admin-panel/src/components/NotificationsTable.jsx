import React from 'react';
import { formatDateTime, MISSING } from '../utils/formatters';

const NotificationsTable = ({ notices, onAction, busyIds }) => {
  if (!notices.length) {
    return <div className="empty-state">Nenhum aviso global encontrado.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="withdraw-table" data-testid="notifications-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Data de Criação</th>
            <th>Última Atualização</th>
            <th className="actions-col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((notice) => (
            <tr key={notice.id}>
              <td>
                <div>
                  <strong>{notice.title || MISSING}</strong>
                  <p className="muted small">{notice.message.substring(0, 75)}{notice.message.length > 75 && '...'}</p>
                </div>
              </td>
              <td>
                <span className={`status-badge ${notice.active ? 'status-paid' : 'status-rejected'}`}>
                  <span className="status-dot"></span>
                  {notice.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>{notice.priority}</td>
              <td className="cell-date">{formatDateTime(notice.createdAt)}</td>
              <td className="cell-date">{formatDateTime(notice.updatedAt)}</td>
              <td className="actions-col">
                <div className="row-actions">
                  <button 
                    className="btn btn-sm btn-ghost" 
                    onClick={() => onAction('edit', notice)}
                    disabled={busyIds[notice.id]}
                  >
                    Editar
                  </button>
                  <button 
                    className={`btn btn-sm btn-${notice.active ? 'secondary' : 'success'}`}
                    onClick={() => onAction('toggle', notice)}
                    disabled={busyIds[notice.id]}
                  >
                    {busyIds[notice.id] ? 'Aguarde...' : (notice.active ? 'Desativar' : 'Ativar')}
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => onAction('delete', notice)}
                    disabled={busyIds[notice.id]}
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NotificationsTable;
