import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ClinicSettings } from '../types';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<ClinicSettings | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await api.settings.get();
                setSettings(data);
            } catch (error) {
                console.error('Failed to load clinic settings', error);
                // Fallback to null (default static view)
            }
        };
        loadSettings();
    }, []);

    const clinicName = settings?.clinic_name || 'Clínica Cuidar';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Brand Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {settings?.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt="Logo"
                                className="h-10 w-auto object-contain"
                            />
                        ) : (
                            <div className="bg-green-600 text-white p-2 rounded-lg">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 leading-none">{clinicName}</h1>
                            {settings ? (
                                <div className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                                    {settings.company_name && <span className="font-semibold">{settings.company_name}</span>}
                                    <span>
                                        {settings.address || 'Endereço não cadastrado'} • {settings.city || 'Cidade não informada'}
                                    </span>
                                    <span>Tel: {settings.phone || 'Sem telefone'}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 mt-0.5">Gestão Eclesiástica e Social</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm font-medium text-slate-500 hover:text-green-600 transition-colors"
                    >
                        Voltar
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
                    <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-700 prose-a:text-green-600">
                        <h1 className="text-3xl font-bold mb-2">Política de Privacidade e Proteção de Dados</h1>
                        <p className="text-sm text-slate-400 mb-8 border-b border-slate-100 pb-8">Última atualização: 11 de Fevereiro de 2026</p>

                        <p>
                            A <strong>{clinicName}</strong> ("nós") preza pela transparência e segurança no tratamento dos dados pessoais de seus pacientes, voluntários e colaboradores, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                        </p>
                        <p>Esta Política descreve como nosso sistema interno gerencia as informações.</p>

                        <h2 className="text-xl font-bold mt-8 mb-4">1. Para Quem é Esta Política?</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Voluntários e Colaboradores:</strong> Usuários que acessam este sistema para gerenciar atendimentos.</li>
                            <li><strong>Pacientes:</strong> Titulares dos dados de saúde geridos por esta plataforma (cujo consentimento específico é coletado presencialmente).</li>
                        </ul>

                        <h2 className="text-xl font-bold mt-8 mb-4">2. Dados Coletados</h2>
                        <p>O sistema armazena minimamente os dados necessários para a prestação de serviços de saúde e assistência social:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>De Pacientes:</strong> Nome, CPF, Data de Nascimento, Endereço, Histórico de Atendimentos (Prontuário) e Dados Socioeconômicos.</li>
                            <li><strong>De Voluntários:</strong> Nome, Registro Profissional (CRM/CRP/etc), Especialidade e Disponibilidade de Agenda.</li>
                            <li><strong>De Usuários do Sistema:</strong> Login, Senha (Criptografada) e Logs de Ações (Auditoria).</li>
                        </ul>

                        <h2 className="text-xl font-bold mt-8 mb-4">3. Finalidade do Tratamento</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Gestão Clínica:</strong> Agendamento, evolução de prontuário e acompanhamento assistencial.</li>
                            <li><strong>Segurança Legal:</strong> Manutenção de histórico para cumprimento de obrigações legais (ex: guarda de prontuário por 20 anos).</li>
                            <li><strong>Auditoria:</strong> Rastreabilidade de todas as ações realizadas no sistema para garantir a integridade dos dados.</li>
                        </ul>

                        <h2 className="text-xl font-bold mt-8 mb-4">4. Segurança da Informação</h2>
                        <p>Implementamos rigorosas medidas técnicas:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Criptografia:</strong> Dados sensíveis (como CPF) são armazenados criptografados no banco de dados.</li>
                            <li><strong>Controle de Acesso:</strong> Apenas usuários autorizados e autenticados acessam o sistema.</li>
                            <li><strong>Backups Seguros:</strong> Cópias de segurança são realizadas periodicamente e mantidas sob criptografia.</li>
                            <li><strong>Logs de Auditoria:</strong> Cada acesso ou modificação é registrado e imutável.</li>
                        </ul>

                        <h2 className="text-xl font-bold mt-8 mb-4">5. Seus Direitos (LGPD)</h2>
                        <p>Qualquer titular de dados tem o direito de solicitar:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Confirmação da existência de tratamento.</li>
                            <li>Acesso aos dados.</li>
                            <li>Correção de dados incompletos ou desatualizados.</li>
                            <li>Anonimização ou bloqueio de dados desnecessários (observados os prazos legais de guarda médica).</li>
                        </ul>

                        <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-100">
                            <h2 className="text-lg font-bold mb-2">6. Contato</h2>
                            <p>Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato com a administração da {clinicName}.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8 text-slate-400 text-sm">
                    © 2026 {clinicName} - Todos os direitos reservados.
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
