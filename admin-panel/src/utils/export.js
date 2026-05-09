import { formatDateTime } from './formatters';

const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    let str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

export const exportUsersToCSV = (users) => {
    if (!users || users.length === 0) {
        alert("Nenhum usuário para exportar.");
        return;
    }

    const headers = ["ID", "Email", "Pontos", "Data de Cadastro", "Bloqueado"];
    const csvRows = [headers.join(',')];

    for (const user of users) {
        const row = {
            id: user.uid,
            email: user.email || 'N/A',
            points: user.points || 0,
            createdAt: user.createdAt ? formatDateTime(user.createdAt.toDate()) : 'N/A',
            blocked: user.blocked ? 'Sim' : 'Não',
        };
        const values = Object.values(row).map(escapeCSV);
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `watchmoney_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
