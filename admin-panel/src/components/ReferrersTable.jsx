import React from 'react';
import StatusBadge from './StatusBadge';
import { formatPoints, MISSING } from '../utils/formatters';

const ReferrersTable = ({ referrers, onAction }) => {
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    }

    return (
        <div className="table-wrap">
            <table className="users-table">
                <thead>
                    <tr>
                        <th>Usuário</th>
                        <th>Código de Convite</th>
                        <th>Convidados</th>
                        <th>Convidados Válidos</th>
                        <th>Bônus Pendentes</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {referrers.map(user => (
                        <tr key={user.uid}>
                            <td><div><strong>{user.fullName || MISSING}</strong><span className="muted">{user.email || MISSING}</span></div></td>
                            <td>{user.referralCode || MISSING} <button onClick={()=>copyToClipboard(user.referralCode)}>Copiar</button></td>
                            <td>{user.invitedUsers?.length || 0}</td>
                            <td>{user.validInvitedUsers || 0}</td>
                            <td>{user.pendingBonuses || 0}</td>
                            <td><StatusBadge status={user.blocked ? 'blocked' : 'active'} /></td>
                            <td className="actions-col">
                                <button onClick={() => onAction('details', user)}>Ver Detalhes</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReferrersTable;
