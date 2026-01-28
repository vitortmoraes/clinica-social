
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface MealItem {
    id: string;
    name: string;
    quantity?: string;
    substitution?: string;
}

interface Meal {
    id: string;
    name: string;
    time?: string;
    items: MealItem[];
}

const DEFAULT_MEALS: Meal[] = [
    { id: '1', name: 'Café da Manhã', time: '07:30', items: [] },
    { id: '2', name: 'Lanche da Manhã', time: '10:00', items: [] },
    { id: '3', name: 'Almoço', time: '12:30', items: [] },
    { id: '4', name: 'Lanche da Tarde', time: '16:00', items: [] },
    { id: '5', name: 'Jantar', time: '19:30', items: [] },
    { id: '6', name: 'Ceia', time: '22:00', items: [] },
];

const MealPlanEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Appointment ID or Record ID? Let's assume Appointment ID to fetch record.
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);
    const [patientName, setPatientName] = useState('');
    const [recordId, setRecordId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            const data = await api.attendance.getRecord(id);
            if (data) {
                setPatientName(data.patient?.name || 'Paciente');
                if (data.record) {
                    setRecordId(data.record.id);
                    // Load existing meal plan if any
                    if (data.record.content && data.record.content.mealPlan) {
                        setMeals(data.record.content.mealPlan);
                    }
                } else {
                    alert('Prontuário não encontrado. Finalize o atendimento primeiro.');
                    navigate(`/attendance/${id}`);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = (mealIndex: number) => {
        const newMeals = [...meals];
        newMeals[mealIndex].items.push({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            quantity: '',
        });
        setMeals(newMeals);
    };

    const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
        const newMeals = [...meals];
        newMeals[mealIndex].items.splice(itemIndex, 1);
        setMeals(newMeals);
    };

    const handleItemChange = (mealIndex: number, itemIndex: number, field: keyof MealItem, value: string) => {
        const newMeals = [...meals];
        newMeals[mealIndex].items[itemIndex][field as any] = value;
        setMeals(newMeals);
    };

    const handleSave = async () => {
        if (!id || !recordId) return;
        setSaving(true);
        try {
            // We need to fetch current record content first to not overwrite other data (like anamnesis)
            const data = await api.attendance.getRecord(id);
            const currentContent = data.record?.content || {};

            const updatedContent = {
                ...currentContent,
                mealPlan: meals
            };

            // Use the finish endpoint or a new update endpoint? 
            // The 'finish' endpoint updates the record. Ideally we should have a specific updateRecord endpoint.
            // Based on implementation, 'finish' does an upsert/update on the record.
            await api.attendance.finish(id, {
                ...data.record, // Keep other fields
                content: updatedContent
            });

            alert('Plano Alimentar salvo com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar plano alimentar.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-3xl">🥦</span> Plano Alimentar
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Paciente: <span className="text-slate-900 font-bold">{patientName}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/volunteer-dashboard')}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-semibold transition-colors"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={() => window.open(`/print/meal-plan/${id}`, '_blank')}
                            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimir
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold shadow-lg shadow-green-100 transition-all flex items-center gap-2"
                        >
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>

                {/* Meal Editor */}
                <div className="space-y-6">
                    {meals.map((meal, mIndex) => (
                        <div key={meal.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-orange-50/50 p-4 border-b border-orange-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                        {mIndex + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{meal.name}</h3>
                                        <input
                                            type="time"
                                            value={meal.time}
                                            onChange={(e) => {
                                                const newMeals = [...meals];
                                                newMeals[mIndex].time = e.target.value;
                                                setMeals(newMeals);
                                            }}
                                            className="text-xs bg-transparent text-slate-500 font-medium focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddItem(mIndex)}
                                    className="text-xs font-bold text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    + Adicionar Item
                                </button>
                            </div>

                            <div className="p-4 space-y-2">
                                {meal.items.length === 0 ? (
                                    <p className="text-center text-slate-300 text-sm py-2 italic">Nenhum alimento adicionado nesta refeição.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {meal.items.map((item, iIndex) => (
                                            <div key={item.id} className="flex gap-2 items-start group">
                                                <input
                                                    type="text"
                                                    placeholder="Alimento (ex: Pão Integral)"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(mIndex, iIndex, 'name', e.target.value)}
                                                    className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Qtd (ex: 2 fatias)"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(mIndex, iIndex, 'quantity', e.target.value)}
                                                    className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
                                                />
                                                <button
                                                    onClick={() => handleRemoveItem(mIndex, iIndex)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    title="Remover item"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default MealPlanEditor;
