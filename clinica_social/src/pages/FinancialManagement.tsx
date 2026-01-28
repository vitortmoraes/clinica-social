import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DailyStats, Transaction, PaymentMethod, TransactionType, Patient } from '../types';
import { format } from 'date-fns';
import PatientFinancialHistory from '../components/organisms/PatientFinancialHistory';

const FinancialManagement: React.FC = () => {
    const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);

    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editType, setEditType] = useState<TransactionType>(TransactionType.INCOME);

    useEffect(() => {
        loadData();
    }, [viewDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, transData, patientsData] = await Promise.all([
                api.getDailyStats(viewDate),
                api.getTransactions({ date: viewDate }),
                api.getPatients()
            ]);
            setStats(statsData);
            setTransactions(transData);
            setPatients(patientsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (t: Transaction) => {
        setEditingTransaction(t);
        setEditAmount(t.amount.toString());
        setEditDate(t.date.split('T')[0]);
        setEditDesc(t.description);
        setEditType(t.type);
    };

    const handleUpdateTransaction = async () => {
        if (!editingTransaction || !editAmount) return;
        setLoading(true);
        try {
            await api.updateTransaction(editingTransaction.id, {
                amount: parseFloat(editAmount),
                date: editDate,
                description: editDesc,
                type: editType
            });
            alert('Transação atualizada com sucesso!');
            setEditingTransaction(null);
            loadData();
        } catch (e) {
            alert('Erro ao atualizar transação');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (window.confirm('Excluir esta transação?')) {
            try {
                setLoading(true);
                await api.deleteTransaction(id);
                loadData();
            } catch (e) {
                alert('Erro ao excluir');
                setLoading(false);
            }
        }
    };

    // Expense Entry State
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const handleCreateExpense = async () => {
        if (!expenseDesc || !expenseAmount) return;

        setLoading(true);
        try {
            await api.createTransaction({
                amount: parseFloat(expenseAmount),
                type: TransactionType.EXPENSE,
                date: `${expenseDate}T${format(new Date(), 'HH:mm:ss')}`,
                description: expenseDesc,
                payment_method: expenseMethod,
                patient_id: null // Explicitly null for general expenses
            });

            alert('Despesa registrada com sucesso!');

            // Reset Form
            setExpenseDesc('');
            setExpenseAmount('');
            setExpenseMethod(PaymentMethod.CASH);
            setExpenseDate(format(new Date(), 'yyyy-MM-dd'));

            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao registrar despesa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>

            {/* Date Filter */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <label className="font-semibold text-slate-700">Data de Visualização:</label>
                <input
                    type="date"
                    className="border border-slate-200 rounded-xl px-4 py-2"
                    value={viewDate}
                    onChange={(e) => setViewDate(e.target.value)}
                />
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Income */}
                        <div className="bg-green-600 text-white p-6 rounded-3xl shadow-lg shadow-green-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="opacity-80 font-medium mb-1">Total Entradas</p>
                                    <h2 className="text-3xl font-black">R$ {stats.total_income.toFixed(2)}</h2>
                                </div>
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="bg-red-500 text-white p-6 rounded-3xl shadow-lg shadow-red-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="opacity-80 font-medium mb-1">Total Saídas</p>
                                    <h2 className="text-3xl font-black">R$ {stats.total_expense.toFixed(2)}</h2>
                                </div>
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className={`p-6 rounded-3xl shadow-lg border-2 ${stats.balance >= 0 ? 'bg-white border-blue-100 shadow-blue-50' : 'bg-red-50 border-red-100 shadow-red-50'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 font-medium mb-1">Saldo Líquido</p>
                                    <h2 className={`text-3xl font-black ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        R$ {stats.balance.toFixed(2)}
                                    </h2>
                                </div>
                                <div className={`p-2 rounded-lg ${stats.balance >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
                                    <svg className={`w-6 h-6 ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Method Breakdown */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-wrap gap-8 items-center justify-between">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Dinheiro (Entradas)</p>
                                <p className="text-xl font-bold text-slate-800">R$ {stats.by_method['DINHEIRO']?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Pix (Entradas)</p>
                                <p className="text-xl font-bold text-slate-800">R$ {stats.by_method['PIX']?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cartão (Entradas)</p>
                                <p className="text-xl font-bold text-slate-800">R$ {stats.by_method['CARTAO']?.toFixed(2) || '0.00'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400">Total de Transações: <b>{stats.transaction_count}</b></p>
                        </div>
                    </div>
                </div>
            )}



            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Movimentações do Dia</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold text-left">
                        <tr>
                            <th className="px-8 py-4">Horário</th>
                            <th className="px-8 py-4">Paciente</th>
                            <th className="px-8 py-4">Descrição</th>
                            <th className="px-4 py-4">Método</th>
                            <th className="px-8 py-4 text-right">Valor</th>
                            <th className="px-8 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transactions.map(t => {
                            const patient = patients.find(p => p.id === t.patient_id);
                            return (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4 text-slate-600">
                                        {format(new Date(t.date), 'HH:mm')}
                                    </td>
                                    <td className="px-8 py-4 font-bold text-slate-700">
                                        {patient?.name || (t.type === TransactionType.EXPENSE ? 'Despesa' : '-')}
                                    </td>
                                    <td className="px-8 py-4 font-medium text-slate-800">{t.description}</td>
                                    <td className="px-4 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                            {t.payment_method}
                                        </span>
                                    </td>
                                    <td className={`px-8 py-4 text-right font-bold whitespace-nowrap ${t.type === TransactionType.EXPENSE ? 'text-red-600' : 'text-green-600'}`}>
                                        {t.type === TransactionType.EXPENSE ? '- ' : '+ '}
                                        R$ {t.amount.toFixed(2)}
                                    </td>
                                    <td className="px-8 py-4 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => startEdit(t)}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => window.open(`/print/receipt/${t.id}`, '_blank')}
                                                className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                                                title="Imprimir Recibo"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTransaction(t.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Excluir"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                                    Nenhuma movimentação neste dia.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Patient Financial Manager */}
            <PatientFinancialHistory
                patients={patients}
                onTransactionChange={loadData}
            />

            {/* Expense Entry Section */}
            <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-red-50 bg-red-50/30">
                    <h3 className="font-bold text-red-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Registrar Despesa (Saída de Caixa)
                    </h3>
                    <p className="text-red-600 text-sm mt-1">Lance aqui pagamentos diversos feitos pelo caixa (café, material, etc).</p>
                </div>
                <div className="p-8">
                    <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                        <div className="flex-grow">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                            <input
                                type="text"
                                placeholder="Ex: Compra de Material de Escritório"
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                value={expenseDesc}
                                onChange={e => setExpenseDesc(e.target.value)}
                            />
                        </div>
                        <div className="w-40">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                placeholder="0,00"
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                value={expenseAmount}
                                onChange={e => setExpenseAmount(e.target.value)}
                            />
                        </div>
                        <div className="w-40">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Método</label>
                            <select
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                value={expenseMethod}
                                onChange={e => setExpenseMethod(e.target.value as PaymentMethod)}
                            >
                                <option value={PaymentMethod.CASH}>Dinheiro</option>
                                <option value={PaymentMethod.PIX}>PIX</option>
                                <option value={PaymentMethod.CARD}>Cartão</option>
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                value={expenseDate}
                                onChange={e => setExpenseDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleCreateExpense}
                            disabled={loading || !expenseDesc || !expenseAmount}
                            className="bg-red-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100 disabled:opacity-50 h-[42px]"
                        >
                            Registrar
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-800 text-sm">
                💡 Para lançar novos recebimentos, vá até a tela de <b>Agendamentos</b> e clique no ícone de pagamento ($) na consulta desejada.
            </div>

            {/* Edit Modal */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Editar Transação</h3>
                            <button onClick={() => setEditingTransaction(null)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editAmount}
                                        onChange={e => setEditAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editDate}
                                        onChange={e => setEditDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={editType}
                                    onChange={e => setEditType(e.target.value as TransactionType)}
                                >
                                    <option value={TransactionType.INCOME}>Crédito (Pagamento)</option>
                                    <option value={TransactionType.EXPENSE}>Débito (Cobrança)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setEditingTransaction(null)}
                                    className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateTransaction}
                                    disabled={loading}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialManagement;
