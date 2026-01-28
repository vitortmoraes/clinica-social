# Plano de Implementação: Módulo Financeiro

## Objetivo
Implementar um sistema de gestão financeira que permita:
1.  Controlar o fluxo de caixa diário (entradas de pagamentos).
2.  Manter um histórico financeiro por paciente (débitos vs pagamentos).
3.  Integrar pagamentos diretamente aos agendamentos.

## Arquitetura Proposta

### 1. Backend (Modelagem)
Para garantir que o relatório de "Caixa do Dia" seja preciso (ex: consulta foi ontem, mas pagou hoje), precisamos separar o **Agendamento** da **Transação Financeira**.

#### Novo Modelo: `Transaction`
Representa uma movimentação financeira.
- `id`: UUID
- `amount`: Valor (R$)
- `type`: 'INCOME' (Entrada) ou 'EXPENSE' (Saída - expansível futuro)
- `date`: Data/Hora do efetivo pagamento (Importante para o Caixa do Dia)
- `description`: Descrição (ex: "Consulta Dr. João")
- `patient_id`: Link com Paciente
- `appointment_id`: Link opcional com Agendamento
- `payment_method`: 'DINHEIRO', 'PIX', 'CARTAO' (Opcional, mas recomendado)

#### Alteração em: `Appointment`
- `payment_status`: 'PENDING' (Pendente) | 'PAID' (Pago)
- Isso facilita saber visualmente na agenda quem já pagou, sem ter que somar transações o tempo todo.

### 2. Frontend (Interface)

#### Nova Página: `FinancialManagement.tsx`
Dividida em duas grandes áreas:
1.  **Caixa do Dia (Visão Geral)**
    - Filtro de Data (Padrão: Hoje).
    - Cards de Resumo: Total Recebido.
    - Tabela de Movimentações: Hora | Paciente | Descrição | Valor.
2.  **Histórico do Paciente (Aba ou Seção Inferior)**
    - Busca de Paciente.
    - Exibição de "Extrato": Lista cronológica de Consultas (Débito) e Pagamentos (Crédito).
    - Saldo Devedor.

#### Integração na Agenda (`AppointmentManagement.tsx`)
- Adicionar botão/ícone de "$" nos agendamentos.
- Ao clicar: Abre modal "Registrar Pagamento".
    - Confirma valor (puxa da tabela de preços).
    - Confirma data (padrão: hoje).
    - Ao salvar: Cria `Transaction` no backend e atualiza `Appointment` para 'PAID'.

## Etapas de Desenvolvimento

### Backend
1.  [ ] Criar model `Transaction` e schemas Pydantic.
2.  [ ] Adicionar campo `payment_status` ao model `Appointment`.
3.  [ ] Criar endpoints `/financial/transactions` (CRUD e Filtros).
4.  [ ] Criar endpoint `/financial/ledger/{patient_id}` (Extrato consolidado).

### Frontend
1.  [ ] Atualizar `types.ts` com novas interfaces.
2.  [ ] Atualizar `api.ts` com novos endpoints.
3.  [ ] Criar página `FinancialManagement`.
4.  [ ] Adicionar "Financeiro" na `Sidebar`.
5.  [ ] Atualizar `AppointmentManagement` para permitir registrar pagamento.

## User Review Required
- Concorda com a criação de uma tabela separada de Transações para não confundir "Data da Consulta" com "Data do Pagamento"?
- Deseja que eu inclua "Método de Pagamento" (Pix, Dinheiro, etc.) agora ou deixa para depois?
