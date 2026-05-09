import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FIRESTORE_COLLECTIONS, GLOBAL_NOTIFICATION_FIELDS, ADMIN_LOG_FIELDS, mapGlobalNoticeDoc } from '../firestoreSchema';
import NotificationsTable from '../components/NotificationsTable';
import NotificationForm from '../components/NotificationForm';
import ConfirmModal from '../components/ConfirmModal';

export default function Notifications() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyIds, setBusyIds] = useState({});

  const [editingNotice, setEditingNotice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ action: null, notice: null });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, FIRESTORE_COLLECTIONS.globalNotifications), (snap) => {
      const noticeList = snap.docs.map(mapGlobalNoticeDoc).sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setNotices(noticeList);
      setLoading(false);
    }, (err) => {
      setError(`Erro ao carregar avisos: ${err.message}`);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = (action, notice) => {
    if (action === 'edit') {
      setEditingNotice(notice);
      setShowForm(true);
    } else if (action === 'delete' || action === 'toggle') {
      setConfirmAction({ action, notice });
    }
  };

  const handleSaveNotice = async (formData) => {
    setSaving(true);
    setFeedback(null);
    const admin = auth.currentUser;
    const isEditing = !!editingNotice;

    try {
      const batch = writeBatch(db);
      const noticeRef = isEditing ? doc(db, FIRESTORE_COLLECTIONS.globalNotifications, editingNotice.id) : doc(collection(db, FIRESTORE_COLLECTIONS.globalNotifications));
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));
      
      const noticeData = {
        [GLOBAL_NOTIFICATION_FIELDS.title]: formData.title,
        [GLOBAL_NOTIFICATION_FIELDS.message]: formData.message,
        [GLOBAL_NOTIFICATION_FIELDS.active]: formData.active,
        [GLOBAL_NOTIFICATION_FIELDS.priority]: formData.priority,
        [GLOBAL_NOTIFICATION_FIELDS.updatedAt]: serverTimestamp(),
        [GLOBAL_NOTIFICATION_FIELDS.updatedBy]: admin.uid,
      };

      if (isEditing) {
        batch.update(noticeRef, noticeData);
      } else {
        batch.set(noticeRef, { ...noticeData, [GLOBAL_NOTIFICATION_FIELDS.createdAt]: serverTimestamp(), [GLOBAL_NOTIFICATION_FIELDS.createdBy]: admin.uid });
      }

      batch.set(logRef, {
          [ADMIN_LOG_FIELDS.action]: isEditing ? 'update_global_notification' : 'create_global_notification',
          [ADMIN_LOG_FIELDS.targetId]: noticeRef.id,
          [ADMIN_LOG_FIELDS.adminUid]: admin.uid,
          [ADMIN_LOG_FIELDS.createdAt]: serverTimestamp(),
          [ADMIN_LOG_FIELDS.newValue]: noticeData
      });

      await batch.commit();
      setFeedback({ type: 'success', message: `Aviso ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
      setShowForm(false);
      setEditingNotice(null);
    } catch (err) {
      setFeedback({ type: 'error', message: `Erro: ${err.message}` });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const executeConfirmedAction = async () => {
    const { action, notice } = confirmAction;
    setBusyIds(ids => ({ ...ids, [notice.id]: true }));

    try {
      const admin = auth.currentUser;
      const batch = writeBatch(db);
      const noticeRef = doc(db, FIRESTORE_COLLECTIONS.globalNotifications, notice.id);
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));

      if (action === 'delete') {
        await deleteDoc(noticeRef);
      } else if (action === 'toggle') {
        batch.update(noticeRef, { [GLOBAL_NOTIFICATION_FIELDS.active]: !notice.active, [GLOBAL_NOTIFICATION_FIELDS.updatedAt]: serverTimestamp(), [GLOBAL_NOTIFICATION_FIELDS.updatedBy]: admin.uid });
      }

      batch.set(logRef, {
        [ADMIN_LOG_FIELDS.action]: `${action}_global_notification`,
        [ADMIN_LOG_FIELDS.targetId]: notice.id,
        [ADMIN_LOG_FIELDS.adminUid]: admin.uid,
        [ADMIN_LOG_FIELDS.createdAt]: serverTimestamp(),
        [ADMIN_LOG_FIELDS.previousValue]: { active: notice.active },
        [ADMIN_LOG_FIELDS.newValue]: { active: !notice.active },
      });

      if (action === 'toggle') {
        await batch.commit();
      }

      setFeedback({ type: 'success', message: 'Ação executada com sucesso!' });
    } catch (err) {
      setFeedback({ type: 'error', message: `Erro: ${err.message}`});
    } finally {
      setBusyIds(ids => ({ ...ids, [notice.id]: false }));
      setConfirmAction({ action: null, notice: null });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1>Avisos Globais</h1>
          <p className="muted">Gerencie os comunicados exibidos no aplicativo.</p>
        </div>
        {!showForm && <button className="btn btn-primary" onClick={() => { setEditingNotice(null); setShowForm(true); }}>Novo Aviso</button>}
      </header>

      {feedback && <div className={`alert alert-${feedback.type}`}>{feedback.message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm ? (
        <NotificationForm 
          notice={editingNotice}
          onSave={handleSaveNotice}
          onCancel={() => { setShowForm(false); setEditingNotice(null); }}
          saving={saving}
        />
      ) : loading ? (
        <p>Carregando avisos...</p>
      ) : (
        <NotificationsTable notices={notices} onAction={handleAction} busyIds={busyIds} />
      )}

      {confirmAction.action && (
        <ConfirmModal
          open={true}
          title="Confirmar Ação"
          description={`Tem certeza que deseja ${confirmAction.action === 'delete' ? 'excluir' : (confirmAction.notice.active ? 'desativar' : 'ativar')} este aviso?`}
          onConfirm={executeConfirmedAction}
          onClose={() => setConfirmAction({ action: null, notice: null })}
        />
      )}
    </div>
  );
}
