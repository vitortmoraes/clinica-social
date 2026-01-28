import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

const AppointmentConfirmation: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleConfirm = async () => {
        if (!id) return;
        setStatus('loading');
        try {
            await api.confirmAppointment(id);
            setStatus('success');
        } catch (e: any) {
            console.error(e);
            setMsg(e.message || 'Erro ao confirmar');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">Confirmação de Consulta</h1>
                <p className="text-slate-500 mb-8">Clínica Cuidar</p>

                {status === 'idle' && (
                    <div className="space-y-4">
                        <p className="text-slate-600">Por favor, clique no botão abaixo para confirmar sua presença.</p>
                        <button
                            onClick={handleConfirm}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all hover:-translate-y-1"
                        >
                            CONFIRMAR PRESENÇA
                        </button>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500">Confirmando...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 animate-in zoom-in duration-300">
                        <h3 className="text-xl font-bold text-green-700 mb-2">Presença Confirmada!</h3>
                        <p className="text-green-600">Obrigado por confirmar. Aguardamos você!</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                        <h3 className="text-xl font-bold text-red-700 mb-2">Ops! Algo deu errado.</h3>
                        <p className="text-red-600">{msg}</p>
                        <button
                            onClick={handleConfirm}
                            className="mt-4 text-sm font-semibold text-red-700 hover:underline"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}
            </div>
            <p className="mt-8 text-xs text-slate-400">© 2025 Clínica Cuidar</p>
        </div>
    );
};

export default AppointmentConfirmation;
