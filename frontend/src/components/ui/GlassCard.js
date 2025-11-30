import React from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  hover = true,
  padding = 'default',
  onClick 
}) => {
  const paddingStyles = {
    none: '',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-card/60 backdrop-blur-xl
        border border-border/50
        ${hover ? 'transition-all duration-300 hover:bg-card-hover hover:border-border-hover hover:shadow-card-hover' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
