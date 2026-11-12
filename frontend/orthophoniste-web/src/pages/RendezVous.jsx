import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from '../api/axios';
import { Alert, LoadError, Card, Page, PageHeader, inputClass, primaryClass, secondaryClass } from '../components/PageUI';
import { formatDate, localDay } from '../utils/workflow';
import '../styles/booking.css';

const slots = []; for (let hour = 9; hour < 17; hour++) for (const minute of [0, 15, 30, 45]) slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
const empty = { dateSouhaitee: '', heureSouhaitee: '', firstName: '', lastName: '', phone: '', email: '', motif: '' };
const cleanTime = value => String(value || '').slice(0, 5);
const stepLabels = ['Date', 'Horaire', 'Coordonnées'];
function Recap({ form }) {
    return <Card className="p-5"><h2 className="font-semibold">Votre demande</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Date souhaitée</dt><dd className="mt-1 font-semibold">{form.dateSouhaitee ? formatDate(form.dateSouhaitee, false) : 'À choisir'}</dd></div><div><dt className="text-slate-500">Horaire souhaité</dt><dd className="mt-1 font-semibold">{form.heureSouhaitee || 'À choisir'}</dd></div>{form.firstName && <div><dt className="text-slate-500">Patient</dt><dd className="mt-1">{form.firstName} {form.lastName}</dd></div>}</dl><p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Le rendez-vous sera confirmé après validation par le cabinet.</p></Card>;
}
export default function RendezVous() {
    const { user, isUser } = useAuth();
    const [step, setStep] = useState(1); const [form, setForm] = useState(empty);
    const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
    const today = localDay(); const max = new Date(); max.setMonth(max.getMonth() + 6); const maxDate = localDay(max);
    useEffect(() => { if (user?.role === 'ROLE_USER') setForm(current => ({ ...current, firstName: current.firstName || user.firstName || '', lastName: current.lastName || user.lastName || '', email: current.email || user.email || '', phone: current.phone || user.phone || '' })); }, [user]);
    const fetchAvailability = useCallback(async signal => {
        const requests = [axios.get('/api/rdv/indisponibilites', { signal })];
        if (form.dateSouhaitee) requests.push(axios.get('/api/rdv/creneaux-occupes', { signal, params: { date: form.dateSouhaitee } }), axios.get('/api/suivi/creneaux-occupes', { signal, params: { date: form.dateSouhaitee } }));
        const [unavailable, rdvs, sessions] = await Promise.all(requests);
        return { unavailable: Array.isArray(unavailable.data) ? unavailable.data : [], busy: [...new Set([...(Array.isArray(rdvs?.data) ? rdvs.data : []), ...(Array.isArray(sessions?.data) ? sessions.data : [])].map(cleanTime))], date: form.dateSouhaitee };
    }, [form.dateSouhaitee]);
    const resource = useLoadableResource(fetchAvailability, { initialData: { unavailable: [], busy: [], date: '' }, enabled: !done });
    const dateBlocked = useMemo(() => {
        if (!form.dateSouhaitee) return false;
        const day = new Date(`${form.dateSouhaitee}T12:00:00`).getDay();
        return day === 0 || day === 6 || resource.data.unavailable.some(item => form.dateSouhaitee >= item.dateDebut.slice(0, 10) && form.dateSouhaitee <= item.dateFin.slice(0, 10));
    }, [form.dateSouhaitee, resource.data.unavailable]);
    const validDate = form.dateSouhaitee >= today && form.dateSouhaitee <= maxDate && !dateBlocked;
    const available = !validDate || resource.loading || resource.error || resource.data.date !== form.dateSouhaitee ? [] : slots.filter(time => !resource.data.busy.includes(time));
    const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
    const submit = async event => {
        event.preventDefault();
        if (!available.includes(form.heureSouhaitee)) { setError('Vérifiez la disponibilité du créneau avant l’envoi.'); setStep(2); return; }
        setSubmitting(true); setError('');
        const payload = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim(), email: form.email.trim().toLowerCase(), motif: form.motif.trim() };
        try { await axios.post('/api/rdv', payload); setForm(payload); setDone(true); }
        catch (err) {
            if (err.response?.status === 409) { setStep(2); set('heureSouhaitee', ''); await resource.reload(); setError(err.response?.data?.message || 'Ce créneau vient d’être réservé. Choisissez un autre horaire.'); }
            else if (['ETIMEDOUT', 'ECONNABORTED'].includes(err.code)) setError('La réponse du serveur a dépassé le délai prévu. Vérifiez auprès du cabinet si la demande a été reçue avant de la renvoyer.');
            else if (err.response?.status >= 500) setError('Le service est momentanément indisponible. Vérifiez si la demande a été reçue avant de la renvoyer.');
            else if (err.response?.status === 429) setError('Trop de demandes ont été envoyées. Réessayez plus tard.');
            else setError(err.response?.data?.message || 'La demande n’a pas pu être confirmée. Vérifiez votre connexion et si le cabinet l’a reçue avant de la renvoyer.');
        } finally { setSubmitting(false); }
    };
    const reset = () => { setDone(false); setStep(1); setError(''); setForm({ ...empty, ...(isUser() ? { firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '' } : {}) }); };
    if (done) return <div className="min-h-screen bg-slate-50"><Navbar/><Page width="max-w-2xl"><Card className="p-8 text-center"><div aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</div><h1 className="mt-5 text-2xl font-semibold">Demande envoyée</h1><p className="mt-3 text-sm text-slate-600">Le cabinet vous contactera pour confirmer la date et l’heure.</p><p className="mt-3 text-sm font-semibold text-amber-800">En attente de confirmation</p><div className="mt-6 text-left"><Recap form={form}/></div><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to={isUser() ? '/mes-rendez-vous' : '/'} className={primaryClass}>{isUser() ? 'Voir mes demandes' : 'Retour à l’accueil'}</Link><button onClick={reset} className={secondaryClass}>Nouvelle demande</button></div></Card></Page></div>;
    return <div className="booking-page"><Navbar/><Page>
        <PageHeader title="Demander un rendez-vous">Choisissez un créneau puis indiquez vos coordonnées. Le cabinet confirmera votre demande.</PageHeader>
        <p role="status" className="mb-3 text-sm text-slate-600">Étape {step} sur 3 : {stepLabels[step - 1]}</p>
        <ol className="booking-steps" aria-label="Étapes de la demande" style={{ '--booking-progress': (step - 1) / 2 }}>
            {stepLabels.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className="booking-step" data-state={step === index + 1 ? 'current' : step > index + 1 ? 'complete' : 'upcoming'}>
                <span className="booking-step-number" aria-hidden="true">{step > index + 1 ? '✓' : index + 1}</span>
                <span>{label}</span>{step > index + 1 && <span className="sr-only"> — terminé</span>}
            </li>)}
        </ol>
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]"><Card className="p-5 sm:p-7">
            <LoadError error={resource.error} onRetry={resource.reload} loading={resource.loading}/>{error && <div className="my-5"><Alert>{error}</Alert></div>}
            <div key={step} className="booking-step-content">
            {step === 1 && <div><h2 className="text-lg font-semibold">Date souhaitée</h2><p className="mt-2 text-sm text-slate-600">Du lundi au vendredi, selon les disponibilités du cabinet.</p>{resource.loading && <p role="status" className="mt-3 text-sm text-slate-500">Chargement des disponibilités…</p>}<label className="mt-5 block text-sm font-semibold">Choisir une date<input type="date" min={today} max={maxDate} value={form.dateSouhaitee} onChange={event => { setForm({ ...form, dateSouhaitee: event.target.value, heureSouhaitee: '' }); setError(''); }} className={`${inputClass} mt-2 max-w-sm`}/></label>{form.dateSouhaitee && !validDate && <p role="alert" className="mt-3 text-sm text-amber-800">Choisissez une date disponible entre aujourd’hui et {formatDate(maxDate, false)}.</p>}<div className="mt-7 flex justify-end"><button disabled={!validDate || resource.loading || !!resource.error || !resource.hasLoaded || resource.data.date !== form.dateSouhaitee} onClick={() => setStep(2)} className={primaryClass}>Choisir l’horaire</button></div></div>}
            {step === 2 && <div><h2 className="text-lg font-semibold">Horaires disponibles</h2><p className="mt-2 text-sm text-slate-600">{formatDate(form.dateSouhaitee, false)}</p>{resource.loading ? <p className="py-12 text-center text-sm text-slate-500" role="status">Chargement…</p> : resource.error ? null : available.length ? <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">{available.map(time => <button key={time} aria-pressed={form.heureSouhaitee === time} onClick={() => set('heureSouhaitee', time)} className={`booking-time-slot rounded-xl border px-3 py-3 text-sm font-semibold ${form.heureSouhaitee === time ? 'border-sky-800 bg-sky-800 text-white' : 'border-slate-200 text-slate-700 hover:border-sky-500'}`}>{time}</button>)}</div> : <p className="py-12 text-center text-sm text-slate-500">Aucun horaire disponible. Choisissez une autre date.</p>}<div className="mt-7 flex justify-between gap-3"><button onClick={() => setStep(1)} className={secondaryClass}>Changer la date</button><button disabled={!available.includes(form.heureSouhaitee)} onClick={() => setStep(3)} className={primaryClass}>Continuer</button></div></div>}
            {step === 3 && <form onSubmit={submit}><h2 className="text-lg font-semibold">Vos coordonnées</h2><fieldset disabled={submitting}><div className="mt-5 grid gap-4 sm:grid-cols-2">{[['firstName', 'Prénom', 'text', 'given-name'], ['lastName', 'Nom', 'text', 'family-name'], ['phone', 'Téléphone', 'tel', 'tel'], ['email', 'Adresse e-mail', 'email', 'email']].map(([key, label, type, autoComplete]) => <label key={key} className="text-sm font-semibold">{label}<input required type={type} autoComplete={autoComplete} maxLength={key === 'email' ? 254 : key === 'phone' ? 20 : 80} pattern={key === 'phone' ? '[+0-9 .\\(\\)\\-]{8,20}' : undefined} value={form[key]} onChange={event => set(key, event.target.value)} className={`${inputClass} mt-2`}/></label>)}</div><label className="mt-4 block text-sm font-semibold">Motif <span className="font-normal text-slate-500">(facultatif)</span><textarea rows="3" maxLength="500" value={form.motif} onChange={event => set('motif', event.target.value)} className={`${inputClass} mt-2`}/></label><div className="mt-7 flex justify-between gap-3"><button type="button" onClick={() => setStep(2)} className={secondaryClass}>Changer l’horaire</button><button disabled={resource.loading || !!resource.error} className={primaryClass}>{submitting ? 'Envoi…' : 'Envoyer la demande'}</button></div></fieldset></form>}
            </div>
        </Card><aside className="lg:sticky lg:top-24"><Recap form={form}/></aside></div>
    </Page></div>;
}
