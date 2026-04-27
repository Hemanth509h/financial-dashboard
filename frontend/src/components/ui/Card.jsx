import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div className={`card ${noPadding ? 'card-no-padding' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};
