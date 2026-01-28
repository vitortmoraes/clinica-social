
import React, { useState } from 'react';
import { Appointment, PaymentMethod, TransactionType } from '../types';
import { api } from '../services/api';
import { format } from 'date-fns';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    patientName: string;
    onSuccess: (updatedAppointment: Appointment) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, appointment, patientName, onSuccess }) => {
    // Calculate initial remaining amount
    const total = appointment.price || 0;
    const paidSoFar = parseFloat(String(appointment.amount_paid || 0));
    const remaining = Math.max(0, total - paidSoFar);

    const [amount, setAmount] = useState<number>(remaining);
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);

    // Initial check when opening. If already paid, should be handled by parent, but safe check here.
    if (!isOpen) return null;

    const [successTransactionId, setSuccessTransactionId] = useState<string | null>(null);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // ... (previous logic) ...
            const [y, m, d] = appointment.date.split('-').map(Number);
            const dateParts = appointment.date.split('-');
            const dateFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            const currentTime = format(new Date(), 'HH:mm:ss');
            const dateTimePayload = `${date}T${currentTime}`;

            const newTransaction = await api.createTransaction({
                amount: parseFloat(String(amount)),
                type: TransactionType.INCOME,
                date: dateTimePayload,
                description: `Pagamento Consulta: ${dateFormatted}`,
                patient_id: appointment.patient_id,
                appointment_id: appointment.id,
                payment_method: method
            });

            const updatedList = await api.getAppointments({
                patient_id: appointment.patient_id,
                date: appointment.date
            });
            const updatedApp = updatedList.find(a => a.id === appointment.id);

            if (updatedApp) {
                onSuccess(updatedApp);
            } else {
                onSuccess(appointment);
            }

            setSuccessTransactionId(newTransaction.id);
            // alert('Pagamento registrado com sucesso!'); // Removed alert to show UI
        } catch (error) {
            console.error(error);
            alert('Erro ao registrar pagamento.');
            onClose(); // Close on error to avoid stale state? Or keep open? keeping open is better but for now simpler
        } finally {
            setLoading(false);
        }
    };

    if (successTransactionId) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm scale-100 animate-in zoom-in-95 duration-200 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Pagamento Confirmado!</h2>
                    <p className="text-slate-500 mb-6">O lançamento foi registrado com sucesso.</p>

                    <div className="space-y-3">
                        <button
                            onClick={() => window.open(`/print/receipt/${successTransactionId}`, '_blank')}
                            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimir Recibo
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-colors"
                        >
                            Concluir e Fechar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md scale-100 animate-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold text-slate-800 mb-1">Registrar Pagamento</h2>
                {/* ... existing form ... */}
                <p className="text-sm text-slate-500 mb-6">Confirme os dados do recebimento.</p>

                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Valor Total</span>
                            <span className="font-semibold text-slate-700">R$ {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Já Pago</span>
                            <span className="font-semibold text-green-600">R$ {paidSoFar.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700">Restante</span>
                            <span className="font-bold text-red-600">R$ {remaining.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500 h-[46px]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setMethod(PaymentMethod.CASH)}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${method === PaymentMethod.CASH ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Dinheiro
                            </button>
                            <button
                                onClick={() => setMethod(PaymentMethod.PIX)}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${method === PaymentMethod.PIX ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                PIX
                            </button>
                            <button
                                onClick={() => setMethod(PaymentMethod.CARD)}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${method === PaymentMethod.CARD ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Cartão
                            </button>
                            <button
                                onClick={() => setMethod(PaymentMethod.OTHER)}
                                className={`p-2 rounded-lg border text-sm font-medium transition-all ${method === PaymentMethod.OTHER ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Outro
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : 'Confirmar Pagamento'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
