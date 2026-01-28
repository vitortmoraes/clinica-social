
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn({ email, password });
            navigate('/volunteer-dashboard'); // Redirect to dashboard
        } catch (err) {
            setError('Falha no login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-green-900 mb-2">Clínica Cuidar</h1>
                        <p className="text-slate-500">Acesso do Voluntário</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium text-slate-800"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Entrando...' : 'Acessar Sistema'}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 p-4 text-center">
                    <p className="text-xs text-slate-400">© 2025 Clínica Cuidar - Gestão Inteligente</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
