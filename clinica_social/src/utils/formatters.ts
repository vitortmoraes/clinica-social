// Essa é a peça que queremos testar. 
// Ela só faz uma coisa: recebe número, devolve string formatada.
export const formatCurrency = (value: number) => {
    // Usa a ferramenta nativa do navegador para formatar em Reais
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
