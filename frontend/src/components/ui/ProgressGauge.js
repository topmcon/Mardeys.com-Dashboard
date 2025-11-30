import React from 'react';

const ProgressGauge = ({ value, max = 100, label, status = 'neutral', size = 'default' }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const getStatus = () => {
    if (status !== 'auto') return status;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'good';
  };

  const currentStatus = getStatus();

  const statusColors = {
    good: {
      bar: 'bg-gradient-to-r from-success to-success-light',
      glow: 'shadow-glow-success',
      text: 'text-success'
    },
    warning: {
      bar: 'bg-gradient-to-r from-warning to-warning-light',
      glow: 'shadow-glow',
      text: 'text-warning'
    },
    danger: {
      bar: 'bg-gradient-to-r from-danger to-danger-light',
      glow: 'shadow-glow-danger',
      text: 'text-danger'
    },
    neutral: {
      bar: 'bg-gradient-to-r from-primary to-primary-light',
      glow: 'shadow-glow',
      text: 'text-primary'
    }
  };

  const sizeConfig = {
    small: { height: 'h-2', text: 'text-lg' },
    default: { height: 'h-3', text: 'text-2xl' },
    large: { height: 'h-4', text: 'text-3xl' }
  };

  const colors = statusColors[currentStatus];
  const sizing = sizeConfig[size];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <span className="text-text-secondary text-sm">{label}</span>}
        <span className={`font-bold ${sizing.text} ${colors.text}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className={`w-full bg-border/50 rounded-full ${sizing.height} overflow-hidden`}>
        <div 
          className={`${sizing.height} rounded-full ${colors.bar} transition-all duration-500 ease-out ${colors.glow}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressGauge;
