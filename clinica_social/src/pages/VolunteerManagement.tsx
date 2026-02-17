
import React, { useState, useEffect } from 'react';
import { Volunteer, Specialty, SpecialtyItem, AppointmentStatus, Availability } from '../types';
import ConsentPrint from './ConsentPrint';
import { api } from '../services/api';

interface VolunteerManagementProps {
  volunteers: Volunteer[];
  onAddVolunteer: (volunteer: Volunteer) => void;
  onUpdateVolunteer: (volunteer: Volunteer) => void;
  onDeleteVolunteer: (id: string) => void;
}

const VolunteerManagement: React.FC<VolunteerManagementProps> = ({ volunteers: propVolunteers, onAddVolunteer, onUpdateVolunteer, onDeleteVolunteer }) => {

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState<{ id: string, name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormState: Partial<Volunteer> = {
    name: '',
    specialty: '',
    license_number: '',
    email: '',
    password: '',
    birth_date: '',
    phone: '',
    photo: '',
    active: true,
    availability: [],
    files: [],
    appointment_duration: 60,
    lgpd_consent: false,
    lgpd_consent_date: ''
  };

  const [formData, setFormData] = useState<Partial<Volunteer>>(initialFormState);

  // New Availability State
  const [newAvailability, setNewAvailability] = useState<Availability>({ day: 'Segunda', start: '08:00', end: '12:00' });

  // Dynamic Specialties State
  const [availableSpecialties, setAvailableSpecialties] = useState<import('../types').SpecialtyItem[]>([]);

  useEffect(() => {
    loadVolunteers();
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const specs = await api.getSpecialties();
      setAvailableSpecialties(specs);
    } catch (error) { console.error("Error loading specialties", error); }
  };

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const data = await api.getVolunteers();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setVolunteers(data);
    } catch (error) {
      console.error('Erro ao carregar voluntários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && formData.id) {
        // Update
        const updated = await api.updateVolunteer(formData as Volunteer);
        setVolunteers(volunteers.map(v => v.id === updated.id ? updated : v).sort((a, b) => a.name.localeCompare(b.name)));
        onUpdateVolunteer(updated); // Sync with parent
        alert('Voluntário atualizado com sucesso!');
      } else {
        // Create
        if (!formData.password) {
          alert('Senha é obrigatória para novos cadastros.');
          return;
        }
        const created = await api.createVolunteer(formData as Volunteer);
        setVolunteers([...volunteers, created].sort((a, b) => a.name.localeCompare(b.name)));
        onAddVolunteer(created); // Sync with parent
        alert('Voluntário cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Verifique o console.');
    }
  };

  const handleDelete = async () => {
    if (!volunteerToDelete) return;
    try {
      // Soft Delete
      // Soft Delete: Call backend delete endpoint
      await api.deleteVolunteer(volunteerToDelete.id);
      setVolunteers(volunteers.filter(v => v.id !== volunteerToDelete.id));
      onDeleteVolunteer(volunteerToDelete.id); // Sync with parent
      setDeleteModalOpen(false);
      setVolunteerToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir.');
    }
  };

  const [printConsentVolunteer, setPrintConsentVolunteer] = useState<Volunteer | null>(null);

  const addAvailability = () => {
    const currentList = formData.availability || [];
    setFormData({ ...formData, availability: [...currentList, newAvailability] });
  };

  const removeAvailability = (index: number) => {
    const currentList = formData.availability || [];
    setFormData({ ...formData, availability: currentList.filter((_, i) => i !== index) });
  };

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Voluntários</h1>
          <p className="text-slate-500">Gestão dos profissionais de saúde que servem na clínica.</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar voluntário..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <button
          onClick={() => { setIsEditMode(false); setFormData(initialFormState); setIsModalOpen(true); }}
          className="bg-primary hover:bg-green-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-100 transition-all flex items-center gap-2 ml-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Voluntário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Carregando...</p> : volunteers.filter(v => v.active !== false && v.name.toLowerCase().includes(searchTerm.toLowerCase())).map((v) => (
          <div key={v.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              {/* Foto Miniatura */}
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                {v.photo ? (
                  <img src={v.photo} alt={v.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {v.specialty === 'Médico' ? '⚕️' : v.specialty === 'Dentista' ? '🦷' : '🧠'}
                  </div>
                )}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${v.active !== false ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100'}`}>
                {v.active !== false ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">{v.name}</h3>
            <p className="text-sm font-medium text-primary mb-4">{v.specialty}</p>

            <div className="space-y-2 border-t border-slate-50 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-5">📄</span> {v.license_number}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-5">📧</span> {v.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-5">📱</span> {v.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Consultas de <b>{v.appointment_duration || 60} min</b></span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
              <button onClick={() => { setFormData(v); setIsEditMode(true); setIsModalOpen(true); }} className="text-sm text-primary font-semibold hover:underline">Editar</button>
              <button
                onClick={() => setPrintConsentVolunteer(v)}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium"
                title="Imprimir Termo LGPD"
              >
                LGPD
              </button>
              <button onClick={() => { setVolunteerToDelete({ id: v.id, name: v.name }); setDeleteModalOpen(true); }} className="text-sm text-red-600 font-semibold hover:underline">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {
        isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300 mt-10 mb-10 h-fit">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{isEditMode ? 'Editar Voluntário' : 'Novo Voluntário'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Foto Upload (Webcam + File) */}
                <div className="flex justify-center mb-8 relative">
                  <div className="relative group w-32 h-32">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-100 overflow-hidden flex items-center justify-center relative">
                      {/* Camera Preview */}
                      <video id="webcam-preview" className="hidden absolute inset-0 w-full h-full object-cover"></video>

                      {/* Display Image */}
                      {formData.photo ? (
                        <img id="photo-display" src={formData.photo} className="w-full h-full object-cover" />
                      ) : (
                        <svg id="default-avatar" className="w-12 h-12 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute -bottom-2 -right-12 flex flex-col gap-2 z-10">
                      {/* Upload Label */}
                      <label className="bg-primary text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-green-800 transition-all" title="Upload Arquivo">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }} />
                      </label>

                      {/* Webcam Button */}
                      <button
                        type="button"
                        className="bg-emerald-500 text-white p-2 rounded-full shadow-md hover:bg-emerald-600 transition-all"
                        title="Tirar Foto"
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

                    {/* Active Toggle - Absolutely Positioned */}
                    <div className="absolute -right-52 bottom-0 flex flex-col items-center gap-1 z-0">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFormData({ ...formData, active: !formData.active })}>
                        <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${formData.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 ${formData.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{formData.active ? 'ATIVO' : 'INATIVO'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Especialidade</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none bg-white"
                      value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })}>
                      <option value="">Selecione...</option>
                      {availableSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registro Profissional (CRM/CRO/CRP)</label>
                    <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                    <input required type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input required type="email" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha de Acesso</label>
                    <input type="password" placeholder={isEditMode ? "Deixar em branco para manter" : "Senha inicial"} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (Whatsapp)</label>
                    <input required type="tel" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-yellow-800 mb-1">Tempo de Consulta</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-yellow-200 outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                      value={formData.appointment_duration || 60}
                      onChange={e => setFormData({ ...formData, appointment_duration: Number(e.target.value) })}
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos (Padrão)</option>
                    </select>
                    <p className="text-xs text-yellow-700 mt-1">Define os horários disponíveis na agenda.</p>
                  </div>
                </div>

                {/* Arquivos */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Documentos (Diplomas, Contratos, etc.)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer group">
                    <svg className="w-8 h-8 mx-auto text-slate-400 mb-2 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <label htmlFor="vol-file-upload" className="cursor-pointer">
                      <span className="text-sm text-slate-500">Arraste arquivos PDF ou Imagens aqui ou <span className="text-primary font-semibold">clique para selecionar</span></span>
                      <input id="vol-file-upload" type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files && e.target.files.length > 0) {
                          Array.from(e.target.files).forEach((file: File) => {
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
                          <li key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-sm text-slate-700 flex items-center gap-2 truncate max-w-[200px]" title={file.name}>
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              {file.name}
                            </span>
                            <div className="flex gap-2">
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
                              <a
                                href={file.content}
                                download={file.name}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                title="Baixar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
                              </a>
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



                {/* LGPD Consent */}
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">Consentimento LGPD</h3>
                  <div className="flex items-start gap-3">
                    <input
                      id="lgpd_consent"
                      type="checkbox"
                      required
                      className="mt-1 w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
                      checked={formData.lgpd_consent || false}
                      onChange={e => setFormData({
                        ...formData,
                        lgpd_consent: e.target.checked,
                        lgpd_consent_date: e.target.checked ? new Date().toISOString() : ''
                      })}
                    />
                    <label htmlFor="lgpd_consent" className="text-sm text-slate-700 cursor-pointer">
                      Declaro que o voluntário autorizou o tratamento de seus dados pessoais para fins de gestão de corpo clínico e atendimento, conforme a <b>Lei Geral de Proteção de Dados (LGPD)</b>.
                      {formData.lgpd_consent_date && (
                        <span className="block text-xs text-slate-500 mt-1">
                          Consentimento registrado em: {new Date(formData.lgpd_consent_date).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                {/* Disponibilidade */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase">Disponibilidade de Atendimento</h3>

                  <div className="flex gap-2 mb-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500">Dia</label>
                      <select className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                        value={newAvailability.day} onChange={e => setNewAvailability({ ...newAvailability, day: e.target.value })}>
                        {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-slate-500">Início</label>
                      <input type="time" className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                        value={newAvailability.start} onChange={e => setNewAvailability({ ...newAvailability, start: e.target.value })} />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-slate-500">Fim</label>
                      <input type="time" className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                        value={newAvailability.end} onChange={e => setNewAvailability({ ...newAvailability, end: e.target.value })} />
                    </div>
                    <button type="button" onClick={addAvailability} className="bg-indigo-100 text-indigo-700 p-2 rounded-lg hover:bg-indigo-200 text-sm font-bold">
                      + Adicionar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.availability?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-sm">
                        <span className="font-medium text-slate-700">{item.day}</span>
                        <span className="text-slate-500">{item.start} - {item.end}</span>
                        <button type="button" onClick={() => removeAvailability(index)} className="text-red-400 hover:text-red-600">✕</button>
                      </div>
                    ))}
                    {(!formData.availability || formData.availability.length === 0) && (
                      <p className="text-xs text-slate-400 text-center italic">Nenhum horário cadastrado</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl shadow-lg shadow-green-100 hover:bg-green-800 transition-all">Salvar Voluntário</button>
                </div>
              </form>
            </div>
          </div >
        )
      }

      {/* Modal Exclusão */}
      {
        deleteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Excluir Voluntário?</h3>
              <p className="text-center text-slate-500 text-sm mb-6">Tem certeza que deseja excluir <b>{volunteerToDelete?.name}</b>?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border">Cancelar</button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 text-white rounded-xl py-2">Excluir</button>
              </div>
            </div>
          </div>
        )
      }

      {printConsentVolunteer && (
        <ConsentPrint
          person={printConsentVolunteer}
          type="volunteer"
          clinicName="CLÍNICA SOCIAL CUIDAR"
          onClose={() => setPrintConsentVolunteer(null)}
        />
      )}
    </div >
  );
};

export default VolunteerManagement;
