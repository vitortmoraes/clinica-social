import React, { HTMLAttributes } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div className={`cuidar-card ${noPadding ? 'no-padding' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};
