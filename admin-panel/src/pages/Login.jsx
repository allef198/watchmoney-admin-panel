import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

const ERROR_MESSAGES = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/network-request-failed': 'Falha de rede. Verifique sua conexão.',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Falha ao entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" data-testid="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo lg">W</div>
          <h1>WatchMoney</h1>
          <p className="muted">Painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemplo.com"
              data-testid="login-email"
              disabled={loading}
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              data-testid="login-password"
              disabled={loading}
              required
            />
          </label>

          {error && (
            <div className="form-error" data-testid="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} data-testid="login-submit">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="login-footnote muted">
          Acesso restrito ao administrador autorizado.
        </p>
      </div>
    </div>
  );
}
