import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const submit = async (event) => {
        event.preventDefault();
        if (password !== confirmation) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await axiosInstance.post('/api/auth/change-password', { newPassword: password });
            login(data);
            navigate('/dashboard', { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Le mot de passe ne respecte pas les critères.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold text-sky-800">Première connexion</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-950">Choisissez votre mot de passe</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">Utilisez au moins 12 caractères avec une majuscule, une minuscule, un chiffre et un symbole.</p>
                {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
                <form onSubmit={submit} className="mt-6 space-y-5">
                    <label className="block text-sm font-semibold">Nouveau mot de passe<input type="password" minLength="12" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100" /></label>
                    <label className="block text-sm font-semibold">Confirmation<input type="password" minLength="12" required autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-100" /></label>
                    <button disabled={loading} className="w-full rounded-xl bg-sky-800 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Enregistrement…' : 'Enregistrer et continuer'}</button>
                </form>
            </section>
        </main>
    );
}
