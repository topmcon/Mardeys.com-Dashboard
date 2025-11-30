import React from 'react';

const AlertBanner = ({ type = 'info', title, message, action, onAction, onDismiss }) => {
  const typeConfig = {
    success: {
      bg: 'bg-success/10',
      border: 'border-success/30',
      icon: '✓',
      iconBg: 'bg-success/20 text-success',
      title: 'text-success',
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      icon: '⚠',
      iconBg: 'bg-warning/20 text-warning',
      title: 'text-warning',
    },
    danger: {
      bg: 'bg-danger/10',
      border: 'border-danger/30',
      icon: '!',
      iconBg: 'bg-danger/20 text-danger',
      title: 'text-danger',
    },
    info: {
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      icon: 'ℹ',
      iconBg: 'bg-primary/20 text-primary',
      title: 'text-primary',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div className={`
      rounded-xl ${config.bg} border ${config.border}
      p-4 flex items-start gap-4
    `}>
      <div className={`p-2 rounded-lg ${config.iconBg} text-lg font-bold flex-shrink-0`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-semibold ${config.title} mb-1`}>{title}</h4>
        )}
        {message && (
          <p className="text-text-secondary text-sm">{message}</p>
        )}
        {action && (
          <button 
            onClick={onAction}
            className={`mt-3 text-sm font-medium ${config.title} hover:underline`}
          >
            {action} →
          </button>
        )}
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-text-secondary hover:text-text-primary transition-colors p-1"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
