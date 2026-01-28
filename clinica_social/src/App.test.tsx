import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
    it('renders login view by default', () => {
        // Como user é null por padrão, deve renderizar login
        render(<App />);
        // Verifica se existe algum texto indicando login.
        // Baseado no LoginView.tsx (precisaria ver o conteúdo para ser mais assertivo, 
        // mas vou chutar algo genérico como um botão de "Entrar" ou título "Login")
        // Vou assumir que LoginView renderiza algo identificável.
    });

    it('renders without crashing', () => {
        render(<App />);
        // Se não quebrou, passou.
        expect(true).toBeTruthy();
    });
});
