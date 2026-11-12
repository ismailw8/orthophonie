import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { primaryClass } from '../components/PageUI';
import { Brand } from '../components/Navbar';

export default function LoginProfessional() {
  const { user, login, isAdmin } = useAuth();
  if (user) return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5"><Brand/><Link to="/rendez-vous" className="text-sm font-semibold text-sky-800">Prendre rendez-vous</Link></div></header>
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-9 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">Connexion sécurisée</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">L’authentification est assurée par le serveur Keycloak du cabinet.</p>
        <button type="button" onClick={login} className={`${primaryClass} mt-7 w-full`}>Se connecter avec Keycloak</button>
      </section>
    </main>
  </div>;
}
