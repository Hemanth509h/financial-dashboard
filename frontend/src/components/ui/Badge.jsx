import React from 'react';
import './Badge.css';

export const Badge = ({ status, className = '' }) => {
  const normalizedStatus = status ? status.toLowerCase().replace(' ', '-') : 'default';
  
  return (
    <span className={`badge badge-${normalizedStatus} ${className}`}>
      {status ? status.toUpperCase() : ''}
    </span>
  );
};
