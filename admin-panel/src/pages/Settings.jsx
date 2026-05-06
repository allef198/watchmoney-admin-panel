import { auth, ADMIN_UID } from '../firebase.js';

export default function Settings() {
  const user = auth.currentUser;
  return (
    <div className="dashboard" data-testid="settings-page">
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p className="muted">Detalhes da conta e do projeto Firebase.</p>
        </div>
      </header>

      <div className="card settings-card">
        <h3>Conta administradora</h3>
        <Row label="E-mail" value={user?.email || '—'} />
        <Row label="UID" value={user?.uid || '—'} mono />
        <Row label="ADMIN_UID configurado" value={ADMIN_UID} mono />

        <hr />

        <h3>Boas práticas de segurança</h3>
        <ul className="check-list">
          <li>✓ Apenas o UID <code>{ADMIN_UID.slice(0, 8)}…</code> tem acesso ao painel.</li>
          <li>✓ Nenhuma chave privada ou serviceAccount.json está no frontend.</li>
          <li>✓ Todas as ações sensíveis ficam registradas em <code>adminLogs</code>.</li>
          <li>✓ As regras do Firestore devem restringir <code>withdrawRequests</code> ao admin.</li>
        </ul>

        <div className="warning-box">
          ⚠ Para a devolução de pontos em rejeições, recomenda-se uma Cloud Function
          ou regra transacional no backend, em vez de fazer no cliente.
        </div>
      </div>
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
