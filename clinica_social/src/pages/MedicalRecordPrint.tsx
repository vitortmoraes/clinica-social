import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ClinicSettings, Appointment, Patient, Volunteer } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FullRecord {
    appointment: Appointment;
    patient: Patient;
    volunteer: Volunteer;
    record: {
        id: string;
        chief_complaint: string;
        history: string;
        prescription: string;
        created_at: string;
    } | null;
}

const MedicalRecordPrint: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<FullRecord | null>(null);
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [recordData, settingsData] = await Promise.all([
                api.attendance.getRecord(id!),
                api.settings.get()
            ]);
            setData(recordData);
            setSettings(settingsData);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar dados do prontuário.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando documento...</div>;
    if (!data || !settings) return <div className="p-8 text-center text-red-500">Documento não encontrado.</div>;

    return (
        <div className="bg-white min-h-screen text-slate-800 p-8 print:p-0">
            {/* Print Button (Hidden on Print) */}
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-end print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Imprimir Prontuário
                </button>
            </div>

            {/* A4 Container */}
            <div className="max-w-[210mm] mx-auto bg-white p-[10mm] shadow-lg print:shadow-none print:w-full print:max-w-none">

                {/* Header */}
                <header className="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        {settings.logo_url && (
                            <img src={settings.logo_url} alt="Logo" className="h-20 w-auto object-contain" />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide">{settings.clinic_name}</h1>
                            {settings.company_name && <p className="text-sm font-medium text-slate-600">{settings.company_name}</p>}
                            <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                {settings.cnpj && <p>CNPJ: {settings.cnpj}</p>}
                                <p>{settings.address}</p>
                                <p>{settings.phone} • {settings.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-400">PRONTUÁRIO DE ATENDIMENTO</h2>
                        <p className="text-sm text-slate-500 font-mono mt-1">#{data.appointment.id.slice(0, 8)}</p>
                        <p className="text-sm font-medium mt-2">{format(new Date(data.appointment.date + 'T' + data.appointment.time), "dd 'de' MMMM 'de' yyyy • HH:mm", { locale: ptBR })}</p>
                    </div>
                </header>

                {/* Patient Info */}
                <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identificação do Paciente</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-500">Nome Completo</p>
                            <p className="text-lg font-bold">{data.patient.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">CPF</p>
                            <p className="font-medium">{data.patient.cpf || 'Não informado'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Telefone</p>
                            <p className="font-medium">{data.patient.whatsapp || 'Não informado'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Data de Nascimento</p>
                            <p className="font-medium">{data.patient.birth_date ? format(new Date(data.patient.birth_date), 'dd/MM/yyyy') : 'Não informada'}</p>
                        </div>
                    </div>
                </section>

                {/* Medical Record Body */}
                <div className="space-y-4 print:space-y-4">
                    {/* Anamnese */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase border-b border-slate-200 pb-1 mb-2">
                            <span className="bg-slate-800 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">1</span>
                            Queixa Principal (Anamnese)
                        </h3>
                        <div className="p-3 border border-slate-200 rounded-lg bg-white min-h-[40px] text-justify leading-relaxed whitespace-pre-wrap print:border-none print:p-0 print:text-sm">
                            {data.record?.chief_complaint || 'Nenhum registro.'}
                        </div>
                    </section>

                    {/* Evolução */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase border-b border-slate-200 pb-1 mb-2">
                            <span className="bg-slate-800 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">2</span>
                            Histórico / Evolução / Exame Físico
                        </h3>
                        <div className="p-3 border border-slate-200 rounded-lg bg-white min-h-[40px] text-justify leading-relaxed whitespace-pre-wrap print:border-none print:p-0 print:text-sm">
                            {data.record?.history || 'Nenhum registro.'}
                        </div>
                    </section>

                    {/* Prescrição (Resumo) */}
                    {data.record?.prescription && (
                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase border-b border-slate-200 pb-1 mb-2">
                                <span className="bg-slate-800 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">3</span>
                                Prescrição Médica (Resumo)
                            </h3>
                            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm italic text-slate-600 print:bg-white print:border-none print:p-0 print:text-slate-800">
                                <span className="print:hidden">* Vide receita médica separada para detalhes de posologia.</span>
                                <div className="mt-2 not-italic text-slate-800 whitespace-pre-wrap print:mt-0 print:text-sm">
                                    {data.record.prescription}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer / Signature */}
                <footer className="mt-8 pt-4 border-t border-slate-200 flex flex-col items-center justify-center text-center break-inside-avoid">
                    <div className="w-64 border-b border-slate-800 mb-2"></div>
                    <p className="font-bold text-base">{data.volunteer.name}</p>
                    <p className="text-sm text-slate-600">{data.volunteer.specialty}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {data.volunteer.license_number ? `Registro Profissional: ${data.volunteer.license_number}` : 'Voluntário'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-4 print:mt-12">
                        Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • Clínica Cuidar Sistema
                    </p>
                </footer>

            </div>
        </div>
    );
};

export default MedicalRecordPrint;
