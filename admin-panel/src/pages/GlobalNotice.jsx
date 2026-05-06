import { useState } from 'react';
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, ADMIN_UID } from '../firebase.js';
import {
  ADMIN_LOG_FIELDS,
  FIRESTORE_COLLECTIONS,
} from '../firestoreSchema.js';

export default function GlobalNotice() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const admin = auth.currentUser;
    if (!admin || admin.uid !== ADMIN_UID) {
      setFeedback({ type: 'error', message: 'Acesso negado.' });
      return;
    }

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle || !cleanMessage) {
      setFeedback({ type: 'error', message: 'Informe título e mensagem para criar o aviso.' });
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const notificationRef = doc(collection(db, FIRESTORE_COLLECTIONS.globalNotifications));
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));
      const logFields = ADMIN_LOG_FIELDS;

      batch.set(notificationRef, {
        title: cleanTitle,
        message: cleanMessage,
        createdAt: serverTimestamp(),
        createdBy: admin.uid,
        active: true,
      });

      batch.set(logRef, {
        [logFields.action]: 'create_global_notification',
        [logFields.title]: cleanTitle,
        [logFields.adminUid]: admin.uid,
        [logFields.adminEmail]: admin.email || null,
        [logFields.createdAt]: serverTimestamp(),
      });

      await batch.commit();
      setTitle('');
      setMessage('');
      setFeedback({ type: 'success', message: 'Aviso global criado com sucesso.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.code === 'permission-denied'
            ? 'Permissão negada pelo Firestore. Verifique as regras.'
            : `Erro ao criar aviso global: ${err.message}`,
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="dashboard" data-testid="global-notice-page">
      <header className="page-header">
        <div>
          <h1>Aviso global</h1>
          <p className="muted">Crie um comunicado único em globalNotifications.</p>
        </div>
      </header>

      {feedback && <div className={`alert alert-${feedback.type}`} data-testid={`notice-${feedback.type}`}>{feedback.message}</div>}

      <form className="card settings-card" onSubmit={handleSubmit}>
        <h3>Novo aviso</h3>

        <div className="form-grid form-grid-single">
          <label className="field">
            <span>Título</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Manutenção programada"
              maxLength={120}
            />
          </label>
        </div>

        <label className="field field-full">
          <span>Mensagem</span>
          <textarea
            className="textarea"
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escreva a mensagem que será salva como aviso global."
          />
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Criando...' : 'Criar aviso global'}
          </button>
        </div>
      </form>
    </div>
  );
}
