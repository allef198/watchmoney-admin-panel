import { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase.js';
import { FIRESTORE_COLLECTIONS } from '../firestoreSchema.js';
import { logAdminAction } from '../utils/logUtils.js';

const AdjustPointsModal = ({ user, isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAdjust = async (e) => {
        e.preventDefault();
        const pointsToAdjust = parseInt(amount, 10);

        if (isNaN(pointsToAdjust) || pointsToAdjust === 0) {
            setError('Por favor, insira um número válido de pontos.');
            return;
        }

        if (pointsToAdjust < 0 && (user.points + pointsToAdjust) < 0) {
            setError('O usuário não pode ter pontos negativos.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const batch = writeBatch(db);
            const userRef = doc(db, FIRESTORE_COLLECTIONS.users, user.uid);

            const newPoints = (user.points || 0) + pointsToAdjust;
            batch.update(userRef, { points: newPoints });

            await batch.commit();

            await logAdminAction('adjust_points', {
                targetUid: user.uid,
                previousValue: user.points,
                newValue: newPoints,
                amount: pointsToAdjust
            });

            onSuccess(user.uid, newPoints);
            onClose();

        } catch (err) {
            console.error("Erro ao ajustar pontos: ", err);
            setError('Falha ao ajustar os pontos. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Ajustar Pontos de {user.email}</h3>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>
                <form onSubmit={handleAdjust}>
                    <div className="modal-body">
                        <p>Pontos atuais: <strong>{user.points || 0}</strong></p>
                        <label htmlFor="points-amount">Pontos para adicionar ou remover:</label>
                        <input
                            id="points-amount"
                            type="number"
                            className="form-control"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ex: 100 para adicionar, -50 para remover"
                            autoFocus
                        />
                        {error && <p className="alert alert-danger mt-2">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar Ajuste'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdjustPointsModal;
