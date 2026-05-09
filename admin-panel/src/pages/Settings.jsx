import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FIRESTORE_COLLECTIONS, APP_CONFIG_DEFAULTS, ADMIN_LOG_FIELDS, APP_CONFIG_FIELDS } from '../firestoreSchema';
import WithdrawSettings from '../components/WithdrawSettings';
import MaintenanceSettings from '../components/MaintenanceSettings';

function normalizeConfig(data) {
  return { ...APP_CONFIG_DEFAULTS, ...data };
}

export default function Settings() {
  const [config, setConfig] = useState(APP_CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const configRef = doc(db, FIRESTORE_COLLECTIONS.appConfig, 'main');
    const unsub = onSnapshot(configRef, async (snap) => {
      if (snap.exists()) {
        setConfig(normalizeConfig(snap.data()));
      } else {
        // Document does not exist, create it with defaults
        try {
          const admin = auth.currentUser;
          const batch = writeBatch(db);
          batch.set(configRef, { 
            ...APP_CONFIG_DEFAULTS,
            [APP_CONFIG_FIELDS.createdAt]: serverTimestamp(),
            [APP_CONFIG_FIELDS.updatedAt]: serverTimestamp(),
            [APP_CONFIG_FIELDS.updatedBy]: admin?.uid || null,
           });
          await batch.commit();
        } catch (err) {
          setError(`Erro ao criar config: ${err.message}`);
        }
      }
      setLoading(false);
    }, (err) => {
      setError(`Erro ao carregar config: ${err.message}`);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = useCallback(async (newData, actionName) => {
    setSaving(true);
    setFeedback(null);
    const admin = auth.currentUser;

    try {
      const batch = writeBatch(db);
      const configRef = doc(db, FIRESTORE_COLLECTIONS.appConfig, 'main');
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));
      
      const previousData = {};
      Object.keys(newData).forEach(key => {
          previousData[key] = config[key];
      });

      batch.update(configRef, { ...newData, [APP_CONFIG_FIELDS.updatedAt]: serverTimestamp(), [APP_CONFIG_FIELDS.updatedBy]: admin.uid });
      batch.set(logRef, {
        [ADMIN_LOG_FIELDS.action]: actionName,
        [ADMIN_LOG_FIELDS.adminUid]: admin.uid,
        [ADMIN_LOG_FIELDS.createdAt]: serverTimestamp(),
        [ADMIN_LOG_FIELDS.previousValue]: previousData,
        [ADMIN_LOG_FIELDS.newValue]: newData,
      });

      await batch.commit();
      setFeedback({ type: 'success', message: 'Configurações salvas com sucesso!' });
    } catch (err) {
      setFeedback({ type: 'error', message: `Erro ao salvar: ${err.message}` });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  }, [config]);

  if (loading) {
    return <p>Carregando configurações...</p>;
  }

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Configurações</h1>
        <p className="muted">Controle os parâmetros gerais do aplicativo.</p>
      </header>

      {feedback && <div className={`alert alert-${feedback.type}`}>{feedback.message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <WithdrawSettings 
        config={config}
        onSave={(data) => handleSave(data, 'update_withdraw_settings')}
        saving={saving} 
      />

      <MaintenanceSettings 
        config={config}
        onSave={(data) => handleSave(data, 'update_maintenance_mode')}
        saving={saving}
      />

    </div>
  );
}
