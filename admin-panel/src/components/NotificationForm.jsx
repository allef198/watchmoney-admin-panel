import React, { useState, useEffect } from 'react';
import { GLOBAL_NOTIFICATION_FIELDS } from '../firestoreSchema';

const NotificationForm = ({ notice, onSave, onCancel, saving }) => {
  const [form, setForm] = useState({ title: '', message: '', active: true, priority: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (notice) {
      setForm({
        title: notice.title || '',
        message: notice.message || '',
        active: notice.active ?? true,
        priority: notice.priority ?? 0,
      });
    } else {
      setForm({ title: '', message: '', active: true, priority: 0 });
    }
  }, [notice]);

  const handleChange = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!form.title.trim() || !form.message.trim()) {
      setError('Título e mensagem são obrigatórios.');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card settings-card">
      <h3>{notice ? 'Editar Aviso' : 'Novo Aviso Global'}</h3>
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="form-grid form-grid-single">
        <label className="field">
          <span>Título</span>
          <input 
            type="text" 
            value={form.title} 
            onChange={e => handleChange(GLOBAL_NOTIFICATION_FIELDS.title, e.target.value)} 
            maxLength={120}
            placeholder="Ex.: Manutenção programada"
          />
        </label>
      </div>

      <label className="field field-full">
        <span>Mensagem</span>
        <textarea 
          className="textarea" 
          rows={6} 
          value={form.message}
          onChange={e => handleChange(GLOBAL_NOTIFICATION_FIELDS.message, e.target.value)}
          placeholder="Escreva a mensagem que será exibida no app."
        />
      </label>

      <div className="form-grid">
        <label className="field toggle-field">
          <span>Aviso Ativo</span>
          <span className="toggle-row">
            <input 
              type="checkbox" 
              checked={form.active}
              onChange={e => handleChange(GLOBAL_NOTIFICATION_FIELDS.active, e.target.checked)}
            />
            <span className="switch" />
            <strong>{form.active ? 'Sim' : 'Não'}</strong>
          </span>
        </label>

        <label className="field">
            <span>Prioridade</span>
            <input 
              type="number"
              min="0"
              step="1"
              value={form.priority}
              onChange={e => handleChange(GLOBAL_NOTIFICATION_FIELDS.priority, Number(e.target.value))}
            />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? (notice ? 'Salvando...' : 'Criando...') : (notice ? 'Salvar Alterações' : 'Criar Aviso')}
        </button>
      </div>

      <div className="preview-section">
          <h4>Prévia do Aviso</h4>
          <div className="mock-notification">
              <h5>{form.title || "Título do aviso"}</h5>
              <p>{form.message || "Mensagem do aviso aparecerá aqui."}</p>
          </div>
      </div>
    </form>
  );
};

export default NotificationForm;
