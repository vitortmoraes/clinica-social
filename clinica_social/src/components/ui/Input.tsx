import React, { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`cuidar-input-wrapper ${className}`}>
      {label && <label htmlFor={inputId} className="cuidar-label">{label}</label>}
      <input 
        id={inputId}
        className={`cuidar-input ${error ? 'cuidar-input-error' : ''}`} 
        {...props} 
      />
      {error && <span className="cuidar-error-msg">{error}</span>}
    </div>
  );
};
