import React, { useState } from 'react';
import DynamicFormRenderer from './DynamicFormRenderer';

interface FormBuilderProps {
    initialData?: any;
    onSave: (templateData: any) => Promise<void>;
    onCancel: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ initialData, onSave, onCancel }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [specialties, setSpecialties] = useState<string[]>(initialData?.specialties || []);
    const [sections, setSections] = useState<any[]>(initialData?.schema_config?.sections || [
        { title: 'Seção Principal', fields: [] }
    ]);
    const [saving, setSaving] = useState(false);

    // Preview Mode toggle
    const [previewMode, setPreviewMode] = useState(false);

    // Field Types
    const fieldTypes = [
        { value: 'text', label: 'Texto Curto' },
        { value: 'textarea', label: 'Texto Longo (Área)' },
        { value: 'number', label: 'Número' },
        { value: 'select', label: 'Seleção (Lista)' },
        { value: 'date', label: 'Data' },
        { value: 'checkbox', label: 'Caixa de Seleção (Sim/Não)' } // Checkbox handling might need adjustment in renderer
    ];

    const addSection = () => {
        setSections([...sections, { title: 'Nova Seção', fields: [] }]);
    };

    const removeSection = (idx: number) => {
        const newSections = [...sections];
        newSections.splice(idx, 1);
        setSections(newSections);
    };

    const updateSectionTitle = (idx: number, val: string) => {
        const newSections = [...sections];
        newSections[idx].title = val;
        setSections(newSections);
    };

    const addField = (sectionIdx: number) => {
        const newSections = [...sections];
        newSections[sectionIdx].fields.push({
            name: `field_${Date.now()}`,
            label: 'Novo Campo',
            type: 'text',
            required: false,
            options: []
        });
        setSections(newSections);
    };

    const removeField = (sectionIdx: number, fieldIdx: number) => {
        const newSections = [...sections];
        newSections[sectionIdx].fields.splice(fieldIdx, 1);
        setSections(newSections);
    };

    const updateField = (sectionIdx: number, fieldIdx: number, key: string, val: any) => {
        const newSections = [...sections];
        newSections[sectionIdx].fields[fieldIdx][key] = val;
        setSections(newSections);
    };

    const handleSave = async () => {
        if (!title) return alert('O título é obrigatório');

        setSaving(true);
        try {
            const payload = {
                title,
                description,
                type: 'dynamic',
                specialties,
                schema_config: { sections },
                active: true
            };
            await onSave(payload);
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao salvar modelo: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const availableSpecialties = [
        { value: 'nutritionist', label: 'Nutricionista' },
        { value: 'medic', label: 'Médico' },
        { value: 'dentist', label: 'Dentista' },
        { value: 'psychologist', label: 'Psicólogo' }
    ];

    const toggleSpecialty = (val: string) => {
        if (specialties.includes(val)) {
            setSpecialties(specialties.filter(s => s !== val));
        } else {
            setSpecialties([...specialties, val]);
        }
    };

    if (previewMode) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg">
                    <h3 className="font-bold text-slate-700">Pré-visualização: {title}</h3>
                    <button onClick={() => setPreviewMode(false)} className="text-blue-600 underline">Voltar para Edição</button>
                </div>
                <div className="bg-white p-8 border rounded-xl shadow-sm">
                    <DynamicFormRenderer
                        schema={{ sections }}
                        value={{}}
                        onChange={() => { }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header / Meta Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-slate-800 border-b pb-2 mb-4">Informações do Modelo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Título do Documento</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg"
                            placeholder="Ex: Anamnese Psicológica"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg"
                            placeholder="Breve descrição para o voluntário"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Disponível para (Especialidades)</label>
                    <div className="flex gap-2 flex-wrap">
                        {availableSpecialties.map(spec => (
                            <button
                                key={spec.value}
                                onClick={() => toggleSpecialty(spec.value)}
                                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${specialties.includes(spec.value)
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {spec.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Se nenhuma for selecionada, aparecerá para todos.</p>
                </div>
            </div>

            {/* Form Editor */}
            <div className="space-y-6">
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group">
                        <div className="flex items-center gap-4 mb-6">
                            <input
                                type="text"
                                className="flex-1 text-lg font-bold text-slate-800 border-b border-transparent focus:border-slate-300 outline-none px-2 py-1 hover:bg-slate-50 rounded"
                                value={section.title}
                                onChange={e => updateSectionTitle(sIdx, e.target.value)}
                            />
                            <button onClick={() => removeSection(sIdx)} className="text-red-400 hover:text-red-600 text-sm">Remover Seção</button>
                        </div>

                        <div className="space-y-3">
                            {section.fields.map((field: any, fIdx: number) => (
                                <div key={fIdx} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                        <div className="md:col-span-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Rótulo / Pergunta</label>
                                            <input
                                                type="text"
                                                className="w-full p-1 bg-white border rounded text-sm"
                                                value={field.label}
                                                onChange={e => updateField(sIdx, fIdx, 'label', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
                                            <select
                                                className="w-full p-1 bg-white border rounded text-sm"
                                                value={field.type}
                                                onChange={e => updateField(sIdx, fIdx, 'type', e.target.value)}
                                            >
                                                {fieldTypes.map(ft => (
                                                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {field.type === 'select' && (
                                            <div className="md:col-span-3">
                                                <label className="text-xs font-bold text-slate-400 uppercase">Opções (Separadas por vírgula)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-1 bg-white border rounded text-sm"
                                                    placeholder="Opção 1, Opção 2"
                                                    value={field.options?.join(', ')}
                                                    onChange={e => updateField(sIdx, fIdx, 'options', e.target.value.split(',').map((s: string) => s.trim()))}
                                                />
                                            </div>
                                        )}
                                        <div className="md:col-span-2 flex items-end">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={e => updateField(sIdx, fIdx, 'required', e.target.checked)}
                                                />
                                                <span className="text-sm text-slate-600">Obrigatório</span>
                                            </label>
                                        </div>
                                    </div>
                                    <button onClick={() => removeField(sIdx, fIdx)} className="text-slate-400 hover:text-red-500 mt-5">✕</button>
                                </div>
                            ))}

                            <button
                                onClick={() => addField(sIdx)}
                                className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-slate-300 hover:bg-slate-50 text-sm font-medium transition-colors"
                            >
                                + Adicionar Campo
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addSection}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 font-bold transition-all"
                >
                    + Adicionar Nova Seção
                </button>
            </div>

            {/* Actions Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-3 shadow-lg z-20">
                <button
                    onClick={() => setPreviewMode(true)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-bold"
                >
                    👁️ Pré-visualizar
                </button>
                <div className="w-px bg-slate-200 mx-2"></div>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50"
                >
                    {saving ? 'Salvando...' : 'Salvar Modelo'}
                </button>
            </div>
            <div className="h-20"></div> {/* Spacer for fixed footer */}
        </div>
    );
};

export default FormBuilder;
