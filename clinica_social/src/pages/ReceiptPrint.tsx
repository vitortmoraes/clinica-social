import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ClinicSettings, Transaction, Patient, Appointment } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FullReceiptData {
    transaction: Transaction;
    patient: Patient | null;
    appointment: Appointment | null;
}

const ReceiptPrint: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<FullReceiptData | null>(null);
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            // Fetch transaction details
            // We might need a specific endpoint to get a single transaction by ID, 
            // but for now we can filter from the list or assume we have an endpoint.
            // Since we don't have getTransactionById in the frontend API client yet,
            // we will fetch all transactions for the day of the receipt or modify the backend.
            // However, looking at the backend, we don't have a direct 'get transaction by id'.
            // A cleaner way for now (without touching backend yet if possible) is knowing the date from a query param 
            // or just implementing getTransaction in api.ts if backend supports it.
            // Checking backend: `clinica_api/app/api/endpoints/financial.py` usually has CRUD.
            // Let's assume for this step we need to fetch the specific transaction.
            // Re-reading task: "Rota /print/receipt/:id". 
            // If the backend doesn't support GET /transactions/{id}, I might need to add it.
            // Let's first try to find the transaction via the existing list endpoint if we can't get it directly.
            // Wait, standard CRUD usually has GET /{id}. Let's check api.ts again.
            // api.ts has `getTransactions` with filters, updating, deleting. It does NOT have getOne.
            // I will implement a quick fetch logic here.

            // Actually, for a receipt, we need robust data. I'll add `getTransaction` to api.ts first.
            // For now, in this file, I'll mock the call assuming I'll update api.ts next.

            const settingsData = await api.settings.get();
            setSettings(settingsData);

            // Temporary: Fetching all for today or similar won't work if we don't know the date.
            // I will assume I will add `api.getTransaction(id)` to the API client.
            const transactionData = await api.getTransaction(id!);

            // Fetch patient details if available
            let patientData = null;
            if (transactionData.patient_id) {
                // We need getPatient. api.ts has getPatients checking...
                // It seems api.ts only has getPatients() list. 
                // We'll need `api.getPatient(id)`.
                const patients = await api.getPatients();
                patientData = patients.find(p => p.id === transactionData.patient_id) || null;
            }

            setData({
                transaction: transactionData,
                patient: patientData,
                appointment: null // We could fetch this if needed, but the receipt is mainly about money.
            });

        } catch (error) {
            console.error(error);
            alert('Erro ao carregar dados do recibo.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando recibo...</div>;
    if (!data || !settings) return <div className="p-8 text-center text-red-500">Recibo não encontrado.</div>;

    const { transaction, patient } = data;

    return (
        <div className="bg-white min-h-screen text-slate-800 p-8 print:p-0 font-serif">
            {/* Print Button */}
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-end print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Imprimir Recibo
                </button>
            </div>

            {/* A4 Container (Half page usually for receipts, but we'll use full width and let user cut or full page) */}
            <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl relative flex flex-col print:shadow-none print:w-full print:max-w-none">

                {/* Border Container */}
                <div className="border-2 border-slate-800 p-8 h-full flex flex-col justify-between min-h-[140mm]">

                    {/* Header */}
                    <header className="flex items-center justify-between border-b border-slate-300 pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
                            ) : (
                                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-bold text-xl">
                                    {settings.clinic_name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 font-sans">{settings.clinic_name}</h1>
                                <p className="text-xs text-slate-500 font-sans mt-1 max-w-xs leading-tight">
                                    {settings.address} • {settings.phone}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-slate-400 tracking-widest font-sans uppercase">Recibo</h2>
                            <p className="text-xs font-bold text-slate-800 mt-1 font-mono">#{transaction.id.substring(0, 8)}</p>
                        </div>
                    </header>

                    {/* Content */}
                    {/* Content */}
                    <div className="flex-1 font-sans mt-8 px-4">
                        <div className="text-lg leading-relaxed text-justify text-slate-800">
                            {transaction.type === 'EXPENSE' ? (
                                <p>
                                    Recebi da <span className="font-bold border-b border-slate-400 px-2">{settings.clinic_name}</span> a quantia de <span className="font-bold border-b border-slate-400 px-2">R$ {transaction.amount.toFixed(2)}</span> por pagamento de <span className="font-bold border-b border-slate-400 px-2">{transaction.description}</span>.
                                </p>
                            ) : (
                                <p>
                                    Recebi de <span className="font-bold border-b border-slate-400 px-2">{patient?.name || 'Cliente Balcão'}</span>,
                                    o valor de <span className="font-bold border-b border-slate-400 px-2">R$ {transaction.amount.toFixed(2)}</span>,
                                    referente a <span className="font-bold border-b border-slate-400 px-2">{transaction.description}</span>.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-12 pt-12">
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Forma de Pagamento</p>
                                <p className="font-bold text-slate-700">{transaction.payment_method}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Data do Pagamento</p>
                                <p className="font-bold text-slate-700">
                                    {format(new Date(transaction.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signature */}
                    <footer className="mt-12 pt-8 flex flex-col items-center justify-center text-center font-sans">
                        <p className="mb-8 text-sm text-slate-500">
                            {settings.city || 'Cidade'}, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <div className="w-80 border-b border-slate-800 mb-2"></div>
                        {transaction.type !== 'EXPENSE' && (
                            <p className="font-bold text-sm text-slate-800 uppercase">{settings.clinic_name}</p>
                        )}
                        <p className="text-xs text-slate-400">Assinatura do Responsável</p>
                    </footer>

                </div>

                {/* Cut Line */}
                <div className="mt-8 border-t border-dashed border-slate-300 relative print:hidden">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-slate-400">Via do Cliente</span>
                </div>

            </div>
        </div>
    );
};

export default ReceiptPrint;
