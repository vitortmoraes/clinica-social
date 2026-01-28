
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const VolunteerDashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await api.attendance.getMyAppointments();
            setAppointments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        signOut();
        navigate('/acesso-voluntarios');
    };

    const handleStart = async (id: string) => {
        try {
            await api.attendance.start(id);
            loadAppointments(); // Refresh
        } catch (er) {
            alert('Erro ao iniciar');
        }
    };

    // Determine status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700';
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'not_started': return 'bg-slate-100 text-slate-700';
            case 'in_progress': return 'bg-yellow-100 text-yellow-700';
            case 'finished': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Agendado';
            case 'confirmed': return 'Paciente Confirmado';
            case 'not_started': return 'Aguardando';
            case 'in_progress': return 'Em Andamento';
            case 'finished': return 'Finalizado';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-green-900">Minha Agenda</h1>
                        <p className="text-sm text-slate-500">Olá, Dr(a). {user?.name}</p>
                    </div>
                    <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        Sair
                    </button>
                </div>
            </header>

            {/* List */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Carregando agenda...</div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white rounded-2xl shadow-sm p-8 inline-block">
                            <span className="text-4xl">📅</span>
                            <h3 className="mt-4 font-bold text-slate-700">Agenda Vazia</h3>
                            <p className="text-slate-500">Você não tem atendimentos agendados para hoje.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map(appt => (
                            <div key={appt.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${getStatusColor(appt.status || 'scheduled')}`}>
                                            {getStatusLabel(appt.status || 'scheduled')}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400">
                                            {format(parseISO(appt.date), 'dd/MM/yyyy')} • {format(parseISO(`${appt.date}T${appt.time}`), 'HH:mm')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {appt.patient_name || `Paciente ID: ${appt.patientId}`}
                                    </h3>
                                    <p className="text-sm text-slate-500 capitalize">
                                        {appt.notes || "Consulta de Rotina"}
                                    </p>
                                </div>

                                <div>
                                    {(appt.status === 'scheduled' || appt.status === 'not_started' || appt.status === 'confirmed') && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await api.attendance.start(appt.id);
                                                    navigate(`/attendance/${appt.id}`);
                                                } catch (e) { alert('Erro ao iniciar'); }
                                            }}
                                            className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                                        >
                                            Iniciar
                                        </button>
                                    )}
                                    {appt.status === 'in_progress' && (
                                        <button
                                            onClick={() => navigate(`/attendance/${appt.id}`)}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                        >
                                            Retomar
                                        </button>
                                    )}
                                    {appt.status === 'finished' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => window.open(`/print/record/${appt.id}`, '_blank')}
                                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors"
                                                title="Imprimir Prontuário"
                                            >
                                                📄
                                            </button>
                                            <button
                                                onClick={() => window.open(`/print/prescription/${appt.id}`, '_blank')}
                                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors"
                                                title="Imprimir Receita"
                                            >
                                                💊
                                            </button>
                                            {user?.specialty?.toLowerCase().includes('nutri') && (
                                                <button
                                                    onClick={() => window.open(`/print/meal-plan/${appt.id}`, '_blank')}
                                                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors"
                                                    title="Imprimir Plano Alimentar"
                                                >
                                                    🥦
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/attendance/${appt.id}`)}
                                                className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-medium ml-2"
                                            >
                                                Alterar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default VolunteerDashboard;
