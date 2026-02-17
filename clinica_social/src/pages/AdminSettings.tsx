import React, { useState, useEffect } from 'react';
import { PaymentTable, ClinicSettings } from '../types';
import { api } from '../services/api';
import FormBuilder from '../components/FormBuilder';

const ClinicInfoForm: React.FC = () => {
  const [settings, setSettings] = useState<ClinicSettings>({
    id: '',
    clinic_name: '',
    primary_color: '#059669'
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.settings.get();
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api.settings.update(settings);
      setSettings(updated);
      setMsg('Configurações salvas!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      alert('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {msg && <div className="p-3 bg-green-100 text-green-700 rounded-lg">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
            value={settings.clinic_name}
            onChange={e => setSettings({ ...settings, clinic_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
            value={settings.company_name || ''}
            onChange={e => setSettings({ ...settings, company_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
          <input
            type="text"
            placeholder="00.000.000/0000-00"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
            value={settings.cnpj || ''}
            onChange={e => setSettings({ ...settings, cnpj: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
            value={settings.phone || ''}
            onChange={e => setSettings({ ...settings, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
        <input
          type="text"
          placeholder="Rua, Número, Bairro - UF"
          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
          value={settings.address || ''}
          onChange={e => setSettings({ ...settings, address: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
        <input
          type="text"
          placeholder="Ex: Campos dos Goytacazes - RJ"
          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
          value={settings.city || ''}
          onChange={e => setSettings({ ...settings, city: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
            value={settings.email || ''}
            onChange={e => setSettings({ ...settings, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Logotipo</label>
          <div className="flex items-center gap-4">
            {settings.logo_url && (
              <img src={settings.logo_url} alt="Logo Preview" className="h-10 w-10 object-contain border rounded-md" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="text-sm text-slate-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-green-50 file:text-green-700
                              hover:file:bg-green-100"
            />
          </div>
        </div>
      </div>
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
};

interface AdminSettingsProps {
  currentUser?: import('../types').User;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ currentUser }) => {
  const [openSection, setOpenSection] = useState<string>('');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Configurações do Sistema</h1>

      {/* Clinic Info - Admin Only */}
      {currentUser?.role === 'ADMIN' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggleSection('clinic_info')}
            className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">Dados da Clínica</h2>
              <p className="text-slate-500 text-sm">Informações para cabeçalho de receitas e logs.</p>
            </div>
            <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'clinic_info' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openSection === 'clinic_info' && (
            <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
              <ClinicInfoForm />
            </div>
          )}
        </div>
      )}

      {/* User Management - Admin Only */}
      {currentUser?.role === 'ADMIN' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggleSection('users')}
            className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">Gerenciamento de Usuários</h2>
              <p className="text-slate-500 text-sm">Cadastre novos administradores ou usuários do sistema.</p>
            </div>
            <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'users' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openSection === 'users' && (
            <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
              <UsersManager />
            </div>
          )}
        </div>
      )}

      {/* Tables Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={() => toggleSection('tables')}
          className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">Tabelas de Pagamento</h2>
            <p className="text-slate-500 text-sm">Gerencie preços e categorias de pagamento.</p>
          </div>
          <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'tables' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {openSection === 'tables' && (
          <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <PaymentTablesManager />
          </div>
        )}
      </div>

      {/* Specialties Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={() => toggleSection('specialties')}
          className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">Especialidades Médicas</h2>
            <p className="text-slate-500 text-sm">Gerencie as áreas de atuação dos voluntários.</p>
          </div>
          <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'specialties' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {openSection === 'specialties' && (
          <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <SpecialtiesManager />
          </div>
        )}
      </div>



      {/* Document Templates Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={() => toggleSection('templates')}
          className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">Modelos de Documentos</h2>
            <p className="text-slate-500 text-sm">Crie e edite formulários personalizados para atendimentos.</p>
          </div>
          <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'templates' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {openSection === 'templates' && (
          <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <FormTemplatesManager />
          </div>
        )}
      </div>

      {/* Backup Section - Admin Only */}
      {currentUser?.role === 'ADMIN' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggleSection('backup')}
            className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">Backup e Restauração</h2>
              <p className="text-slate-500 text-sm">Gerencie cópias de segurança e agendamentos.</p>
            </div>
            <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'backup' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openSection === 'backup' && (
            <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
              <BackupManager />
            </div>
          )}
        </div>
      )}

      {/* Legal Documentation Section - LGPD */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={() => toggleSection('legal')}
          className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">Documentação Legal (LGPD)</h2>
            <p className="text-slate-500 text-sm">Acesse os termos de privacidade e relatórios de impacto.</p>
          </div>
          <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'legal' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {openSection === 'legal' && (
          <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/politica-privacidade" target="_blank" className="group block bg-white border border-slate-200 hover:border-green-500 rounded-xl p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-green-100 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Política de Privacidade</h3>
              </div>
              <p className="text-slate-500 text-sm">Visualize o documento público de privacidade.</p>
            </a>

            <a href="/relatorio-impacto" className="group block bg-white border border-slate-200 hover:border-indigo-500 rounded-xl p-6 transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Relatório de Impacto (DPIA)</h3>
              </div>
              <p className="text-slate-500 text-sm">Visualizar relatório técnico de riscos e mitigações.</p>
            </a>
          </div>
        )}
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={() => toggleSection('password')}
          className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">Segurança</h2>
            <p className="text-slate-500 text-sm">Altere sua senha de acesso.</p>
          </div>
          <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'password' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {openSection === 'password' && (
          <div className="p-8 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
            <ChangePasswordForm currentUser={currentUser} />
          </div>
        )}
      </div>

    </div>
  );
};

// ... existing code ...

const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'STAFF' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        await api.users.update({
          id: editingId,
          name: formData.name,
          username: formData.username,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}) // Only send password if changed
        });
        alert('Usuário atualizado!');
        setEditingId(null);
      } else {
        // Create
        if (!formData.password) return alert('Senha é obrigatória para novos usuários.');
        await api.users.create(formData);
        alert('Usuário criado!');
      }
      setFormData({ name: '', username: '', password: '', role: 'STAFF' });
      loadUsers();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar usuário: ' + (e.message || ''));
    }
  };

  const handleEdit = (u: any) => {
    setFormData({
      name: u.name,
      username: u.username,
      password: '', // Empty password means don't change
      role: u.role
    });
    setEditingId(u.id);
  };

  const handleCancel = () => {
    setFormData({ name: '', username: '', password: '', role: 'STAFF' });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir usuário?')) return;
    try {
      await api.users.delete(id);
      loadUsers();
      if (editingId === id) handleCancel();
    } catch (e) {
      alert('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className={`p-6 rounded-2xl border transition-colors grid grid-cols-1 md:grid-cols-2 gap-4 items-end ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
        <div className="md:col-span-2 flex justify-between items-center mb-2">
          <h3 className={`font-bold ${editingId ? 'text-indigo-900' : 'text-slate-800'}`}>
            {editingId ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
          {editingId && (
            <button type="button" onClick={handleCancel} className="text-sm text-slate-500 hover:underline">Cancelar Edição</button>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email / Login</label>
          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
            value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {editingId ? 'Nova Senha (Opcional)' : 'Senha'}
          </label>
          <input type={editingId ? "text" : "password"} required={!editingId} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
            placeholder={editingId ? "Deixe em branco para manter" : ""}
            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Função</label>
          <select className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
            <option value="STAFF">Usuário (Padrão)</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <button type="submit" className={`font-bold py-2 px-6 rounded-xl transition-colors md:col-span-2 text-white ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary hover:bg-green-800'}`}>
          {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-bold text-slate-800">Usuários do Sistema</h3>
        {users.map(u => (
          <div key={u.id} className={`flex justify-between items-center p-4 border rounded-xl ${editingId === u.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-slate-100'}`}>
            <div>
              <p className="font-bold text-slate-800">{u.name}</p>
              <p className="text-xs text-slate-500">{u.username} • {u.role}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Editar
              </button>
              <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChangePasswordForm: React.FC<{ currentUser?: import('../types').User }> = ({ currentUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert('Usuário não identificado.');
    if (newPassword !== confirmPassword) return alert('Novas senhas não conferem.');

    setLoading(true);
    try {
      await api.changePassword({ user_id: currentUser.id, current_password: currentPassword, new_password: newPassword });
      alert('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <p className="text-red-500">Erro: Usuário não logado.</p>;

  return (
    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Senha Atual</label>
        <input type="password" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
          value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Nova Senha</label>
        <input type="password" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
          value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1">Confirmar Nova Senha</label>
        <input type="password" required className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="bg-primary hover:bg-green-800 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-green-100 disabled:opacity-50">
        {loading ? 'Alterando...' : 'Alterar Senha'}
      </button>
    </form>
  );
};

const PaymentTablesManager: React.FC = () => {
  const [paymentTables, setPaymentTables] = useState<PaymentTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', value: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentTables();
  }, []);

  const loadPaymentTables = async () => {
    setLoading(true);
    try {
      const data = await api.getPaymentTables();
      setPaymentTables(data);
    } catch (error) {
      console.error('Error loading payment tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) {
      alert('Por favor, preencha o nome e o valor da tabela.');
      return;
    }

    try {
      if (editingId) {
        // Update Mode
        const updated = await api.updatePaymentTable(editingId, {
          name: formData.name,
          value: parseFloat(formData.value)
        });
        setPaymentTables(paymentTables.map(t => t.id === editingId ? updated : t));
        alert('Tabela atualizada com sucesso!');
      } else {
        // Create Mode
        const created = await api.createPaymentTable({
          name: formData.name,
          value: parseFloat(formData.value)
        });
        setPaymentTables([...paymentTables, created]);
        alert('Tabela criada com sucesso!');
      }
      // Reset Form
      setFormData({ name: '', value: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving table:', error);
      alert('Erro ao salvar tabela.');
    }
  };

  const handleEdit = (table: PaymentTable) => {
    setFormData({ name: table.name, value: table.value.toString() });
    setEditingId(table.id);
  };

  const handleCancelEdit = () => {
    setFormData({ name: '', value: '' });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tabela?')) return;
    try {
      await api.deletePaymentTable(id);
      setPaymentTables(paymentTables.filter(t => t.id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form (Create/Edit) */}
      <div className={`rounded-3xl shadow-sm border p-6 transition-colors ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${editingId ? 'text-indigo-900' : 'text-slate-800'}`}>
            {editingId ? 'Editar Tabela' : 'Adicionar Nova Tabela'}
          </h3>
          {editingId && (
            <button onClick={handleCancelEdit} className="text-sm text-slate-500 hover:text-slate-700 underline">
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Nome da Tabela</label>
            <input
              type="text"
              placeholder="Ex: Tabela Social"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className={`${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-primary hover:bg-green-800 shadow-green-100'} text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg h-[50px] min-w-[120px]`}
          >
            {editingId ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* Lista de Tabelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentTables.map(table => (
          <div key={table.id} className={`rounded-2xl shadow-sm border p-6 flex flex-col justify-between hover:shadow-md transition-all ${editingId === table.id ? 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{table.name}</h3>
              <p className="text-3xl font-black text-primary mt-2">
                R$ {table.value.toFixed(2)}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => handleEdit(table)}
                className="text-primary font-semibold text-sm hover:text-green-800 px-4 py-2 hover:bg-green-50 rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(table.id)}
                className="text-red-500 font-semibold text-sm hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {paymentTables.length === 0 && !loading && (
        <div className="text-center py-12 bg-surface rounded-3xl border border-dashed border-green-200">
          <p className="text-slate-500">Nenhuma tabela cadastrada.</p>
        </div>
      )}
    </div>
  );
};

const SpecialtiesManager: React.FC = () => {
  const [specialties, setSpecialties] = useState<import('../types').SpecialtyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('general');

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    setLoading(true);
    try {
      const data = await api.getSpecialties();
      setSpecialties(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const created = await api.createSpecialty({ name: newName, anamnesis_type: newType });
      setSpecialties([...specialties, created]);
      setNewName('');
      setNewType('general');
      alert('Especialidade adicionada!');
    } catch (error) { alert('Erro ao adicionar especialidade'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta especialidade?')) return;
    try {
      await api.deleteSpecialty(id);
      setSpecialties(specialties.filter(s => s.id !== id));
    } catch (error) { alert('Erro ao excluir'); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Nova Especialidade</label>
            <input
              type="text"
              placeholder="Ex: Pediatria"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Tipo de Ficha</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none bg-white"
              value={newType}
              onChange={e => setNewType(e.target.value)}
            >
              <option value="general">Geral (Médica)</option>
              <option value="nutrition">Nutricionista</option>
              <option value="dental">Odontologia (Dentista)</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-green-800 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-100 h-[50px] w-full md:w-auto min-w-[120px]"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {specialties.map(spec => (
          <div key={spec.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
            <span className="font-bold text-slate-700">{spec.name}</span>
            <button
              onClick={() => handleDelete(spec.id)}
              className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Excluir"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>
      {specialties.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-400">Nenhuma especialidade cadastrada.</div>
      )}
    </div>
  );
};

const FormTemplatesManager: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.forms.listTemplates();
      setTemplates(data);
    } catch (e: any) {
      console.error(e);
      setError('Erro ao carregar modelos. Tente sair e logar novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir ESTE modelo? Isso não pode ser desfeito.')) return;
    try {
      await api.forms.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      alert('Erro ao excluir modelo.');
    }
  };

  const startEdit = (template: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setView('edit');
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div>
        <div className="mb-4">
          <button onClick={() => { setView('list'); setEditingTemplate(null); }} className="text-slate-500 hover:text-slate-700 flex items-center gap-2">
            ← Voltar para lista
          </button>
        </div>
        <FormBuilder
          initialData={view === 'edit' ? editingTemplate : undefined}
          onCancel={() => { setView('list'); setEditingTemplate(null); }}
          onSave={async (data) => {
            if (view === 'edit' && editingTemplate) {
              await api.forms.updateTemplate(editingTemplate.id, data);
              alert('Modelo atualizado!');
            } else {
              await api.forms.createTemplate(data);
              alert('Modelo criado com sucesso!');
            }
            setView('list');
            setEditingTemplate(null);
            loadTemplates();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-700">Modelos Ativos</h3>
        <button
          onClick={() => { setView('create'); setEditingTemplate(null); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-100"
        >
          + Novo Modelo
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-center py-8">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="border border-slate-200 p-4 rounded-xl flex flex-col bg-white group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800">{t.title}</h4>
                {t.type === 'dynamic' && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Dinâmico</span>}
              </div>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{t.description || "Sem descrição"}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {t.specialties?.length ? t.specialties.join(', ') : 'Todas especialidades'}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEdit(t, e)}
                    className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(t.id, e)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                    title="Excluir"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              Nenhum modelo cadastrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [schedule, setSchedule] = useState({ frequency: 'manual', time: '03:00' });
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, backupsList] = await Promise.all([
        api.settings.get(),
        api.backup.list()
      ]);
      setSchedule({
        frequency: settingsData.backup_frequency || 'manual',
        time: settingsData.backup_time || '03:00'
      });
      setBackups(backupsList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await api.settings.update({
        backup_frequency: schedule.frequency,
        backup_time: schedule.time
      });
      alert('Agendamento salvo com sucesso!');
    } catch (e) {
      alert('Erro ao salvar agendamento.');
    }
  };

  const handleManualBackup = async () => {
    if (!window.confirm('Iniciar backup agora? Isso pode levar alguns segundos.')) return;
    setBackingUp(true);
    try {
      await api.backup.trigger();
      alert('Backup realizado com sucesso!');
      loadData();
    } catch (e) {
      alert('Erro ao realizar backup.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const blob = await api.backup.download(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert('Erro ao baixar arquivo.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Frequência do Backup Automático</label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary bg-white"
            value={schedule.frequency}
            onChange={e => setSchedule({ ...schedule, frequency: e.target.value })}
          >
            <option value="manual">Manual (Desativado)</option>
            <option value="daily">Diário (Todos os dias)</option>
            <option value="weekly">Semanal (Todo Domingo)</option>
          </select>
        </div>
        <div className="w-full md:w-32">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Horário</label>
          <input
            type="time"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary"
            value={schedule.time}
            onChange={e => setSchedule({ ...schedule, time: e.target.value })}
            disabled={schedule.frequency === 'manual'}
          />
        </div>
        <button
          onClick={handleSaveSchedule}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 h-[50px] w-full md:w-auto"
        >
          Salvar Agendamento
        </button>
      </div>

      <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-green-900 text-lg">Backup Manual</h3>
          <p className="text-green-700 text-sm">Gere uma cópia de segurança criptografada agora mesmo.</p>
        </div>
        <button
          onClick={handleManualBackup}
          disabled={backingUp}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-200 disabled:opacity-50 flex items-center gap-2"
        >
          {backingUp ? 'Gerando...' : 'Gerar Backup Agora'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-lg">Histórico de Backups</h3>
        {backups.length === 0 ? (
          <p className="text-slate-500 italic">Nenhum backup encontrado.</p>
        ) : (
          <div className="grid gap-3">
            {backups.map((b: any) => (
              <div key={b.filename} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:shadow-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-2 rounded-lg text-green-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{b.filename}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(b.created_at * 1000).toLocaleString()} • {(b.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(b.filename)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-sm px-4 py-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  Baixar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
