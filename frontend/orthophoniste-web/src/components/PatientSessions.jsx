import { useState } from 'react';
import axios from '../api/axios';
import { Alert, Card, inputClass, primaryClass, secondaryClass } from './PageUI';
import { Modal, ResourceState } from './WorkspaceUI';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import UnsavedDialog from './UnsavedDialog';
import { formatDate, localDay } from '../utils/workflow';

const empty = { titre: '', dateSeance: '', description: '' };
export default function PatientSessions({ patient, resource, onUpdated }) {
    const [form, setForm] = useState(empty); const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
    const [selected, setSelected] = useState(null);
    const dirty = Object.values(form).some(value => value !== ''); const blocker = useUnsavedChanges(dirty || busy);
    const add = async event => {
        event.preventDefault(); setBusy(true); setError(''); setSuccess('');
        try {
            const { data } = await axios.post('/api/suivi/admin/seances', { patientId: patient.id, patientEmail: patient.email, titre: form.titre.trim(), description: form.description.trim(), dateSeance: `${form.dateSeance}:00` });
            resource.setData(items => [...items, data]); setForm(empty); setOpen(false); setSuccess('Séance ajoutée.'); await onUpdated();
        } catch (err) { setError(err.response?.data?.message || 'L’ajout n’a pas pu être confirmé. Vérifiez la liste des séances avant de réessayer.'); }
        finally { setBusy(false); }
    };
    const complete = async () => {
        setBusy(true); setError(''); setSuccess('');
        try {
            const { data } = await axios.put(`/api/suivi/admin/seances/${selected.id}/effectuee`);
            resource.setData(items => items.map(item => item.id === data.id ? data : item)); setSelected(null); setSuccess('Séance marquée comme effectuée.'); await onUpdated();
        } catch (err) { setError(err.response?.data?.message || 'La modification n’a pas pu être confirmée. Vérifiez la séance avant de réessayer.'); }
        finally { setBusy(false); }
    };
    const ordered = [...resource.data].sort((a, b) => Number(a.effectuee) - Number(b.effectuee) || String(a.dateSeance).localeCompare(String(b.dateSeance)));
    return <><Card className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Séances du patient</h2><button disabled={!resource.hasLoaded || busy} onClick={() => setOpen(true)} className={primaryClass}>Planifier une séance</button></div>
        {success && <div className="mt-5"><Alert type="success">{success}</Alert></div>}{error && <div className="mt-5"><Alert>{error}</Alert></div>}
        {open && <form onSubmit={add} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Titre<input autoFocus required maxLength="200" value={form.titre} onChange={event => setForm({ ...form, titre: event.target.value })} className={`${inputClass} mt-2`}/></label><label className="text-sm font-semibold">Date et heure<input required type="datetime-local" min={`${localDay()}T00:00`} value={form.dateSeance} onChange={event => setForm({ ...form, dateSeance: event.target.value })} className={`${inputClass} mt-2`}/></label><label className="text-sm font-semibold sm:col-span-2">Compte rendu visible par le patient<textarea rows="3" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className={`${inputClass} mt-2`}/></label><div className="flex flex-wrap justify-end gap-3 sm:col-span-2"><button type="button" onClick={() => { if (!dirty || window.confirm('Abandonner la saisie de cette séance ?')) { setForm(empty); setOpen(false); } }} className={secondaryClass}>Fermer</button><button className={primaryClass}>{busy ? 'Ajout…' : 'Ajouter la séance'}</button></div></fieldset></form>}
        <div className="mt-5"><ResourceState resource={resource} empty={!ordered.length} emptyText="Aucune séance enregistrée. Planifiez la première séance du patient."><ul className="divide-y divide-slate-200">{ordered.map(item => <li key={item.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.titre}</h3><p className="mt-1 text-sm text-slate-600">{formatDate(item.dateSeance)}</p><p className={`mt-2 text-xs font-semibold ${item.effectuee ? 'text-emerald-800' : 'text-sky-800'}`}>{item.effectuee ? 'Effectuée' : 'Planifiée'}</p>{!item.effectuee && new Date(item.dateSeance) < new Date() && <p className="mt-1 text-xs text-amber-800">Date passée — état à vérifier</p>}</div>{!item.effectuee && <button disabled={busy} onClick={() => setSelected(item)} className={secondaryClass}>Marquer effectuée</button>}</div>{item.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>}</li>)}</ul></ResourceState></div>
    </Card>{selected && <Modal title="Marquer la séance comme effectuée" onClose={() => setSelected(null)} busy={busy}><p className="font-semibold">{selected.titre}</p><p className="mt-2 text-sm text-slate-600">{formatDate(selected.dateSeance)}</p>{error && <div className="mt-4"><Alert>{error}</Alert></div>}<div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setSelected(null)} className={secondaryClass}>Retour</button><button disabled={busy} onClick={complete} className={primaryClass}>{busy ? 'Enregistrement…' : 'Confirmer'}</button></div></Modal>}<UnsavedDialog blocker={blocker} busy={busy}/></>;
}
