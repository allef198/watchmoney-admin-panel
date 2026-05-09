
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../firestoreSchema';
import { formatDateTime } from './formatters';

export const logAdminAction = async (action, details = {}) => {
    if (!auth.currentUser) {
        console.error("Admin action logging failed: No authenticated user.");
        return;
    }
    try {
        await addDoc(collection(db, FIRESTORE_COLLECTIONS.adminLogs), {
            action,
            ...details,
            adminUid: auth.currentUser.uid,
            adminEmail: auth.currentUser.email,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to log admin action:", error);
    }
};

export const translateAction = (action) => {
    const translations = {
        'approve_withdraw': 'Saque Aprovado',
        'reject_withdraw': 'Saque Rejeitado',
        'pay_withdraw': 'Saque Pago',
        'block_user': 'Usuário Bloqueado',
        'unblock_user': 'Usuário Desbloqueado',
        'adjust_points': 'Pontos Ajustados',
        'update_settings': 'Configurações Atualizadas',
        'create_notification': 'Aviso Criado',
        'update_notification': 'Aviso Atualizado',
        'delete_notification': 'Aviso Deletado',
        'save_fraud_note': 'Nota de Fraude Salva',
        'export_users': 'Exportação de Usuários',
        'export_withdraws': 'Exportação de Saques',
        'export_logs': 'Exportação de Logs',
    };
    return translations[action] || action;
};

export const getLogType = (action) => {
    if (action.includes('withdraw')) return 'Saque';
    if (action.includes('user')) return 'Usuário';
    if (action.includes('points')) return 'Pontos';
    if (action.includes('settings')) return 'Configuração';
    if (action.includes('notification')) return 'Aviso';
    if (action.includes('fraud')) return 'Anti-Fraude';
    if (action.includes('export')) return 'Exportação';
    return 'Outro';
};

export const exportLogsToCSV = (logs) => {
    if (!logs || logs.length === 0) {
        alert("Nenhum log para exportar.");
        return;
    }

    const headers = ["ID", "Data", "Admin Email", "Ação", "Tipo", "ID do Alvo", "Detalhes"];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
        const details = {
             reason: log.reason,
             amount: log.amount,
             newValue: log.newValue,
             previousValue: log.previousValue,
        };
        const formattedDetails = JSON.stringify(details).replace(/"/g, "'");

        const row = {
            id: log.id,
            createdAt: log.createdAt ? formatDateTime(log.createdAt.toDate()) : 'N/A',
            adminEmail: log.adminEmail || 'N/A',
            action: translateAction(log.action),
            type: getLogType(log.action),
            target: log.targetId || log.targetUid || log.requestId || 'N/A',
            details: formattedDetails,
        };

        const values = Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`);
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `watchmoney_admin_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
