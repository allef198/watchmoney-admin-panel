import React, { useState, useEffect } from 'react';
import { APP_CONFIG_FIELDS } from '../firestoreSchema';
import ConfirmModal from './ConfirmModal';

const MaintenanceSettings = ({ config, onSave, saving, error }) => {
  const [form, setForm] = useState(config);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleChange = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleToggleMaintenance = () => {
    if (form.maintenanceMode) {
        // If turning off, no confirmation needed, just save
        onSave({ ...form, [APP_CONFIG_FIELDS.maintenanceMode]: false });
    } else {
        // If turning on, show confirmation
        setShowConfirm(true);
    }
  }

  const confirmToggle = () => {
    const message = form.maintenanceMessage.trim() === '' ? 'O aplicativo está em manutenção. Tente novamente mais tarde.' : form.maintenanceMessage;
    onSave({ ...form, [APP_CONFIG_FIELDS.maintenanceMode]: true, [APP_CONFIG_FIELDS.maintenanceMessage]: message });
    setShowConfirm(false);
  }

  return (
    <div className="card settings-card">
      <h3>Modo Manutenção</h3>
      {error && <div className="alert alert-error">{error}</div>}
      
      {form.maintenanceMode && 
        <div className="alert alert-danger"><strong>Modo manutenção ativo.</strong> O app está bloqueado para os usuários.</div>
      }

      <div className="form-grid">
        <label className="field toggle-field">
          <span>Status da Manutenção</span>
          <span className="toggle-row">
            <input 
              type="checkbox" 
              checked={form.maintenanceMode}
              onChange={handleToggleMaintenance}
              disabled={saving}
            />
            <span className="switch" />
            <strong>{form.maintenanceMode ? 'Ativo' : 'Inativo'}</strong>
          </span>
        </label>
      </div>

      <label className="field field-full">
        <span>Mensagem de Manutenção</span>
        <textarea 
          className="textarea" 
          rows={3} 
          value={form.maintenanceMessage}
          onChange={e => handleChange(APP_CONFIG_FIELDS.maintenanceMessage, e.target.value)}
          placeholder="A mensagem que será exibida no app durante a manutenção."
        />
      </label>

       <div className="preview-section">
          <h4>Prévia da Manutenção</h4>
          <div className="mock-maintenance">
              <h5>Aplicativo em Manutenção</h5>
              <p>{form.maintenanceMessage || "O aplicativo está em manutenção. Tente novamente mais tarde."}</p>
          </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Mensagem'}
        </button>
      </div>

      {showConfirm && 
        <ConfirmModal 
            open={true} 
            title="Ativar Modo Manutenção?"
            description="Os usuários não poderão usar o app. Deseja continuar?"
            onConfirm={confirmToggle} 
            onClose={() => setShowConfirm(false)}
        />
      }
    </div>
  );
};

export default MaintenanceSettings;
