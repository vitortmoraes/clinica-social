import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { FormTemplate } from '../types';
import PatientHistoryTimeline from '../components/PatientHistoryTimeline';
import FormSelectorModal from '../components/FormSelectorModal';
import DynamicFormRenderer from '../components/DynamicFormRenderer';

const AttendanceScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    // State for Dynamic Forms
    const [selectedTemplates, setSelectedTemplates] = useState<FormTemplate[]>([]);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [showSelector, setShowSelector] = useState(false);

    // Legacy/Base Fields (Always present for now to ensure compatibility)
    const [baseForm, setBaseForm] = useState({
        chief_complaint: '',
        history: '',
        procedures: '',
        prescription: ''
    });

    const [finishedId, setFinishedId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await api.attendance.getRecord(id);
                console.log("Loaded Record Data:", data);

                if (data) {
                    setAppointment({
                        ...data.appointment,
                        patient_name: data.patient?.name
                    });

                    // Load History
                    if (data.appointment.patient_id) {
                        try {
                            const hist = await api.attendance.getHistory(data.appointment.patient_id);
                            setHistory(hist);
                        } catch (e) {
                            console.error("Error loading history", e);
                        }
                    }

                    // Existing Record Logic
                    if (data.record) {
                        setBaseForm({
                            chief_complaint: data.record.chief_complaint || '',
                            history: data.record.history || '',
                            procedures: data.record.procedures || '',
                            prescription: data.record.prescription || ''
                        });

                        // 1. Check if we have new dynamic content structure
                        if (data.record.content?.filled_forms) {
                            const filled = data.record.content.filled_forms;
                            // We need to fetch templates for these IDs to render them
                            // Optimization: Fetch all templates or specific ones. 
                            // For simplistic approach: Fetch all templates and filter.
                            const allTemplates = await api.forms.listTemplates();
                            const matchedTemplates: FormTemplate[] = [];
                            const initialValues: Record<string, any> = {};

                            filled.forEach((item: any) => {
                                const t = allTemplates.find((at: any) => at.id === item.template_id);
                                if (t) {
                                    matchedTemplates.push(t);
                                    initialValues[t.id] = item.data;
                                }
                            });
                            setSelectedTemplates(matchedTemplates);
                            setFormValues(initialValues);
                        }
                        // 2. Backward Compatibility for hardcoded types (Nutrition/Dental)
                        else if (data.record.content) {
                            // If we had a migration, we would map this. 
                            // For now, if no dynamic forms, maybe prompt user to add?
                            // Or optionally loading the editor. 
                        }
                    } else {
                        // New Attendance: Open Selector
                        setShowSelector(true);
                    }
                }
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!id) return;

        // Prepare Content Payload
        const filledForms = selectedTemplates.map(t => ({
            template_id: t.id,
            title: t.title,
            data: formValues[t.id] || {},
            filled_at: new Date().toISOString()
        }));

        try {
            await api.attendance.finish(id, {
                ...baseForm,
                content: {
                    filled_forms: filledForms,
                    // Keep mealPlan if it exists? 
                    // Verify if previous content had mealPlan and preserve it if not edited here.
                    // For now, we are overwriting `content`. 
                    // Ideally we should merge with existing content if we want to support the separate MealPlanEditor.
                }
            });
            setFinishedId(id);
        } catch (error) {
            alert('Erro ao finalizar atendimento.');
            console.error(error);
        }
    };

    if (finishedId) {
        return (
            <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Atendimento Finalizado!</h1>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => window.open(`/print/record/${finishedId}`, '_blank')}
                            className="p-4 rounded-xl border-2 border-slate-100 hover:border-green-500 hover:bg-green-50 transition-all group flex flex-col items-center gap-2"
                        >
                            <span className="text-2xl">📄</span>
                            <span className="font-bold text-slate-700">Imprimir Prontuário</span>
                        </button>
                        <button
                            onClick={() => window.open(`/print/prescription/${finishedId}`, '_blank')}
                            className="p-4 rounded-xl border-2 border-slate-100 hover:border-green-500 hover:bg-green-50 transition-all group flex flex-col items-center gap-2"
                        >
                            <span className="text-2xl">💊</span>
                            <span className="font-bold text-slate-700">Imprimir Receita</span>
                        </button>
                    </div>

                    {/* Nutrition Specific */}
                    {user?.specialty?.toLowerCase().includes('nutri') && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => navigate(`/meal-plan/${finishedId}`)}
                                className="w-full p-4 rounded-xl border-2 border-orange-100 bg-orange-50 hover:border-orange-500 hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-2xl">🥦</span>
                                <span className="font-bold text-orange-700">Gerar Plano Alimentar</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/volunteer-dashboard')}
                        className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors mt-6"
                    >
                        Voltar para Agenda
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="p-10 text-center">Carregando...</div>;

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Left: History Sidebar (30%) */}
            <div className="w-1/3 min-w-[320px] max-w-md hidden md:flex flex-col">
                <PatientHistoryTimeline
                    history={history}
                    patientName={appointment?.patient_name}
                    patientStatus={appointment?.status}
                />
            </div>

            {/* Right: Workspace (70%) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white shadow-xl">
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center z-10">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            Atendimento
                        </h1>
                        <p className="text-sm text-slate-500">
                            {format(new Date(), 'dd ')} de {format(new Date(), 'MMMM')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSelector(true)}
                            className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                            + Documentos
                        </button>
                        <button
                            onClick={() => navigate('/volunteer-dashboard')}
                            className="text-sm text-slate-500 hover:text-red-600 px-4 py-2"
                        >
                            Sair
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* Base Form - Always Visible */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="bg-slate-100 p-1 rounded text-lg">📝</span>
                                Prontuário Base
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Queixa Principal / Motivo</label>
                                    <textarea
                                        value={baseForm.chief_complaint}
                                        onChange={e => setBaseForm({ ...baseForm, chief_complaint: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none h-20 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Histórico / Evolução</label>
                                    <textarea
                                        value={baseForm.history}
                                        onChange={e => setBaseForm({ ...baseForm, history: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Forms */}
                        {selectedTemplates.map(template => (
                            <div key={template.id} className="relative group">
                                {template.type === 'dynamic' ? (
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
                                            {template.title}
                                        </div>
                                        <div className="pt-4">
                                            <DynamicFormRenderer
                                                schema={template.schema_config}
                                                value={formValues[template.id] || {}}
                                                onChange={(val) => setFormValues(prev => ({ ...prev, [template.id]: val }))}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // Fallback for static/unknown types
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                        <p className="text-slate-500">Formulário estático não suportado no renderizador dinâmico.</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        if (confirm('Remover este formulário?')) {
                                            setSelectedTemplates(prev => prev.filter(t => t.id !== template.id));
                                            const newValues = { ...formValues };
                                            delete newValues[template.id];
                                            setFormValues(newValues);
                                        }
                                    }}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                    title="Remover formulário"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* Prescription & Procedures (Part of Base but usually at end) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="bg-slate-100 p-1 rounded text-lg">🩺</span>
                                Conduta e Prescrição
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Procedimentos / Exames</label>
                                    <textarea
                                        value={baseForm.procedures}
                                        onChange={e => setBaseForm({ ...baseForm, procedures: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none h-20 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Receita / Orientações</label>
                                    <textarea
                                        value={baseForm.prescription}
                                        onChange={e => setBaseForm({ ...baseForm, prescription: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-20"></div> {/* Spacer */}
                    </div>
                </main>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 p-4 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <span className="text-sm text-slate-500 hidden md:block">
                        {selectedTemplates.length} documento(s) adicional(is)
                    </span>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={() => setShowSelector(true)}
                            className="flex-1 md:hidden bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold"
                        >
                            + Docs
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 md:flex-none bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex justify-center items-center gap-2"
                        >
                            <span>💾</span> Finalizar Atendimento
                        </button>
                    </div>
                </div>

                <FormSelectorModal
                    isOpen={showSelector}
                    onClose={() => setShowSelector(false)}
                    selectedTemplateIds={selectedTemplates.map(t => t.id)}
                    onSelect={(templates) => {
                        // Merge templates, keeping existing values
                        setSelectedTemplates(templates);
                        // We don't clear values of removed templates immediately to avoid accidental data loss? 
                        // Actually, let's keep it simple. The modal returns the full list of selected templates.
                    }}
                />
            </div>
        </div>
    );
};

export default AttendanceScreen;
