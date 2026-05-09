
import { useState } from 'react';
import { translateAction, getLogType } from '../utils/logUtils';
import { formatDateTime } from '../utils/formatters';

const copyToClipboard = (text, onCopy) => {
    navigator.clipboard.writeText(text).then(() => {
        onCopy();
    });
};

const DetailRow = ({ label, value, copyable = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        copyToClipboard(value, () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (!value) return null;

    return (
        <div className="detail-row">
            <strong className="detail-label">{label}</strong>
            <div className="detail-value">
                <span>{value}</span>
                {copyable && <button onClick={handleCopy} className="btn btn-sm btn-ghost">{copied ? 'Copiado!' : 'Copiar'}</button>}
            </div>
        </div>
    );
};

const LogDetailsModal = ({ log, onClose }) => {
    const [copiedJson, setCopiedJson] = useState(false);

    if (!log) return null;

    const handleCopyJson = () => {
        copyToClipboard(JSON.stringify(log, null, 2), () => {
            setCopiedJson(true);
            setTimeout(() => setCopiedJson(false), 2000);
        });
    };
    
    const targetId = log.targetId || log.targetUid || log.requestId;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Detalhes do Log</h3>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>
                <div className="modal-body">
                    <DetailRow label="ID do Log" value={log.id} copyable />
                    <DetailRow label="Ação" value={translateAction(log.action)} />
                    <DetailRow label="Tipo" value={getLogType(log.action)} />
                    <DetailRow label="Data" value={log.createdAt ? formatDateTime(log.createdAt.toDate()) : 'N/A'} />
                    <hr/>
                    <DetailRow label="Admin UID" value={log.adminUid} copyable />
                    <DetailRow label="Admin Email" value={log.adminEmail} />
                    <hr/>
                    <DetailRow label="ID do Alvo" value={targetId} copyable />
                    {log.amount && <DetailRow label="Valor" value={log.amount} />}
                    {log.reason && <DetailRow label="Motivo" value={log.reason} />}
                    
                    {log.previousValue && <DetailRow label="Valor Anterior" value={JSON.stringify(log.previousValue)} />}
                    {log.newValue && <DetailRow label="Novo Valor" value={JSON.stringify(log.newValue)} />}
                </div>
                <div className="modal-footer">
                    <button onClick={handleCopyJson} className="btn btn-ghost">{copiedJson ? 'Copiado!' : 'Copiar JSON'}</button>
                    <button onClick={onClose} className="btn btn-primary">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default LogDetailsModal;
