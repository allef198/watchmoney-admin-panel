import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px' }}>
          <h1>Erro ao carregar o painel</h1>
          <p>Ocorreu um erro inesperado. Recarregue a página ou verifique o console.</p>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>Detalhes Técnicos</summary>
              {this.state.error.toString()}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
