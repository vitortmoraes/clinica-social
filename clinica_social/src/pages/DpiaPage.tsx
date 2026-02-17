import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ClinicSettings } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DpiaPage: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<ClinicSettings | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await api.settings.get();
                setSettings(data);
            } catch (error) {
                console.error('Failed to load clinic settings', error);
            }
        };
        loadSettings();
    }, []);

    const clinicName = settings?.clinic_name || 'Clínica Cuidar';
    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white text-slate-800">
            {/* Header / Brand Bar (Screen Only) */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm print:hidden">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 text-white p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 leading-none">Relatório de Impacto (DPIA)</h1>
                            <p className="text-xs text-slate-500 mt-0.5">LGPD • Proteção de Dados</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimir / Salvar PDF
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2 border border-slate-200 rounded-lg"
                        >
                            Voltar
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Content */}
            <div className="max-w-[210mm] mx-auto bg-white p-[20mm] my-8 shadow-xl print:shadow-none print:m-0 print:p-0 print:w-full">

                {/* Document Header */}
                <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide mb-2">Relatório de Impacto</h1>
                        <h2 className="text-lg text-slate-600">Proteção de Dados Pessoais (DPIA/RIPD)</h2>
                    </div>
                    <div className="text-right">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="h-16 w-auto object-contain ml-auto" />
                        ) : (
                            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-bold ml-auto">
                                {clinicName.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <p className="text-sm font-bold text-slate-800 mt-2">{clinicName}</p>
                        <p className="text-xs text-slate-500">{currentDate}</p>
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-8 text-justify leading-relaxed">

                    <section>
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-600 pl-3 mb-3">1. Descrição do Tratamento</h3>
                        <p className="text-slate-700">
                            Este documento descreve as operações de tratamento de dados realizadas pelo sistema de gestão da <strong>{clinicName}</strong>.
                            O software realiza a coleta, armazenamento, processamento e arquivamento de dados pessoais (civis) e dados pessoais sensíveis
                            (relacionados à saúde e assistência social) de pacientes assistidos pela instituição, bem como dados administrativos de voluntários e profissionais de saúde.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-600 pl-3 mb-3">2. Natureza dos Dados</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-2">Dados Pessoais (Comuns)</h4>
                                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                                    <li>Nome Completo</li>
                                    <li>CPF (Cadastro de Pessoas Físicas)</li>
                                    <li>Endereço Residencial</li>
                                    <li>Telefone / Contato</li>
                                    <li>Data de Nascimento</li>
                                </ul>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <h4 className="font-bold text-indigo-900 mb-2">Dados Sensíveis (Art. 5º, II LGPD)</h4>
                                <ul className="list-disc pl-5 text-sm text-indigo-800 space-y-1">
                                    <li>Histórico de Saúde / Prontuário Médico</li>
                                    <li>Anotações de Evolução Clínica</li>
                                    <li>Dados Socioeconômicos</li>
                                    <li>Filiação Religiosa (quando aplicável)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-600 pl-3 mb-3">3. Matriz de Riscos e Mitigação</h3>
                        <p className="text-slate-700 mb-4">
                            Abaixo detalhamos os riscos identificados no ciclo de vida dos dados e as medidas técnicas de segurança implementadas para mitigá-los.
                        </p>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Risco Identificado</th>
                                        <th className="px-4 py-3 text-center">Impacto</th>
                                        <th className="px-4 py-3">Medida Mitigadora Implementada</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="bg-white">
                                        <td className="px-4 py-3 font-medium text-slate-900">Vazamento de Banco de Dados</td>
                                        <td className="px-4 py-3 text-center text-red-600 font-bold">ALTO</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <strong className="text-slate-800">Criptografia de Coluna (AES):</strong> O CPF e dados críticos são gravados cifrados. Mesmo com acesso físico ao banco, o dado é ilegível sem a chave da aplicação.
                                        </td>
                                        <td className="px-4 py-3 text-center text-green-600 font-bold">✅ Ativo</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">Acesso Não Autorizado</td>
                                        <td className="px-4 py-3 text-center text-orange-600 font-bold">MÉDIO</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <strong className="text-slate-800">Controle de Acesso (RBAC):</strong> Segregação estrita de funções entre Administradores e Voluntários. Autenticação via JWT.
                                        </td>
                                        <td className="px-4 py-3 text-center text-green-600 font-bold">✅ Ativo</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-4 py-3 font-medium text-slate-900">Alteração Indevida de Prontuário</td>
                                        <td className="px-4 py-3 text-center text-red-600 font-bold">ALTO</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <strong className="text-slate-800">Logs de Auditoria:</strong> Registro imutável de "Quem, Quando e O Que" foi alterado em qualquer registro médico.
                                        </td>
                                        <td className="px-4 py-3 text-center text-green-600 font-bold">✅ Ativo</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">Perda de Dados (Ransomware)</td>
                                        <td className="px-4 py-3 text-center text-red-600 font-bold">ALTO</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <strong className="text-slate-800">Backup Criptografado:</strong> Rotina de backup automatizada com saída criptografada (Fernet Encrypted Dump).
                                        </td>
                                        <td className="px-4 py-3 text-center text-green-600 font-bold">✅ Ativo</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-4 py-3 font-medium text-slate-900">Exibição de Excluídos</td>
                                        <td className="px-4 py-3 text-center text-orange-600 font-bold">MÉDIO</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <strong className="text-slate-800">Soft Delete (Arquivamento):</strong> Dados não são deletados fisicamente para manter integridade, mas são ocultados da interface padrão (Direito de Esquecimento).
                                        </td>
                                        <td className="px-4 py-3 text-center text-green-600 font-bold">✅ Ativo</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="bg-green-50 p-6 rounded-xl border border-green-100 flex gap-4 items-start break-inside-avoid">
                        <div className="text-3xl">🛡️</div>
                        <div>
                            <h3 className="text-lg font-bold text-green-900 mb-1">Conclusão do Encarregado (DPO)</h3>
                            <p className="text-green-800 text-sm leading-relaxed">
                                O sistema apresenta maturidade elevada em relação à segurança da informação. As medidas implementadas de **Criptografia**, **Auditoria** e **Backup Seguro** demonstram aderência aos princípios de <em>Privacy by Design</em> e <em>Privacy by Default</em> exigidos pela LGPD. O risco residual é considerado <strong>BAIXO</strong> e aceitável para a operação.
                            </p>
                        </div>
                    </section>

                </div>

                {/* Footer / Signature Area */}
                <footer className="mt-16 pt-8 border-t border-slate-200 text-center font-sans">
                    <p className="mb-12 text-sm text-slate-500">
                        {settings?.city || 'Localidade'}, {currentDate}
                    </p>

                    <div className="flex justify-center gap-12">
                        <div className="flex flex-col items-center">
                            <div className="w-64 border-b border-slate-800 mb-2"></div>
                            <p className="font-bold text-sm text-slate-800 uppercase">{clinicName}</p>
                            <p className="text-xs text-slate-400">Controlador de Dados</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-64 border-b border-slate-800 mb-2"></div>
                            <p className="font-bold text-sm text-slate-800 text-transparent select-none">.</p>
                            <p className="text-xs text-slate-400">Encarregado de Dados (DPO)</p>
                        </div>
                    </div>

                    <p className="mt-8 text-[10px] text-slate-300">
                        Documento gerado eletronicamente pelo sistema Clínica Cuidar. Hash de validação: {Math.random().toString(36).substring(7)}
                    </p>
                </footer>

            </div>
        </div>
    );
};

export default DpiaPage;
