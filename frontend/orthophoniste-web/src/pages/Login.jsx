import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axiosInstance.post('/api/auth/login', form);
            login(response.data);

            const role = response.data.role;

            if (role === 'ROLE_ADMIN' || role === 'ROLE_SUPER_ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch {
            setError('Email ou mot de passe incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-fixed relative flex flex-col"
            style={{
                backgroundImage: "url('/images/home-bg.jpg')",
            }}
        >
            {/* Overlay pour garder la page lisible */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/95 via-white/90 to-cyan-50/95"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header simple */}
                <div className="p-6">
                    <Link to="/" className="flex items-center gap-4 w-fit">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-sky-200">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </div>

                        <div>
                            <p className="font-bold text-sky-900 text-sm leading-tight">
                                Zamzem Soulaymane
                            </p>
                            <p className="text-xs text-sky-400 leading-tight">
                                Orthophoniste
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Card */}
                <div className="flex-1 flex items-center justify-center px-4 pb-12">
                    <div className="w-full max-w-md">
                        {/* Top decoration */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>

                            <h1 className="text-3xl font-bold text-sky-950">
                                Espace patient
                            </h1>

                            <p className="text-gray-500 text-sm mt-2">
                                Connectez-vous pour accéder à votre suivi de traitement
                            </p>
                        </div>

                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-sky-100 border border-sky-100 p-8">
                            <div className="mb-6 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 rounded-2xl p-4">
                                <p className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-1">
                                    Cabinet
                                </p>
                                <p className="text-sm text-sky-950 font-semibold">
                                    Zamzem Soulaymane — Orthophoniste
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Accès sécurisé réservé aux patients suivis.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm mb-6">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-sky-900 mb-2">
                                        Adresse email
                                    </label>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                                />
                                            </svg>
                                        </div>

                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="votre@email.com"
                                            className="w-full pl-10 pr-4 py-3 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-sky-50/80 placeholder-gray-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-sky-900 mb-2">
                                        Mot de passe
                                    </label>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                        </div>

                                        <input
                                            type="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-4 py-3 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-sky-50/80 placeholder-gray-300"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-sky-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                />
                                            </svg>
                                            Connexion...
                                        </span>
                                    ) : (
                                        'Se connecter'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-sky-100 text-center">
                                <p className="text-gray-400 text-xs">
                                    Pas encore de compte ?{' '}
                                    <Link to="/rendez-vous" className="text-sky-500 font-medium hover:underline">
                                        Prendre un rendez-vous
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <p className="text-center text-gray-400 text-xs mt-6">
                            © 2026 Zamzem Soulaymane — Orthophoniste. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;