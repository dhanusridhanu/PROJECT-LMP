import React from 'react';

const AlertMessage = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const typeClass = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  }[type] || 'alert-info';

  const icons = {
    success: '✅',
    error: '⚠️',
    warning: '🔔',
    info: 'ℹ️',
  };

  return (
    <div className={`alert ${typeClass}`}>
      <span>{icons[type]}</span>
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1rem',
            lineHeight: 1,
            color: 'inherit',
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
