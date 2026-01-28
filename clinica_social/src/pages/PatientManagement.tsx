import React, { useState, useEffect } from 'react';
import { Patient, PaymentTable } from '../types';
import { api } from '../services/api';

interface PatientManagementProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
}

const PatientManagement: React.FC<PatientManagementProps> = ({ onAddPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'birth_date' | 'personal_income'>('name');

  // Payment Tables State
  const [paymentTables, setPaymentTables] = useState<PaymentTable[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const initialFormState: Partial<Patient> = {
    name: '',
    cpf: '',
    rg: '',
    birth_date: '',
    whatsapp: '',
    email: '',
    personal_income: 0,
    family_income: 0,
    observations: '',
    files: [],
    address: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    },
    payment_table_id: '',
    guardian_name: '',
    guardian_cpf: '',
    guardian_phone: ''
  };
  const [formData, setFormData] = useState<Partial<Patient>>(initialFormState);

  // Helper: Check if minor
  const isMinor = (birthDate: string) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age < 18;
  };

  // Fetch Patients & Payment Tables
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsData, tablesData] = await Promise.all([
        api.getPatients(),
        api.getPaymentTables()
      ]);
      setPatients(patientsData);
      setPaymentTables(tablesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Address Lookup
  const handleCepBlur = async () => {
    if (formData.address?.cep && formData.address.cep.length >= 8) {
      const addressData = await api.getAddressByCep(formData.address.cep);
      if (addressData) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address!,
            street: addressData.logradouro,
            neighborhood: addressData.bairro,
            city: addressData.localidade,
            state: addressData.uf
          }
        }));
      }
    }
  };

  // Form Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure a payment table is selected
    if (!formData.payment_table_id && paymentTables.length > 0) {
      alert("Por favor selecione uma tabela de pagamento.");
      return;
    }

    // Logic to distinguish between Create and Update
    try {
      if (formData.id) {
        // Edit Mode
        const updatedPatient = { ...formData } as Patient;
        await api.updatePatient(updatedPatient);
        // Refresh list to be sure, or update local
        setPatients(patients.map(p => p.id === formData.id ? updatedPatient : p));
        alert('Paciente atualizado com sucesso!');
      } else {
        // Create Mode
        const newPatientData = { ...formData } as Patient;
        // Backend generates ID, so we strip it if present or let backend ignore
        const created = await api.createPatient(newPatientData);
        setPatients([...patients, created]);
        onAddPatient(created);
        alert('Paciente cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar paciente. Tente novamente.");
    }
  };

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string, name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setPatientToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (patientToDelete) {
      try {
        await api.deletePatient(patientToDelete.id);
        setPatients(patients.filter(p => p.id !== patientToDelete.id));
        setDeleteModalOpen(false);
        setPatientToDelete(null);
        alert('Paciente excluído.');
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir. Tente novamente.");
      }
    }
  };

  // Helper to get payment table details
  const getPaymentTableDetails = (id?: string) => {
    const table = paymentTables.find(t => t.id === id);
    return table ? table : { name: 'Não definido', value: 0 };
  };

  // Filter & Sort Logic
  const filteredPatients = patients
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'birth_date') return a.birth_date.localeCompare(b.birth_date);
      // Sort by payment value ? Or use personal_income roughly
      if (sortField === 'personal_income') return b.personal_income - a.personal_income;
      return 0;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-slate-500">Gerencie o cadastro e histórico da comunidade.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Buscar por Nome ou CPF..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button
            onClick={() => { setIsEditMode(false); setFormData(initialFormState); setIsModalOpen(true); }}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th onClick={() => setSortField('name')} className="cursor-pointer hover:bg-slate-100 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nome / CPF
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                <th onClick={() => setSortField('birth_date')} className="cursor-pointer hover:bg-slate-100 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nascimento
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tabela (Pagamento)
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando...</td></tr>
              ) : filteredPatients.map((p) => {
                const tableDetails = getPaymentTableDetails(p.payment_table_id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                              {p.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{p.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{p.cpf}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-700">
                        <span className="text-green-600">📱</span> {p.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(p.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {p.address?.neighborhood || 'Não informado'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-primary">
                        {tableDetails.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setFormData(p); setIsEditMode(true); setIsModalOpen(true); }} className="text-primary hover:text-green-800 font-medium text-sm">Editar</button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:text-red-900 font-medium text-sm">Excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Cadastro Completo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 mt-10 mb-10 h-fit">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                {isEditMode ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Foto do Paciente */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center mb-6">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-100 overflow-hidden flex items-center justify-center relative">
                        {/* Camera Preview */}
                        <video id="webcam-preview" className="hidden absolute inset-0 w-full h-full object-cover"></video>

                        {/* Display Image */}
                        {formData.photo ? (
                          <img id="photo-display" src={formData.photo} alt="Foto do paciente" className="w-full h-full object-cover" />
                        ) : (
                          <svg id="default-avatar" className="w-16 h-16 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute -bottom-2 -right-12 flex flex-col gap-2">
                        {/* Upload Button */}
                        <label htmlFor="photo-upload" className="bg-primary text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-green-800 transition-all tooltip" title="Upload Arquivo">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              if (e.target.files && e.target.files[0]) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({ ...formData, photo: reader.result as string });
                                };
                                reader.readAsDataURL(e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {/* Webcam Button */}
                        <button
                          type="button"
                          className="bg-emerald-500 text-white p-2 rounded-full shadow-md hover:bg-emerald-600 transition-all"
                          onClick={() => {
                            const video = document.getElementById('webcam-preview') as HTMLVideoElement;
                            const img = document.getElementById('photo-display');
                            const svg = document.getElementById('default-avatar');

                            if (video.srcObject) {
                              // Capture
                              const canvas = document.createElement('canvas');
                              canvas.width = video.videoWidth;
                              canvas.height = video.videoHeight;
                              canvas.getContext('2d')?.drawImage(video, 0, 0);
                              const dataUrl = canvas.toDataURL('image/jpeg');
                              setFormData({ ...formData, photo: dataUrl });

                              // Stop stream
                              const stream = video.srcObject as MediaStream;
                              stream.getTracks().forEach(t => t.stop());
                              video.srcObject = null;
                              video.classList.add('hidden');
                              if (img) img.classList.remove('hidden');
                              if (svg && !formData.photo) svg.classList.remove('hidden');
                            } else {
                              // Start Camera
                              navigator.mediaDevices.getUserMedia({ video: true })
                                .then(stream => {
                                  video.srcObject = stream;
                                  video.play();
                                  video.classList.remove('hidden');
                                  if (img) img.classList.add('hidden');
                                  if (svg) svg.classList.add('hidden');
                                })
                                .catch(err => alert("Erro ao acessar câmera: " + err));
                            }
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 mt-2">Use a câmera ou upload</span>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                    <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento *</label>
                    <input required type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                  </div>

                  {isMinor(formData.birth_date!) && (
                    <div className="md:col-span-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Responsável Legal (Menor de Idade)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Responsável *</label>
                          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.guardian_name} onChange={e => setFormData({ ...formData, guardian_name: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">CPF do Responsável *</label>
                          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.guardian_cpf} onChange={e => setFormData({ ...formData, guardian_cpf: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Telefone do Responsável *</label>
                          <input required type="tel" className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.guardian_phone} onChange={e => setFormData({ ...formData, guardian_phone: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF *</label>
                    <input required type="text" placeholder="000.000.000-00" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">RG</label>
                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Whatsapp *</label>
                    <input required type="tel" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.address?.cep}
                      onChange={e => setFormData({ ...formData, address: { ...formData.address!, cep: e.target.value } })}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.address?.street} onChange={e => setFormData({ ...formData, address: { ...formData.address!, street: e.target.value } })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.address?.number} onChange={e => setFormData({ ...formData, address: { ...formData.address!, number: e.target.value } })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.address?.complement} onChange={e => setFormData({ ...formData, address: { ...formData.address!, complement: e.target.value } })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.address?.neighborhood} onChange={e => setFormData({ ...formData, address: { ...formData.address!, neighborhood: e.target.value } })} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cidade - UF</label>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                        value={formData.address?.city} readOnly />
                      <input type="text" className="w-20 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                        value={formData.address?.state} readOnly placeholder="UF" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Socioeconômico & Arquivos */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Socioeconômico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tabela de Pagamento *</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none bg-white"
                      value={formData.payment_table_id}
                      onChange={e => setFormData({ ...formData, payment_table_id: e.target.value })}
                    >
                      <option value="">Selecione uma tabela...</option>
                      {paymentTables.map((table) => (
                        <option key={table.id} value={table.id}>{table.name} - R$ {table.value.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Renda Pessoal (R$)</label>
                    <input type="number" step="0.01" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.personal_income} onChange={e => setFormData({ ...formData, personal_income: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Renda Familiar (R$)</label>
                    <input type="number" step="0.01" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.family_income} onChange={e => setFormData({ ...formData, family_income: parseFloat(e.target.value) })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Comprovantes (Renda/Residência)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer group">
                      <svg className="w-8 h-8 mx-auto text-slate-400 mb-2 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm text-slate-500">Arraste arquivos JPG ou PDF aqui ou <span className="text-primary font-semibold">clique para selecionar</span></span>
                        <input id="file-upload" type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (e.target.files && e.target.files.length > 0) {
                            Array.from(e.target.files).forEach(file => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({
                                  ...prev,
                                  files: [...(prev.files || []), { name: file.name, content: reader.result as string }]
                                }));
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }} />
                      </label>
                    </div>

                    {formData.files && formData.files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase">Arquivos Anexados ({formData.files.length})</p>
                        <ul className="space-y-2">
                          {formData.files.map((file, i) => (
                            <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="text-sm text-slate-700 flex items-center gap-2 truncate max-w-[200px]" title={file.name}>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                {file.name}
                              </span>
                              <div className="flex gap-2">
                                {/* Preview */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const win = window.open();
                                    if (win) {
                                      win.document.write(`<iframe src="${file.content}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                    }
                                  }}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Visualizar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                {/* Download */}
                                <a
                                  href={file.content}
                                  download={file.name}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                  title="Baixar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
                                </a>
                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, files: prev.files?.filter((_, index) => index !== i) }));
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  title="Remover"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                    <textarea className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                      value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })}></textarea>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-100 hover:bg-green-800 transition-all">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Confirmação de Exclusão */}
      {deleteModalOpen && patientToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Excluir Paciente?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Você está prestes a excluir <b>{patientToDelete.name}</b>. Esta ação é irreversível e removerá todos os dados associados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
