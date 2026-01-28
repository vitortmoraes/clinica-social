import React from 'react';

interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'date';
    options?: string[]; // For select
    required?: boolean;
}

interface SectionConfig {
    title: string;
    fields: FieldConfig[];
}

interface SchemaConfig {
    sections: SectionConfig[];
}

interface DynamicFormRendererProps {
    schema: SchemaConfig;
    value: Record<string, any>;
    onChange: (newValue: Record<string, any>) => void;
    readOnly?: boolean;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ schema, value, onChange, readOnly = false }) => {

    const handleChange = (fieldName: string, fieldValue: any) => {
        onChange({
            ...value,
            [fieldName]: fieldValue
        });
    };

    return (
        <div className="space-y-8">
            {schema.sections?.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">
                        {section.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.fields?.map((field) => (
                            <div key={field.name} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'textarea' ? (
                                    <textarea
                                        disabled={readOnly}
                                        value={value[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="w-full p-2 border rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500 disabled:bg-slate-50 outline-none transition-all"
                                        rows={4}
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        disabled={readOnly}
                                        value={value[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="w-full p-2 border rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500 disabled:bg-slate-50 outline-none transition-all bg-white"
                                    >
                                        <option value="">Selecione...</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type}
                                        disabled={readOnly}
                                        value={value[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="w-full p-2 border rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500 disabled:bg-slate-50 outline-none transition-all"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DynamicFormRenderer;
