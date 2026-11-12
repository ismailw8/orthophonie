import { useState } from 'react';
import axios from '../api/axios';
import { Alert, inputClass, primaryClass, secondaryClass } from './PageUI';
import { AppointmentSummary, Modal } from './WorkspaceUI';
import { appointmentDate, patientName } from '../utils/workflow';

function ActionDialog({ appointment, kind, onClose, onUpdated }) {
    const [form, setForm] = useState({ dateConfirmee: appointmentDate(appointment).slice(0, 16), notes: appointment.notes || '' });
    const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    const title = { confirmer: 'Confirmer le rendez-vous', annuler: 'Annuler le rendez-vous', terminer: 'Terminer le rendez-vous' }[kind];
    const submit = async event => {
        event.preventDefault(); setBusy(true); setError('');
        try {
            await axios.put(`/api/rdv/admin/${appointment.id}/${kind}`, kind === 'confirmer' ? { ...form, dateConfirmee: `${form.dateConfirmee}:00` } : undefined);
            await onUpdated(); onClose();
        } catch (err) { setError(err.response?.data?.message || 'La réponse à cette action n’a pas pu être obtenue. Vérifiez l’état du rendez-vous avant de réessayer.'); }
        finally { setBusy(false); }
    };
    return <Modal title={title} onClose={onClose} busy={busy}><form onSubmit={submit}>
        <p className="mb-3 font-semibold">{patientName(appointment)}</p><AppointmentSummary appointment={appointment}/>
        {error && <div className="mt-4"><Alert>{error}</Alert></div>}
        {kind === 'confirmer' ? <><label className="mt-5 block text-sm font-semibold">Date et heure confirmées<input autoFocus required type="datetime-local" value={form.dateConfirmee} onChange={event => setForm({ ...form, dateConfirmee: event.target.value })} className={`${inputClass} mt-2`}/></label><label className="mt-4 block text-sm font-semibold">Note pour le patient<textarea rows="3" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className={`${inputClass} mt-2`}/></label></> : <p className="mt-5 text-sm text-slate-600">{kind === 'annuler' ? 'Ce rendez-vous sera annulé et son créneau sera libéré.' : 'Ce rendez-vous sera marqué comme terminé. Cette action ne modifie pas les séances du suivi.'}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className={secondaryClass}>Retour</button><button disabled={busy} className={kind === 'annuler' ? 'rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50' : primaryClass}>{busy ? 'Enregistrement…' : kind === 'confirmer' ? 'Confirmer' : kind === 'annuler' ? 'Confirmer l’annulation' : 'Marquer terminé'}</button></div>
    </form></Modal>;
}
export default function AppointmentActions({ appointment, onUpdated, initialOpen = false, onDismiss }) {
    const [kind, setKind] = useState(initialOpen && appointment.status === 'EN_ATTENTE' ? 'confirmer' : null);
    const close = () => { setKind(null); onDismiss?.(); };
    return <><div className="flex flex-wrap gap-2">
        {appointment.status === 'EN_ATTENTE' && <button onClick={() => setKind('confirmer')} className={primaryClass}>Confirmer</button>}
        {appointment.status === 'CONFIRME' && <button onClick={() => setKind('terminer')} className={secondaryClass}>Terminer</button>}
        {['EN_ATTENTE', 'CONFIRME'].includes(appointment.status) && <button onClick={() => setKind('annuler')} className="rounded-xl px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">Annuler</button>}
    </div>{kind && <ActionDialog appointment={appointment} kind={kind} onClose={close} onUpdated={onUpdated}/>}</>;
}
