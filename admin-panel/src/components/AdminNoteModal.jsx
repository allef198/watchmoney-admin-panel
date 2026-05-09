import React, { useState } from 'react';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FIRESTORE_COLLECTIONS, ADMIN_LOG_FIELDS } from '../firestoreSchema';

const AdminNoteModal = ({ request, isOpen, onClose, onFeedback }) => {
  const [note, setNote] = useState(request?.adminNote || '');
  const [working, setWorking] = useState(false);

  if (!isOpen || !request) return null;

  const handleSave = async () => {
    setWorking(true);
    try {
      const batch = writeBatch(db);
      const requestRef = doc(db, FIRESTORE_COLLECTIONS.withdrawRequests, request.id);
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));

      batch.update(requestRef, { adminNote: note, updatedAt: serverTimestamp() });

      batch.set(logRef, {
        [ADMIN_LOG_FIELDS.action]: 'update_withdrawal_admin_note',
        [ADMIN_LOG_FIELDS.targetId]: request.id,
        [ADMIN_LOG_FIELDS.targetUid]: request.uid,
        [ADMIN_LOG_FIELDS.adminUid]: auth.currentUser.uid,
        [ADMIN_LOG_FIELDS.reason]: note,
        [ADMIN_LOG_FIELDS.createdAt]: serverTimestamp(),
      });

      await batch.commit();
      onFeedback({ type: 'success', message: 'Observação salva com sucesso!' });
      onClose();
    } catch (error) {
      onFeedback({ type: 'error', message: `Erro ao salvar observação: ${error.message}` });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Observação Interna</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <p>Saque: {request.id}</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="4" style={{ width: '100%' }} placeholder="Adicione uma observação interna sobre este saque..."></textarea>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={working}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={working}>{working ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );
};

export default AdminNoteModal;
