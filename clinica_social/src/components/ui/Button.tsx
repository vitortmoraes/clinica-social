import React, { ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) => {
  return (
    <button 
      className={`cuidar-btn cuidar-btn-${variant} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="cuidar-loader"></span> : children}
    </button>
  );
};
