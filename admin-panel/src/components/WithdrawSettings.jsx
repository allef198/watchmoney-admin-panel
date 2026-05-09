import React, { useState, useEffect } from 'react';
import { APP_CONFIG_FIELDS } from '../firestoreSchema';

const WithdrawSettings = ({ config, onSave, saving, error }) => {
  const [form, setForm] = useState(config);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleChange = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    setValidationError('');
    const pointsPerReal = Number(form.pointsPerReal);
    const minWithdrawAmount = Number(form.minWithdrawAmount);

    if (!Number.isFinite(pointsPerReal) || pointsPerReal <= 0) {
      setValidationError('Pontos por real deve ser um número maior que zero.');
      return;
    }
    if (!Number.isFinite(minWithdrawAmount) || minWithdrawAmount < 1) {
      setValidationError('Valor mínimo de saque deve ser um número maior ou igual a 1.');
      return;
    }
    onSave(form);
  };

  const pointsPerReal = Number(form.pointsPerReal) || 0;
  const minWithdrawAmount = Number(form.minWithdrawAmount) || 0;
  const minWithdrawPoints = minWithdrawAmount * pointsPerReal;

  return (
    <div className="card settings-card">
      <h3>Configurações de Saque</h3>
      {validationError && <div className="alert alert-error">{validationError}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        <label className="field toggle-field">
          <span>Saques</span>
          <span className="toggle-row">
            <input 
              type="checkbox" 
              checked={form.withdrawEnabled}
              onChange={e => handleChange(APP_CONFIG_FIELDS.withdrawEnabled, e.target.checked)}
            />
            <span className="switch" />
            <strong>{form.withdrawEnabled ? 'Ativados' : 'Desativados'}</strong>
          </span>
        </label>
        
        <label className="field">
          <span>Pontos por R$ 1,00</span>
          <input 
            type="number" 
            min="1"
            step="1"
            value={form.pointsPerReal}
            onChange={e => handleChange(APP_CONFIG_FIELDS.pointsPerReal, e.target.value)}
          />
        </label>

        <label className="field">
          <span>Valor Mínimo de Saque (R$)</span>
          <input 
            type="number"
            min="1"
            step="1"
            value={form.minWithdrawAmount}
            onChange={e => handleChange(APP_CONFIG_FIELDS.minWithdrawAmount, e.target.value)}
          />
        </label>
      </div>

      <label className="field field-full">
        <span>Mensagem (Saques Desativados)</span>
        <textarea 
          className="textarea" 
          rows={3} 
          value={form.withdrawDisabledMessage}
          onChange={e => handleChange(APP_CONFIG_FIELDS.withdrawDisabledMessage, e.target.value)}
          placeholder="Ex.: Manutenção nos pagamentos"
        />
      </label>

      <div className="preview-section">
          <h4>Prévia de Conversão</h4>
          <p>Com <strong>{pointsPerReal.toLocaleString('pt-BR')}</strong> pontos por real, <strong>R$ 1,00</strong> equivale a <strong>{pointsPerReal.toLocaleString('pt-BR')}</strong> pontos.</p>
          <p>O saque mínimo de <strong>R$ {minWithdrawAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong> exige <strong>{minWithdrawPoints.toLocaleString('pt-BR')}</strong> pontos.</p>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configurações de Saque'}
        </button>
      </div>
    </div>
  );
};

export default WithdrawSettings;        
