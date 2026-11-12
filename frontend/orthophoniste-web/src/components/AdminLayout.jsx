import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brand } from './Navbar';

const links = [
    ['/admin', 'Tableau de bord', true], ['/admin/agenda', 'Agenda'],
    ['/admin/patients', 'Patients'], ['/admin/bilans', 'Suivis'],
    ['/admin/statistics', 'Statistiques'],
];
function Sidebar({ close }) {
    const { logout } = useAuth(); const navigate = useNavigate();
    const signOut = async () => { await logout(); navigate('/login', { replace: true }); };
    return <div className="flex h-full flex-col p-5">
        <div className="border-b border-slate-200 pb-5" onClick={close}><Brand/></div>
        <p className="mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Cabinet</p>
        <nav className="mt-3 space-y-1" aria-label="Administration">{links.map(([to, label, end]) =>
            <NavLink key={to} to={to} end={end} onClick={close} className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-sky-800 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>{label}</NavLink>)}
        </nav>
        <Link to="/admin/indisponibilites" onClick={close} className="mt-5 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100">Gérer les indisponibilités</Link>
        <button onClick={signOut} className="mt-auto rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Déconnexion</button>
    </div>;
}
export default function AdminLayout({ children }) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth(); const location = useLocation();
    const section = links.find(([to, , end]) => end ? location.pathname === to : location.pathname.startsWith(to))?.[1] || (location.pathname.includes('indisponibilites') ? 'Indisponibilités' : 'Patients');
    useEffect(() => { const previous = document.body.style.overflow; if (open) document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, [open]);
    useEffect(() => {
        if (!open) return;
        const previousFocus = document.activeElement;
        const menu = document.getElementById('admin-menu');
        const controls = [...menu.querySelectorAll('a, button:not([disabled])')];
        controls[0]?.focus();
        const trap = event => {
            if (event.key !== 'Tab') return;
            const first = controls[0]; const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        menu.addEventListener('keydown', trap);
        return () => { menu.removeEventListener('keydown', trap); if (previousFocus?.isConnected) previousFocus.focus(); };
    }, [open]);
    useEffect(() => { const close = event => { if (event.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
    return <div className="admin-shell min-h-screen bg-slate-50">
        <a href="#page-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:p-3">Aller au contenu</a>
        {open && <button aria-label="Fermer le menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"/>}
        <aside id="admin-menu" aria-label="Menu du cabinet" className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full invisible lg:visible'}`}><Sidebar close={() => setOpen(false)}/></aside>
        <div className="min-h-screen lg:pl-64"><header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 lg:px-8">
            <div className="flex items-center gap-3"><button aria-controls="admin-menu" aria-expanded={open} onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold lg:hidden">Menu</button><span className="text-sm font-semibold text-slate-700">{section}</span></div>
            <span className="text-right text-xs text-slate-500">{user?.firstName || user?.email}<span className="block">Administration</span></span>
        </header><div id="page-content">{children}</div></div>
    </div>;
}
