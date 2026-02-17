import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Patient, Volunteer } from '../types';

interface ConsentPrintProps {
    person: Patient | Volunteer;
    type: 'patient' | 'volunteer';
    clinicName: string;
    onClose: () => void;
}

const ConsentPrint: React.FC<ConsentPrintProps> = ({ person, type, clinicName, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Termo_Consentimento_${person.name.replace(/\s+/g, '_')}`,
        onAfterPrint: onClose,
    });

    const isPatient = type === 'patient';
    const cpfOrLicense = isPatient ? (person as Patient).cpf : (person as Volunteer).license_number;
    const labelId = isPatient ? 'CPF' : 'Registro Profissional';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-800">Visualização de Impressão (LGPD)</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
                    <div ref={componentRef} className="bg-white p-[1.5cm] shadow-md mx-auto max-w-[21cm] min-h-[29.7cm] text-justify text-slate-900 leading-normal print:shadow-none print:m-0">

                        {/* Cabeçalho */}
                        <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
                            <h1 className="text-2xl font-bold uppercase tracking-wide">{clinicName}</h1>
                            <p className="text-sm text-slate-500 mt-1">Termo de Consentimento para Tratamento de Dados Pessoais (LGPD)</p>
                        </div>

                        {/* Conteúdo */}
                        <div className="space-y-6 text-sm">
                            <p>
                                Este documento visa registrar a manifestação livre, informada e inequívoca pela qual o(a) Titular concorda com o tratamento de seus dados pessoais para finalidade específica, em conformidade com a Lei nº 13.709 – Lei Geral de Proteção de Dados Pessoais (LGPD).
                            </p>

                            <div className="bg-slate-50 p-4 border rounded-lg">
                                <p className="font-bold mb-2 uppercase">IDENTIFICAÇÃO DO TITULAR ({isPatient ? 'PACIENTE' : 'VOLUNTÁRIO'}):</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <p><span className="font-semibold">Nome:</span> {person.name}</p>
                                    <p><span className="font-semibold">{labelId}:</span> {cpfOrLicense || '________________________'}</p>
                                    <p><span className="font-semibold">Data de Nascimento:</span> {person.birth_date ? person.birth_date.split('-').reverse().join('/') : '___/___/_____'}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-2 uppercase">1. Finalidade do Tratamento</h4>
                                <p>
                                    Os dados pessoais coletados (incluindo dados sensíveis) serão utilizados exclusivamente para:
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        {isPatient ? (
                                            <>
                                                <li>Realização de agendamentos, triagens e atendimentos médicos/multidisciplinares;</li>
                                                <li>Manutenção de prontuário eletrônico e histórico de saúde;</li>
                                                <li>Comunicação sobre consultas e exames;</li>
                                            </>
                                        ) : (
                                            <>
                                                <li>Gestão administrativa e escalas de atendimento;</li>
                                                <li>Comunicação interna sobre atividades da clínica;</li>
                                                <li>Cumprimento de requisitos legais para atuação voluntária;</li>
                                            </>
                                        )}
                                        <li>Cumprimento de obrigações legais e regulatórias.</li>
                                    </ul>
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold mb-2 uppercase">2. Compartilhamento de Dados</h4>
                                <p>
                                    A <strong>{clinicName}</strong> fica autorizada a compartilhar os dados pessoais do Titular com outros agentes de tratamento de dados, caso seja necessário para as finalidades listadas neste termo, observados os princípios e as garantias estabelecidas pela Lei nº 13.709.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold mb-2 uppercase">3. Segurança e Armazenamento</h4>
                                <p>
                                    A Clínica responsabiliza-se pela manutenção de medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold mb-2 uppercase">4. Consentimento</h4>
                                <p>
                                    Ao assinar este termo, o Titular declara que concorda com o tratamento de seus dados pessoais e dados pessoais sensíveis para as finalidades aqui descritas.
                                </p>
                            </div>
                        </div>

                        {/* Assinatura */}
                        <div className="mt-12 pt-8 border-t border-slate-400">
                            <div className="flex justify-between items-end gap-12">
                                <div className="flex-1 text-center">
                                    <div className="border-t border-black mb-2"></div>
                                    <p className="font-bold">{person.name}</p>
                                    <p className="text-xs text-slate-500">Assinatura do {isPatient ? 'Paciente / Responsável' : 'Voluntário'}</p>
                                </div>
                                <div className="flex-1 text-center">
                                    <p className="mb-2">{new Date().toLocaleString('pt-BR')}</p>
                                    <div className="border-t border-black mb-2"></div>
                                    <p className="font-bold">Data da Assinatura</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-center text-xs text-slate-400">
                            <p>Este documento é parte integrante do cadastro do {isPatient ? 'paciente' : 'voluntário'}.</p>
                            <p>Sistema ClinicaSocial - Módulo de Compliance LGPD</p>
                        </div>

                    </div>
                </div>

                <div className="p-4 bg-white border-t rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handlePrint} className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimir Termo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentPrint;
