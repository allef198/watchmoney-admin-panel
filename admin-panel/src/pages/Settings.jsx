import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, ADMIN_UID } from '../firebase.js';
import {
  ADMIN_LOG_FIELDS,
  APP_CONFIG_DEFAULTS,
  FIRESTORE_COLLECTIONS,
} from '../firestoreSchema.js';

function normalizeConfig(data = {}) {
  return {
    withdrawEnabled: data.withdrawEnabled ?? APP_CONFIG_DEFAULTS.withdrawEnabled,
    pointsPerReal: data.pointsPerReal ?? APP_CONFIG_DEFAULTS.pointsPerReal,
    minWithdrawAmount: data.minWithdrawAmount ?? APP_CONFIG_DEFAULTS.minWithdrawAmount,
    maintenanceMode: data.maintenanceMode ?? APP_CONFIG_DEFAULTS.maintenanceMode,
    globalMessage: data.globalMessage ?? APP_CONFIG_DEFAULTS.globalMessage,
  };
}

export default function Settings() {
  const user = auth.currentUser;
  const createdDefaults = useRef(false);
  const [form, setForm] = useState(APP_CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const configRef = doc(db, FIRESTORE_COLLECTIONS.appConfig, 'settings');
    const unsub = onSnapshot(
      configRef,
      async (snap) => {
        if (!snap.exists()) {
          setForm(APP_CONFIG_DEFAULTS);
          setLoading(false);

          if (!createdDefaults.current) {
            createdDefaults.current = true;
            try {
              const batch = writeBatch(db);
              batch.set(configRef, {
                ...APP_CONFIG_DEFAULTS,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                updatedBy: ADMIN_UID,
              }, { merge: true });
              await batch.commit();
            } catch (err) {
              setError(
                err.code === 'permission-denied'
                  ? 'Sem permissão para criar appConfig/settings. Verifique as regras do Firestore.'
                  : `Erro ao criar configurações padrão: ${err.message}`
              );
            }
          }
          return;
        }

        setForm(normalizeConfig(snap.data()));
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? 'Sem permissão para ler appConfig/settings. Verifique as regras do Firestore.'
            : `Erro ao carregar configurações: ${err.message}`
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const admin = auth.currentUser;
    if (!admin || admin.uid !== ADMIN_UID) {
      setFeedback({ type: 'error', message: 'Acesso negado.' });
      return;
    }

    const pointsPerReal = Number(form.pointsPerReal);
    const minWithdrawAmount = Number(form.minWithdrawAmount);
    if (!Number.isFinite(pointsPerReal) || pointsPerReal <= 0) {
      setFeedback({ type: 'error', message: 'Informe um valor válido para pontos por real.' });
      return;
    }
    if (!Number.isFinite(minWithdrawAmount) || minWithdrawAmount <= 0) {
      setFeedback({ type: 'error', message: 'Informe um valor mínimo de saque válido.' });
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const configRef = doc(db, FIRESTORE_COLLECTIONS.appConfig, 'settings');
      const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.adminLogs));
      const logFields = ADMIN_LOG_FIELDS;

      batch.set(configRef, {
        withdrawEnabled: Boolean(form.withdrawEnabled),
        pointsPerReal,
        minWithdrawAmount,
        maintenanceMode: Boolean(form.maintenanceMode),
        globalMessage: form.globalMessage || '',
        updatedAt: serverTimestamp(),
        updatedBy: admin.uid,
      }, { merge: true });

      batch.set(logRef, {
        [logFields.action]: 'update_app_config',
        [logFields.adminUid]: admin.uid,
        [logFields.adminEmail]: admin.email || null,
        [logFields.createdAt]: serverTimestamp(),
      });

      await batch.commit();
      setFeedback({ type: 'success', message: 'Configurações salvas com sucesso.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.code === 'permission-denied'
            ? 'Permissão negada pelo Firestore. Verifique as regras.'
            : `Erro ao salvar configurações: ${err.message}`,
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="dashboard" data-testid="settings-page">
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p className="muted">Controle parâmetros gerais do WatchMoney.</p>
        </div>
      </header>

      {error && <div className="alert alert-error" data-testid="settings-error">{error}</div>}
      {feedback && <div className={`alert alert-${feedback.type}`} data-testid={`settings-${feedback.type}`}>{feedback.message}</div>}

      <form className="card settings-card" onSubmit={handleSave}>
        <h3>Configurações do app</h3>

        {loading ? (
          <div className="empty-state empty-state-sm">Carregando configurações...</div>
        ) : (
          <>
            <div className="form-grid">
              <label className="field toggle-field">
                <span>Saques</span>
                <span className="toggle-row">
                  <input
                    type="checkbox"
                    checked={Boolean(form.withdrawEnabled)}
                    onChange={(event) => updateField('withdrawEnabled', event.target.checked)}
                  />
                  <span className="switch" aria-hidden="true" />
                  <strong>{form.withdrawEnabled ? 'Ativados' : 'Desativados'}</strong>
                </span>
              </label>

              <label className="field toggle-field">
                <span>Modo manutenção</span>
                <span className="toggle-row">
                  <input
                    type="checkbox"
                    checked={Boolean(form.maintenanceMode)}
                    onChange={(event) => updateField('maintenanceMode', event.target.checked)}
                  />
                  <span className="switch" aria-hidden="true" />
                  <strong>{form.maintenanceMode ? 'Ligado' : 'Desligado'}</strong>
                </span>
              </label>

              <label className="field">
                <span>Pontos por real</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.pointsPerReal}
                  onChange={(event) => updateField('pointsPerReal', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Valor mínimo de saque</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.minWithdrawAmount}
                  onChange={(event) => updateField('minWithdrawAmount', event.target.value)}
                />
              </label>
            </div>

            <label className="field field-full">
              <span>Mensagem global</span>
              <textarea
                className="textarea"
                rows={4}
                value={form.globalMessage}
                onChange={(event) => updateField('globalMessage', event.target.value)}
                placeholder="Mensagem exibida no app, se usada pelo Android."
              />
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          </>
        )}

        <hr />

        <h3>Conta administradora</h3>
        <Row label="E-mail" value={user?.email || '—'} />
        <Row label="UID" value={user?.uid || '—'} mono />
        <Row label="ADMIN_UID configurado" value={ADMIN_UID} mono />
      </form>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="settings-row">
      <div className="settings-label">{label}</div>
      <div className={'settings-value' + (mono ? ' mono' : '')}>{value}</div>
    </div>
  );
}
