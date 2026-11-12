import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import axios from '../api/axios';
import { Alert, Card, Page, PageHeader, inputClass, primaryClass, secondaryClass } from '../components/PageUI';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import UnsavedDialog from '../components/UnsavedDialog';

const empty = { firstName: '', lastName: '', email: '', phone: '', password: '' };
const password = () => { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'; return Array.from(crypto.getRandomValues(new Uint32Array(12)), number => chars[number % chars.length]).join('') + 'Aa1!'; };
export default function AdminComptesPatients() {
    const [form, setForm] = useState(empty); const [created, setCreated] = useState(null);
    const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [copied, setCopied] = useState(false); const [visible, setVisible] = useState(false);
    const blocker = useUnsavedChanges(Object.values(form).some(Boolean) || loading);
    const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
    const submit = async event => {
        event.preventDefault(); setLoading(true); setError(''); setCopied(false);
        try {
            const payload = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() };
            const { data } = await axios.post('/api/auth/register-patient', payload);
            setCreated({ ...payload, ...data }); setForm(empty); setVisible(false);
        } catch (err) { setError(err.response?.data?.message || 'La création n’a pas pu être confirmée. Vérifiez le répertoire des patients avant de réessayer.'); }
        finally { setLoading(false); }
    };
    const copy = async () => { try { await navigator.clipboard.writeText(`Connexion : ${location.origin}/login\nE-mail : ${created.email}\nMot de passe temporaire : ${created.password}`); setCopied(true); } catch { setError('Copie impossible. Vous pouvez afficher et copier les accès manuellement.'); } };
    return <AdminLayout><Page width="max-w-4xl"><PageHeader title="Nouveau patient" action={<Link to="/admin/patients" className={secondaryClass}>Retour aux patients</Link>}>Créez un compte, puis ouvrez le dossier pour préparer le suivi.</PageHeader>
        {error && <div className="mb-5"><Alert>{error}</Alert></div>}
        <div className="grid items-start gap-6 lg:grid-cols-2"><Card className="p-6"><form onSubmit={submit}><fieldset disabled={loading} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">{[['firstName', 'Prénom'], ['lastName', 'Nom']].map(([key, label]) => <label key={key} className="text-sm font-semibold">{label}<input required maxLength="80" autoComplete={key === 'firstName' ? 'given-name' : 'family-name'} value={form[key]} onChange={event => set(key, event.target.value)} className={`${inputClass} mt-2`}/></label>)}</div><label className="block text-sm font-semibold">Adresse e-mail<input required type="email" autoComplete="email" value={form.email} onChange={event => set('email', event.target.value)} className={`${inputClass} mt-2`}/></label><label className="block text-sm font-semibold">Téléphone<input type="tel" autoComplete="tel" value={form.phone} onChange={event => set('phone', event.target.value)} className={`${inputClass} mt-2`}/></label><label className="block text-sm font-semibold">Mot de passe temporaire<input required type={visible ? 'text' : 'password'} autoComplete="new-password" minLength="8" value={form.password} onChange={event => set('password', event.target.value)} className={`${inputClass} mt-2`}/></label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => set('password', password())} className={secondaryClass}>Générer</button><button type="button" onClick={() => setVisible(!visible)} className={secondaryClass}>{visible ? 'Masquer' : 'Afficher'}</button></div><p className="text-xs text-slate-500">Le patient devra changer ce mot de passe à sa première connexion.</p><button className={`${primaryClass} w-full`}>{loading ? 'Création…' : 'Créer le compte'}</button></fieldset></form></Card>
        <Card className="p-6">{created ? <><h2 className="font-semibold text-emerald-800">Compte créé</h2><p className="mt-3 text-sm">{created.firstName} {created.lastName}</p><p className="mt-2 break-all text-sm text-slate-600">{created.email}</p><label className="mt-5 block text-sm font-semibold">Mot de passe temporaire<input readOnly type={visible ? 'text' : 'password'} value={created.password} className={`${inputClass} mt-2`}/></label><div className="mt-5 space-y-3"><button onClick={copy} className={`${secondaryClass} w-full`}>{copied ? 'Accès copiés' : 'Copier les accès'}</button>{created.id && <Link to={`/admin/patients/${created.id}`} className={`${primaryClass} w-full`}>Ouvrir le dossier patient</Link>}</div>{copied && <p role="status" className="mt-3 text-sm text-emerald-800">Les accès ont été copiés.</p>}</> : <p className="py-16 text-center text-sm text-slate-500">Les accès et le lien vers le dossier apparaîtront ici après la création du compte.</p>}</Card></div>
        <UnsavedDialog blocker={blocker} busy={loading}/>
    </Page></AdminLayout>;
}
