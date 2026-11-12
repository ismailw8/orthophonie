import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Brand = () => <Link to="/" className="flex items-center gap-3" aria-label="Accueil du cabinet">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-800 text-sm font-bold text-white">CO</span>
    <span className="leading-tight"><strong className="block text-sm text-slate-950 sm:text-base">OrthoConnect</strong><span className="text-xs text-slate-500 sm:text-sm">Orthophoniste</span></span>
</Link>;
export default function Navbar({ home = false }) {
    const { user, logout, isAdmin } = useAuth(); const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const signOut = async () => { await logout(); navigate('/'); };
    const linkClass = ({ isActive }) => `rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-sky-50 text-sky-900' : 'text-slate-600 hover:bg-slate-100'}`;
    return <header className={`sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur ${home ? 'home-navigation' : ''}`}>
        <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
            <Brand/><button type="button" aria-expanded={open} aria-controls="public-menu" onClick={() => setOpen(!open)} className={`rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold ${home ? 'lg:hidden' : 'md:hidden'}`}>{open ? 'Fermer' : 'Menu'}</button>
            <nav id="public-menu" className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-1 ${home ? 'lg:flex lg:w-auto lg:flex-row lg:items-center' : 'md:flex md:w-auto md:flex-row md:items-center'}`} aria-label="Navigation principale">
                {home && <><a href="#cabinet" onClick={() => setOpen(false)} className="home-nav-link">Le cabinet</a><a href="#accompagnement" onClick={() => setOpen(false)} className="home-nav-link">Votre parcours</a></>}
                {!user ? <><NavLink to="/login" onClick={() => setOpen(false)} className={linkClass}>Connexion</NavLink><Link to="/rendez-vous" onClick={() => setOpen(false)} className="rounded-xl bg-sky-800 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-900">Demander un rendez-vous</Link></> :
                <><NavLink to={isAdmin() ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} className={linkClass}>{isAdmin() ? 'Administration' : 'Mon suivi'}</NavLink>{!isAdmin() && <NavLink to="/mes-rendez-vous" onClick={() => setOpen(false)} className={linkClass}>Mes rendez-vous</NavLink>}<button onClick={signOut} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-500 hover:bg-slate-100">Déconnexion</button></>}
            </nav>
        </div>
    </header>;
}
