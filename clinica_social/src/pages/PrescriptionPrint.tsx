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

const PrescriptionPrint: React.FC = () => {
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
            alert('Erro ao carregar dados da receita.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando receita...</div>;
    if (!data || !settings) return <div className="p-8 text-center text-red-500">Receita não encontrada.</div>;

    if (!data.record?.prescription) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-slate-800">Nenhuma prescrição registrada.</h2>
                <p className="text-slate-500">O profissional não preencheu o campo de prescrição neste atendimento.</p>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen text-slate-800 p-8 print:p-0 font-serif">
            {/* Print Button */}
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-end print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Imprimir Receita
                </button>
            </div>

            {/* A4 Container */}
            <div className="max-w-[210mm] h-[297mm] mx-auto bg-white p-[15mm] shadow-2xl relative flex flex-col print:shadow-none print:w-full print:max-w-none print:h-screen">

                {/* Header */}
                <header className="flex items-center justify-between border-b-2 border-primary pb-6 mb-12">
                    <div className="flex items-center gap-6">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="h-24 w-auto object-contain" />
                        ) : (
                            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                                {settings.clinic_name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-primary font-sans">{settings.clinic_name}</h1>
                            <p className="text-sm text-slate-500 font-sans mt-1 max-w-sm leading-tight">
                                {settings.address}
                                <br />
                                {settings.phone}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-bold text-slate-200 tracking-widest font-sans">RECEITA</h2>
                        <p className="text-sm font-medium mt-2 text-slate-400 font-sans">
                            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                </header>

                {/* Patient */}
                <div className="mb-12 font-sans">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paciente</span>
                    <h3 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-2">
                        {data.patient.name}
                    </h3>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="text-lg leading-loose whitespace-pre-wrap ml-8 relative">
                        {/* Rx Symbol */}
                        <span className="absolute -left-8 -top-2 text-4xl font-bold text-primary italic font-serif opacity-50">Rx</span>

                        {data.record.prescription}
                    </div>
                </div>

                {/* Footer / Signature */}
                <footer className="mt-auto pt-12 flex flex-col items-center justify-center text-center font-sans">
                    <div className="w-80 border-b-2 border-slate-800 mb-3"></div>
                    <p className="font-bold text-lg text-slate-800 uppercase">{data.volunteer.name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>{data.volunteer.specialty}</span>
                        {data.volunteer.license_number && (
                            <>
                                <span>•</span>
                                <span>CRM/Registro: {data.volunteer.license_number}</span>
                            </>
                        )}
                    </div>

                    {/* Legal Footer */}
                    <div className="w-full border-t border-slate-200 mt-8 pt-4 flex justify-between items-end text-[10px] text-slate-400">
                        <div className="text-left">
                            <p className="font-bold">{settings.company_name || settings.clinic_name}</p>
                            {settings.cnpj && <p>CNPJ: {settings.cnpj}</p>}
                        </div>
                        <div className="text-right">
                            <p>{settings.website}</p>
                            <p>{settings.email}</p>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default PrescriptionPrint;
