import React from 'react';

const MetricCard = ({ 
  title, 
  value, 
  subtitle,
  change, 
  status = 'neutral', 
  icon,
  size = 'default',
  onClick
}) => {
  const statusStyles = {
    good: {
      badge: 'bg-success/20 text-success border-success/30',
      glow: 'group-hover:shadow-glow-success',
      indicator: 'bg-success'
    },
    warning: {
      badge: 'bg-warning/20 text-warning border-warning/30',
      glow: 'group-hover:shadow-glow',
      indicator: 'bg-warning'
    },
    danger: {
      badge: 'bg-danger/20 text-danger border-danger/30',
      glow: 'group-hover:shadow-glow-danger',
      indicator: 'bg-danger'
    },
    neutral: {
      badge: 'bg-primary/20 text-primary border-primary/30',
      glow: 'group-hover:shadow-glow',
      indicator: 'bg-primary'
    }
  };

  const sizeStyles = {
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  const valueStyles = {
    small: 'text-2xl',
    default: 'text-4xl',
    large: 'text-5xl'
  };

  const currentStatus = statusStyles[status] || statusStyles.neutral;

  return (
    <div 
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl 
        bg-card/80 backdrop-blur-xl
        border border-border/50
        transition-all duration-300 ease-out
        hover:bg-card-hover hover:border-border-hover
        hover:scale-[1.02] ${currentStatus.glow}
        ${onClick ? 'cursor-pointer' : ''}
        ${sizeStyles[size]}
      `}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Status indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${currentStatus.indicator} opacity-60`} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-xl bg-white/5 text-text-secondary group-hover:text-primary transition-colors">
                {icon}
              </div>
            )}
            <p className="text-text-secondary text-sm font-medium">{title}</p>
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentStatus.indicator} animate-pulse`} />
          </div>
        </div>
        
        {/* Value */}
        <div className="flex items-end justify-between">
          <div>
            <h3 className={`font-bold text-text-primary ${valueStyles[size]} tracking-tight`}>
              {value}
            </h3>
            {subtitle && (
              <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
            )}
          </div>
          
          {change && (
            <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${currentStatus.badge}`}>
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
