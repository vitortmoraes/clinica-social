
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '../styles/print.css'; // Reuse existing print styles if possible

const MealPlanPrint: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const recordData = await api.attendance.getRecord(id!);
                setData(recordData);
                setTimeout(() => window.print(), 1000);
            } catch (e) {
                console.error(e);
                alert('Erro ao carregar dados para impressão.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="text-center p-10">Carregando...</div>;
    if (!data) return <div className="text-center p-10">Dados não encontrados.</div>;

    const { appointment, patient, volunteer, record } = data;
    const mealPlan = record?.content?.mealPlan || [];

    // Clinic Info (Mock or from Settings if available context)
    const clinicInfo = {
        name: "Clínica Cuidar",
        address: "Rua Exemplo, 123 - Centro",
        phone: "(11) 99999-9999",
        logo: "/logo_mix_small.png" // Ensure this path is correct or use logic
    };

    return (
        <div className="print-container bg-white min-h-screen">
            <div className="max-w-[210mm] mx-auto p-8" style={{ minHeight: '297mm' }}>

                {/* Header */}
                <header className="flex justify-between items-center border-b-2 border-green-600 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        {/* Logo Placeholder */}
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-2xl">
                            🥦
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-green-800">{clinicInfo.name}</h1>
                            <p className="text-sm text-slate-500">{clinicInfo.address}</p>
                            <p className="text-sm text-slate-500">{clinicInfo.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">Plano Alimentar</h2>
                        <p className="text-sm text-slate-500">
                            Data: {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                </header>

                {/* Patient Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8 flex justify-between">
                    <div>
                        <p className="text-xs uppercase text-slate-400 font-bold mb-1">Paciente</p>
                        <p className="font-bold text-xl text-slate-800">{patient?.name}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-slate-400 font-bold mb-1">Nutricionista</p>
                        <p className="font-bold text-lg text-slate-800">{volunteer?.name}</p>
                        <p className="text-xs text-slate-500">{volunteer?.specialty} - {volunteer?.license_number}</p>
                    </div>
                </div>

                {/* Meal Plan Grid */}
                <div className="space-y-6">
                    {mealPlan.length === 0 ? (
                        <p className="text-center text-slate-400 italic py-10">Nenhum plano alimentar registrado.</p>
                    ) : (
                        mealPlan.map((meal: any) => (
                            <div key={meal.id} className="break-inside-avoid">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm">
                                        {meal.time}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 border-b-2 border-orange-100 flex-grow pb-1">
                                        {meal.name}
                                    </h3>
                                </div>
                                <ul className="pl-14 space-y-1">
                                    {meal.items.map((item: any, idx: number) => (
                                        <li key={idx} className="flex justify-between text-sm text-slate-700 border-b border-slate-50 py-1">
                                            <span className="font-medium">• {item.name}</span>
                                            <span className="text-slate-500">{item.quantity}</span>
                                        </li>
                                    ))}
                                    {meal.items.length === 0 && <li className="text-xs text-slate-300 italic">Opção livre / Nenhuma recomendação</li>}
                                </ul>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-600 font-medium mb-8">
                        "Que seu remédio seja seu alimento, e que seu alimento seja seu remédio."
                    </p>
                    <div className="flex justify-center gap-12 mt-12">
                        <div className="text-center">
                            <div className="w-64 border-t border-slate-400 mb-2"></div>
                            <p className="font-bold text-slate-800">{volunteer?.name}</p>
                            <p className="text-xs text-slate-500">{volunteer?.license_number}</p>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default MealPlanPrint;
