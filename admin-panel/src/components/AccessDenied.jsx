export default function AccessDenied({ user, onLogout }) {
  return (
    <div className="access-denied" data-testid="access-denied">
      <div className="access-card">
        <div className="access-icon">⛔</div>
        <h1>Acesso negado</h1>
        <p>
          A conta <strong>{user?.email}</strong> não possui permissão para acessar
          este painel administrativo.
        </p>
        <p className="muted">
          Apenas o administrador autorizado pode visualizar e gerenciar os
          saques do WatchMoney.
        </p>
        <button className="btn btn-primary" onClick={onLogout} data-testid="access-denied-logout">
          Sair desta conta
        </button>
      </div>
    </div>
  );
}
