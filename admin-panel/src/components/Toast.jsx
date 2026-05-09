import { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Fecha automaticamente após 5 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "toast";
  const typeClasses = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
  };

  const icon = {
      success: '✔',
      error: '✖',
      info: 'ℹ'
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
        <span className="toast-icon">{icon[type]}</span>
        <p className="toast-message">{message}</p>
        <button onClick={onClose} className="toast-close-btn">&times;</button>
    </div>
  );
};

export default Toast;
