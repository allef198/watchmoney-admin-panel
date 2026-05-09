import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FIRESTORE_COLLECTIONS } from '../firestoreSchema';
import Modal from './Modal'; // Assuming a generic Modal component exists

const FraudNoteModal = ({ user, isOpen, onClose, onFeedback }) => {
  const [note, setNote] = useState(user.fraudNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note) {
      onFeedback({ type: 'error', message: 'A anotação não pode estar vazia.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const userRef = doc(db, FIRESTORE_COLLECTIONS.users, user.uid);
      await updateDoc(userRef, {
        fraudNote: note,
        updatedAt: serverTimestamp(),
      });
      onFeedback({ type: 'success', message: 'Anotação salva com sucesso!' });
      onClose();
    } catch (error) { 
      onFeedback({ type: 'error', message: `Erro ao salvar: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Anotação de Fraude">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <p>Adicione uma anotação interna para o usuário <strong>{user.email}</strong>. Essa nota será visível apenas para administradores.</p>
          <textarea 
            className="textarea" 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="Detalhes sobre a suspeita de fraude..." 
            rows={5}
            required
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Anotação'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FraudNoteModal;
