import React, { useEffect, useState } from 'react';
import { FormTemplate } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FormSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (templates: FormTemplate[]) => void;
    selectedTemplateIds: string[];
}

const FormSelectorModal: React.FC<FormSelectorModalProps> = ({ isOpen, onClose, onSelect, selectedTemplateIds }) => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedTemplateIds));

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
            setSelected(new Set(selectedTemplateIds));
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const userSpecialty = user?.specialty;

            // Fetch all templates and filter client-side for better UX or fetch filtered
            // For now, let's fetch all and highlight recommended ones based on specialty
            const data = await api.forms.listTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelected(newSelected);
    };

    const handleConfirm = () => {
        const selectedTemplates = templates.filter(t => selected.has(t.id));
        onSelect(selectedTemplates);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Selecione os Documentos</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Carregando modelos...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map(template => {
                                const isRecommended = user?.specialty && template.specialties.some(s =>
                                    user.specialty!.toLowerCase().includes(s)
                                );

                                return (
                                    <div
                                        key={template.id}
                                        onClick={() => toggleSelection(template.id)}
                                        className={`
                                            cursor-pointer p-4 rounded-xl border-2 transition-all relative
                                            ${selected.has(template.id)
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-700">{template.title}</h3>
                                            {selected.has(template.id) && (
                                                <span className="text-green-600 bg-green-100 p-1 rounded-full text-xs">✓</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                                            {template.description || "Sem descrição"}
                                        </p>
                                        <div className="flex gap-2">
                                            {template.type === 'dynamic' && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Dinâmico</span>
                                            )}
                                            {isRecommended && (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Recomendado</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200"
                    >
                        Confirmar Seleção ({selected.size})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormSelectorModal;
