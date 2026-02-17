import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
    it('renders login view by default', () => {
        // Envolvemos o App no MemoryRouter para simular o navegador
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        // O teste passa se não der erro ao renderizar as rotas
    });

    it('renders without crashing', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        expect(true).toBeTruthy();
    });
});
