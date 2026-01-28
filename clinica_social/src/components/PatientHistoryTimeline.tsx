import React from 'react';
import { format, parseISO } from 'date-fns';

interface HistoryRecord {
    id: string;
    created_at: string;
    chief_complaint: string;
    volunteer_id?: string;
    content?: any;
}

interface PatientHistoryTimelineProps {
    history: HistoryRecord[];
    patientName?: string;
    patientStatus?: string;
    onRecordClick?: (record: HistoryRecord) => void;
}

const PatientHistoryTimeline: React.FC<PatientHistoryTimelineProps> = ({
    history,
    patientName,
    patientStatus,
    onRecordClick
}) => {
    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Histórico do Paciente</h2>
                <p className="text-sm text-slate-500">{patientName || 'Carregando...'}</p>
                <span className="text-xs uppercase font-bold text-slate-400 mt-1 block tracking-wider">
                    {patientStatus || 'Atendimento'}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                    <p className="text-center text-slate-400 mt-10">Nenhum histórico anterior.</p>
                ) : (
                    history.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => onRecordClick && onRecordClick(record)}
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded group-hover:bg-green-200 transition-colors">
                                    {format(parseISO(record.created_at), 'dd/MM/yyyy')}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                                <p className="line-clamp-2"><strong>Queixa:</strong> {record.chief_complaint}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PatientHistoryTimeline;
