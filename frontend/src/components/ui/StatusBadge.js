import React from 'react';

const StatusBadge = ({ status, label, size = 'default', pulse = true }) => {
  const statusConfig = {
    online: {
      bg: 'bg-success/20',
      text: 'text-success',
      border: 'border-success/30',
      dot: 'bg-success',
      label: label || 'Online'
    },
    healthy: {
      bg: 'bg-success/20',
      text: 'text-success',
      border: 'border-success/30',
      dot: 'bg-success',
      label: label || 'Healthy'
    },
    active: {
      bg: 'bg-success/20',
      text: 'text-success',
      border: 'border-success/30',
      dot: 'bg-success',
      label: label || 'Active'
    },
    warning: {
      bg: 'bg-warning/20',
      text: 'text-warning',
      border: 'border-warning/30',
      dot: 'bg-warning',
      label: label || 'Warning'
    },
    degraded: {
      bg: 'bg-warning/20',
      text: 'text-warning',
      border: 'border-warning/30',
      dot: 'bg-warning',
      label: label || 'Degraded'
    },
    offline: {
      bg: 'bg-danger/20',
      text: 'text-danger',
      border: 'border-danger/30',
      dot: 'bg-danger',
      label: label || 'Offline'
    },
    critical: {
      bg: 'bg-danger/20',
      text: 'text-danger',
      border: 'border-danger/30',
      dot: 'bg-danger',
      label: label || 'Critical'
    },
    error: {
      bg: 'bg-danger/20',
      text: 'text-danger',
      border: 'border-danger/30',
      dot: 'bg-danger',
      label: label || 'Error'
    },
    unknown: {
      bg: 'bg-muted/20',
      text: 'text-muted',
      border: 'border-muted/30',
      dot: 'bg-muted',
      label: label || 'Unknown'
    }
  };

  const sizeConfig = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base'
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span className={`
      inline-flex items-center gap-2 rounded-full border font-medium
      ${config.bg} ${config.text} ${config.border}
      ${sizeConfig[size]}
    `}>
      <span className={`w-2 h-2 rounded-full ${config.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
