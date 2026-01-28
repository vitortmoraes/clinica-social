import React, { useState, useEffect } from 'react';
import { Patient, Transaction, TransactionType, PaymentMethod, AppointmentStatus } from '../../types';
import { api } from '../../services/api';
import { format } from 'date-fns';

interface PatientFinancialHistoryProps {
    patients: Patient[];
    onTransactionChange: () => void;
}

const PatientFinancialHistory: React.FC<PatientFinancialHistoryProps> = ({ patients, onTransactionChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editType, setEditType] = useState<TransactionType>(TransactionType.INCOME);

    // Manual Entry State
    const [entryAmount, setEntryAmount] = useState<string>('');
    const [entryType, setEntryType] = useState<TransactionType>(TransactionType.INCOME); // Income = Pagamento (Crédito), Expense = Débito? No.
    // Spec: "lançar débito ou crédito".
    // "Débito" (Dívida) -> Increases what they owe. Technically we don't track "Debt" as a transaction, we track "Appointments" (Price) vs "Payments" (Income).
    // But user wants to add "Debits" or "Credits".
    // If I add a "Debit", it's like a manual charge (e.g. extra fee).
    // If I add a "Credit", it's a payment.
    // Let's use TransactionType.INCOME for Payment (Credit to account) and TransactionType.EXPENSE for Debit (Charge)? No, Expense is clinic spending.
    // We might need a new concept or just map:
    // "Pagamento/Crédito" -> INCOME (Linked to patient).
    // "Cobrança/Débito" -> This usually requires an Appointment or a Manual Charge.
    // Let's assume "Débito" -> Create a dummy appointment or just a transaction with negative value?
    // Better: Allow creating a "Manual Charge" transaction?
    // Current Transaction model: amount, type (Income/Expense).
    // Income = Money IN (Payment).
    // Expense = Money OUT (Clinic spending).
    // If I want to charge the patient, I should probably create a "Manual Debt" which is like an appointment price.
    // But existing system calculates debt as "Sum(Price) - Sum(Amount_Paid)".
    // So to increase debt, I need to increase "Sum(Price)". This implies creating a dummy appointment or adding a "Manual Charge" entity.
    // For simplicity: "Lançar Débito" -> Create a 'Manual Charge' Appointment (special type) OR modify Transaction system?
    // Let's use a simplified approach:
    // "Crédito" -> Transaction Income (Payment).
    // "Débito" -> We need to record a "Service" or "Charge".
    // User asked "lançar débito ou crédito na conta dele".
    // I will implement "Crédito" as normal Payment (Income).
    // "Débito" (Charge) -> I'll create a Transaction with type 'EXPENSE' but strictly associated with patient? No, Expense is distinct.
    // Maybe I should add a "DEBT" type?
    // For now, I will treat "Crédito" as Register Payment (INCOME).
    // "Débito" -> This effectively increases their balance. I might need to create a "Manual Charge" Appointment.
    // Let's stick to "Financial" = Transactions.
    // If I register a payment (Credit), I create an INCOME transaction.
    // If I register a Debt, I might just create a generic Appointment with title "Lançamento Manual" and price X?
    // Or just store it as a Transaction log?
    // Let's ask or assume: User simply wants to track flow.
    // "Lançar Débito" -> Add record that they OWE money.
    // "Lançar Crédito" -> Add record that they PAID money.
    // I will implement "Payment (Crédito)" and "Manual Charge (Débito)".
    // Manual Charge -> Create an Appointment acting as a charge.

    const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [entryDescription, setEntryDescription] = useState('');
    const [selectedApptId, setSelectedApptId] = useState<string>('');

    useEffect(() => {
        if (searchTerm) {
            setFilteredPatients(patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())));
        } else {
            setFilteredPatients([]);
        }
    }, [searchTerm, patients]);

    const handleSelectPatient = async (patientId: string) => {
        setSelectedPatientId(patientId);
        setLoading(true);
        try {
            const [transData, apptData] = await Promise.all([
                api.getTransactions({ patient_id: patientId }),
                api.getAppointments({ patient_id: patientId })
            ]);
            setTransactions(transData);
            setPatientAppointments(apptData);

            // Universal Balance Logic: Total Prices - Total Payments
            const totalApptPrice = apptData
                .filter(a => a.status !== AppointmentStatus.CANCELLED)
                .reduce((acc, app) => acc + (app.price || 0), 0);

            const totalPaid = transData
                .filter(t => t.type === TransactionType.INCOME)
                .reduce((acc, t) => acc + t.amount, 0);

            const totalDebt = Math.max(0, totalApptPrice - totalPaid);

            setBalance(totalDebt);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = async () => {
        if (!selectedPatientId || !entryAmount) return;
        setLoading(true);
        try {
            const val = parseFloat(entryAmount);
            if (entryType === TransactionType.INCOME) {
                // Credit/Payment linked to appointment if selected
                await api.createTransaction({
                    amount: val,
                    type: TransactionType.INCOME,
                    date: entryDate,
                    description: entryDescription || 'Crédito Manual',
                    patient_id: selectedPatientId,
                    appointment_id: selectedApptId || undefined,
                    payment_method: PaymentMethod.CASH // Default
                });
            } else {
                // MANUAL DEBT ENTRY (Manual Charge)
                await api.createAppointment({
                    patient_id: selectedPatientId,
                    volunteer_id: undefined, // Manual Entry has no volunteer
                    date: entryDate,
                    time: '00:00',
                    price: val,
                    amount_paid: 0,
                    status: AppointmentStatus.SCHEDULED,
                    notes: entryDescription || 'Débito Manual'
                });
            }
            alert('Lançamento realizado com sucesso!');
            handleSelectPatient(selectedPatientId);
            onTransactionChange();
            setEntryAmount('');
            setEntryDescription('');
            setSelectedApptId('');
        } catch (e) {
            alert('Erro ao realizar lançamento');
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
            if (selectedPatientId) handleSelectPatient(selectedPatientId);
            onTransactionChange();
        } catch (e) {
            alert('Erro ao atualizar transação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 p-2 rounded-lg">💳</span>
                    <h3 className="font-bold text-slate-800">Contas de Pacientes</h3>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isExpanded && (
                <div className="p-6 animate-in slide-in-from-top-2">
                    {/* Search */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buscar Paciente</label>
                        <input
                            type="text"
                            placeholder="Digite o nome..."
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {/* Results list */}
                        {searchTerm && (
                            <div className="mt-2 border border-slate-100 rounded-xl max-h-40 overflow-y-auto shadow-sm">
                                {filteredPatients.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSearchTerm(''); handleSelectPatient(p.id); }}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-50 last:border-0"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedPatientId && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                <h3 className="font-bold text-lg text-slate-800">
                                    {patients.find(p => p.id === selectedPatientId)?.name}
                                </h3>
                                <button onClick={() => setSelectedPatientId(null)} className="text-xs text-red-500 hover:underline">Fechar</button>
                            </div>

                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-red-600 uppercase">Saldo Devedor (À Pagar)</p>
                                    <p className="text-2xl font-black text-red-700">R$ {balance.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-red-400">Baseado em consultas em aberto</p>
                                </div>
                            </div>

                            {/* Manual Entry Form */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                <div className="grid md:grid-cols-4 gap-4 items-end">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                            placeholder="Ex: Pagamento Extra, Adiantamento..."
                                            value={entryDescription}
                                            onChange={(e) => setEntryDescription(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                                            value={entryType}
                                            onChange={(e) => setEntryType(e.target.value as TransactionType)}
                                        >
                                            <option value={TransactionType.INCOME}>Crédito (Pagamento)</option>
                                            <option value={TransactionType.EXPENSE}>Débito (Cobrança)</option>
                                        </select>
                                    </div>

                                    {/* Appointment Link (Optional) */}
                                    {entryType === TransactionType.INCOME && (
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular a Consulta (Opcional)</label>
                                            <select
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                                                value={selectedApptId}
                                                onChange={(e) => setSelectedApptId(e.target.value)}
                                            >
                                                <option value="">-- Não Vincular --</option>
                                                {patientAppointments
                                                    .filter(a => a.status !== AppointmentStatus.CANCELLED && a.payment_status !== 'PAID')
                                                    .sort((a, b) => b.date.localeCompare(a.date)) // Newest first
                                                    .map(a => (
                                                        <option key={a.id} value={a.id}>
                                                            {a.date.split('-').reverse().join('/')} - R$ {a.price?.toFixed(2)} (Pago: {a.amount_paid?.toFixed(2) || '0.00'})
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                            value={entryAmount}
                                            onChange={(e) => setEntryAmount(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                            value={entryDate}
                                            onChange={(e) => setEntryDate(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddEntry}
                                        disabled={loading || !entryAmount}
                                        className="bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 h-[42px]"
                                    >
                                        Lançar
                                    </button>
                                </div>
                            </div>

                            {/* History */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-2">Histórico Financeiro</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {loading ? <p className="text-sm text-slate-400">Carregando...</p> : transactions.length === 0 ? (
                                        <p className="text-sm text-slate-400">Nenhum registro encontrado.</p>
                                    ) : (
                                        transactions.map(t => (
                                            <div key={t.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm group">
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800 flex items-center gap-2">
                                                        {t.description}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                                        {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                                    </span>
                                                    <button
                                                        onClick={() => startEdit(t)}
                                                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 mr-1"
                                                        title="Editar Transação"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Excluir esta transação?')) {
                                                                try {
                                                                    setLoading(true);
                                                                    await api.deleteTransaction(t.id);
                                                                    // Refresh
                                                                    handleSelectPatient(selectedPatientId!);
                                                                    onTransactionChange();
                                                                } catch (e) {
                                                                    alert('Erro ao excluir');
                                                                    setLoading(false);
                                                                }
                                                            }
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Excluir Transação"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

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

export default PatientFinancialHistory;
