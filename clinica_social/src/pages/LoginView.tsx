
import React, { useState } from 'react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await import('../services/api').then(m => m.api.login({ email: username, password }));
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate email sending
    setResetMessage(`Um link de redefinição foi enviado para ${resetEmail} (Simulação)`);
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetMessage('');
      setResetEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clínica Cuidar</h1>
          <p className="text-slate-500 mt-2">Acesso restrito para colaboradores</p>
        </div>

        {/* Login Hints - Restored as requested */}
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 text-center">
          <p className="font-bold mb-1">Credenciais de Acesso:</p>
          <p>Admin: admin / admin123</p>
          <p>Voluntário: voluntario / 123456</p>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            {resetMessage ? (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold text-center border border-green-100">
                {resetMessage}
              </div>
            ) : (
              <>
                <div className="text-center mb-2">
                  <p className="text-slate-600">Informe seu e-mail para receber o link de redefinição de senha.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">E-mail</label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-green-200 hover:bg-green-800 hover:-translate-y-0.5 active:translate-y-0 transition-all text-lg"
                >
                  ENVIAR LINK
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-slate-500 font-bold py-3 hover:text-slate-700 transition-colors"
            >
              Voltar para o Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold text-center border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Usuário</label>
              <input
                required
                type="text"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                placeholder="Digite seu usuário"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Senha</label>
              <input
                required
                type="password"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-bold text-primary hover:text-green-800 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-green-200 hover:bg-green-800 hover:-translate-y-0.5 active:translate-y-0 transition-all text-lg"
            >
              ENTRAR NO SISTEMA
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginView;
