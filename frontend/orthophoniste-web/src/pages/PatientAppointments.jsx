import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from '../api/axios';
import { fetchPatientAppointments } from '../api/workspace';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { Alert, Card, Page, PageHeader, primaryClass, secondaryClass } from '../components/PageUI';
import { AppointmentSummary, Modal, ResourceState } from '../components/WorkspaceUI';
import { appointmentDate } from '../utils/workflow';

export default function PatientAppointments() {
    const resource = useLoadableResource(fetchPatientAppointments, { initialData: [] });
    const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [selected, setSelected] = useState(null); const [busy, setBusy] = useState(false); const [filter, setFilter] = useState('actifs');
    const shown = resource.data.filter(item => filter === 'tous' || (filter === 'actifs' ? ['CONFIRME', 'EN_ATTENTE'].includes(item.status) : ['TERMINE', 'ANNULE'].includes(item.status))).sort((a, b) => appointmentDate(a).localeCompare(appointmentDate(b)));
    const cancel = async () => {
        setBusy(true); setError(''); setSuccess('');
        try { const id = selected.id; await axios.put(`/api/rdv/patient/${id}/annuler`); resource.setData(items => items.map(item => item.id === id ? { ...item, status: 'ANNULE' } : item)); setSelected(null); setSuccess('Rendez-vous annulé.'); await resource.reload(); }
        catch (err) { setError(err.response?.data?.message || 'L’annulation n’a pas pu être confirmée. Vérifiez l’état du rendez-vous avant de réessayer.'); }
        finally { setBusy(false); }
    };
    return <div className="min-h-screen bg-slate-50"><Navbar/><Page width="max-w-5xl">
        <PageHeader title="Mes rendez-vous" action={<Link to="/rendez-vous" className={primaryClass}>Nouvelle demande</Link>}>Une demande devient un rendez-vous confirmé après validation par le cabinet.</PageHeader>
        {error && <div className="mb-5"><Alert>{error}</Alert></div>}{success && <div className="mb-5"><Alert type="success">{success}</Alert></div>}
        <div className="mb-6 flex flex-wrap gap-2" aria-label="Filtrer mes rendez-vous">{[['actifs', 'Demandes et rendez-vous actifs'], ['historique', 'Historique'], ['tous', 'Tous']].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? primaryClass : secondaryClass}>{label}</button>)}</div>
        <ResourceState resource={resource} empty={!shown.length} emptyText={resource.data.length ? 'Aucun rendez-vous dans cette catégorie.' : 'Aucun rendez-vous enregistré. Votre prochaine demande apparaîtra ici.'}><div className="space-y-4">{shown.map(item => <Card key={item.id} className="p-6"><div className="flex flex-col items-start justify-between gap-5 sm:flex-row"><div><AppointmentSummary appointment={item}/>{item.status === 'EN_ATTENTE' && <p className="mt-3 text-sm text-amber-800">Le créneau souhaité attend la confirmation du cabinet.</p>}<p className="mt-3 text-sm text-slate-600">{item.motif || 'Consultation orthophonique'}</p>{item.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">Note du cabinet : {item.notes}</p>}</div>{['EN_ATTENTE', 'CONFIRME'].includes(item.status) && <button disabled={busy} onClick={() => { setError(''); setSelected(item); }} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">Annuler</button>}</div></Card>)}</div></ResourceState>
        {selected && <Modal title="Annuler ce rendez-vous ?" onClose={() => setSelected(null)} busy={busy}><AppointmentSummary appointment={selected}/><p className="mt-5 text-sm text-slate-600">Ce rendez-vous sera annulé et le créneau sera libéré.</p>{error && <div className="mt-4"><Alert>{error}</Alert></div>}<div className="mt-6 flex flex-wrap justify-end gap-3"><button disabled={busy} onClick={() => setSelected(null)} className={secondaryClass}>Conserver le rendez-vous</button><button disabled={busy} onClick={cancel} className="rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Annulation…' : 'Confirmer l’annulation'}</button></div></Modal>}
    </Page></div>;
}
