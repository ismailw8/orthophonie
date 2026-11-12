import { useState } from 'react';
import axios from '../api/axios';
import { Alert, Card, inputClass, primaryClass, secondaryClass } from './PageUI';
import UnsavedDialog from './UnsavedDialog';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { patientName } from '../utils/workflow';

const initialForm = bilan => ({
    progressionGlobale: bilan?.progressionGlobale ?? 0,
    axes: (bilan?.axes || [{ nom: 'Articulation', pourcentage: 0, commentaire: '' }, { nom: 'Langage oral', pourcentage: 0, commentaire: '' }, { nom: 'Compréhension', pourcentage: 0, commentaire: '' }]).map(axis => ({ nom: axis.nom || '', pourcentage: axis.pourcentage ?? 0, commentaire: axis.commentaire || '' })),
    remarques: bilan?.remarques || '',
});
export default function BilanEditor({ patient, bilan, sessions, onSaved }) {
    const [form, setForm] = useState(() => initialForm(bilan));
    const [baseline, setBaseline] = useState(() => JSON.stringify(initialForm(bilan)));
    const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
    const dirty = JSON.stringify(form) !== baseline; const blocker = useUnsavedChanges(dirty || saving);
    const change = (field, value) => { setSuccess(''); setForm(current => ({ ...current, [field]: value })); };
    const axisChange = (index, field, value) => change('axes', form.axes.map((axis, position) => position === index ? { ...axis, [field]: value } : axis));
    const save = async event => {
        event.preventDefault(); setSaving(true); setError(''); setSuccess('');
        const payload = { patientId: patient.id, patientEmail: patient.email.trim().toLowerCase(), patientNom: patientName(patient), seancesPrevues: sessions.length, seancesEffectuees: sessions.filter(session => session.effectuee).length, progressionGlobale: Number(form.progressionGlobale), axes: form.axes.map(axis => ({ nom: axis.nom.trim(), pourcentage: Number(axis.pourcentage), commentaire: axis.commentaire.trim() })), remarques: form.remarques.trim() };
        try {
            const { data } = await axios.request({ method: bilan ? 'put' : 'post', url: '/api/suivi/admin/bilans', data: payload });
            const saved = initialForm(data); setForm(saved); setBaseline(JSON.stringify(saved)); setSuccess('Bilan enregistré.'); await onSaved();
        } catch (err) { setError(err.response?.data?.message || 'La sauvegarde n’a pas pu être confirmée. Vérifiez le bilan avant de réessayer.'); }
        finally { setSaving(false); }
    };
    return <><form onSubmit={save}>
        <Card className="p-5 sm:p-6"><h2 className="text-lg font-semibold">{bilan ? 'Modifier le bilan' : 'Créer le bilan'}</h2><p className="mt-2 text-sm text-slate-600">Les objectifs et la note du cabinet sont visibles dans l’espace patient.</p>
            {error && <div className="mt-5"><Alert>{error}</Alert></div>}{success && <div className="mt-5"><Alert type="success">{success}</Alert></div>}
            <fieldset disabled={saving} className="mt-6 space-y-6"><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">Progression globale (%)<input required type="number" min="0" max="100" value={form.progressionGlobale} onChange={event => change('progressionGlobale', event.target.value)} className={`${inputClass} mt-2`}/></label><div><p className="text-sm font-semibold">Séances effectuées</p><p className="mt-3 text-2xl font-semibold">{sessions.filter(session => session.effectuee).length}</p></div><div><p className="text-sm font-semibold">Séances enregistrées</p><p className="mt-3 text-2xl font-semibold">{sessions.length}</p></div></div><p className="text-xs text-slate-500">Les compteurs de séances sont calculés à partir des séances enregistrées.</p>
            <div><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Objectifs du suivi</h3><button type="button" onClick={() => change('axes', [...form.axes, { nom: '', pourcentage: 0, commentaire: '' }])} className={secondaryClass}>Ajouter un objectif</button></div><div className="mt-4 space-y-4">{form.axes.map((axis, index) => <div key={index} className="rounded-xl border border-slate-200 p-4"><div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]"><label className="text-sm font-semibold">Objectif<input required maxLength="200" value={axis.nom} onChange={event => axisChange(index, 'nom', event.target.value)} className={`${inputClass} mt-2`}/></label><label className="text-sm font-semibold">Progression (%)<input required type="number" min="0" max="100" value={axis.pourcentage} onChange={event => axisChange(index, 'pourcentage', event.target.value)} className={`${inputClass} mt-2`}/></label><button type="button" aria-label={`Retirer l’objectif ${axis.nom || index + 1}`} onClick={() => change('axes', form.axes.filter((_, position) => position !== index))} className="self-end rounded-xl px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">Retirer</button></div><label className="mt-3 block text-sm font-semibold">Commentaire<textarea rows="2" value={axis.commentaire} onChange={event => axisChange(index, 'commentaire', event.target.value)} className={`${inputClass} mt-2`}/></label></div>)}</div></div>
            <label className="block text-sm font-semibold">Note du cabinet<textarea rows="5" value={form.remarques} onChange={event => change('remarques', event.target.value)} className={`${inputClass} mt-2`}/></label></fieldset>
        </Card>
        <div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 backdrop-blur"><p className="text-sm text-slate-500" role="status">{dirty ? 'Modifications non enregistrées' : 'Bilan à jour'}</p><button disabled={saving || (!dirty && !!bilan)} className={primaryClass}>{saving ? 'Enregistrement…' : 'Enregistrer le bilan'}</button></div>
    </form><UnsavedDialog blocker={blocker} busy={saving}/></>;
}
