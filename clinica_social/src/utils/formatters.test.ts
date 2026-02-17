import { expect, test } from 'vitest';
import { formatCurrency } from './formatters';

// TESTE 1: Valor Redondo
test('deve formatar 100 reais corretamente', () => {
    const resultado = formatCurrency(100);

    // O computador verifica: "Tem R$ dentro?"
    expect(resultado).toContain('R$');

    // "Tem 100,00?" (removemos espaços invisíveis pra garantir)
    expect(resultado.replace(/\s/g, '')).toContain('100,00');
});

// TESTE 2: Valor Quebrado (Centavos)
test('deve lidar com centavos', () => {
    const resultado = formatCurrency(50.5);
    // Esperamos 50,50
    expect(resultado.replace(/\s/g, '')).toContain('50,50');
});
