import React from 'react';
import { formatDateTime, formatPoints } from '../utils/formatters';

const PendingBonusesTable = ({ bonuses, onAction }) => {

    return (
        <div className="table-wrap">
            <table className="users-table">
                <thead>
                    <tr>
                        <th>Indicador</th>
                        <th>Convidado</th>
                        <th>Bônus</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {bonuses.map(bonus => (
                        <tr key={bonus.id}>
                            <td>{bonus.referrerUid}</td>
                            <td>{bonus.invitedUid}</td>
                            <td>{formatPoints(bonus.bonusPoints)}</td>
                            <td>{bonus.status}</td>
                            <td>{formatDateTime(bonus.createdAt)}</td>
                            <td className="actions-col">
                                <button onClick={() => onAction('copy', bonus.referrerUid)}>Copiar Indicador</button>
                                <button onClick={() => onAction('copy', bonus.invitedUid)}>Copiar Convidado</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PendingBonusesTable;
