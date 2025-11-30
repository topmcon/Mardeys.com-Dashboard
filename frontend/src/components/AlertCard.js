import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const AlertCard = ({ alert, onAcknowledge, onResolve, compact = false }) => {
  const severityConfig = {
    info: {
      icon: 'ℹ️',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    warning: {
      icon: '⚠️',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    error: {
      icon: '❌',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    },
    critical: {
      icon: '🔴',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800'
    }
  };

  const config = severityConfig[alert.severity] || severityConfig.info;

  if (compact) {
    return (
      <div className={`${config.bg} ${config.border} border rounded-lg p-3 hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-lg">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${config.text} truncate`}>{alert.title}</p>
              <p className="text-xs text-gray-500">{alert.source} • {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
          {alert.status === 'active' && onAcknowledge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(alert._id);
              }}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Ack
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-6 hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <span className="text-3xl">{config.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${config.badge}`}>
                {alert.severity.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500 font-medium">{alert.source}</span>
            </div>
            <h3 className={`text-lg font-semibold ${config.text} mb-2`}>
              {alert.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>🕐 {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
              {alert.acknowledgedAt && (
                <span>✓ Acknowledged {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-2 ml-4">
          {alert.status === 'active' && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert._id)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Acknowledge
            </button>
          )}
          {alert.status === 'acknowledged' && onResolve && (
            <button
              onClick={() => onResolve(alert._id)}
              className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
