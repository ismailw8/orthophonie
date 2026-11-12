import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card, LoadError, Page, PageHeader, inputClass, primaryClass } from '../components/PageUI';
import { ResourceState } from '../components/WorkspaceUI';
import { fetchBilans, fetchPatients } from '../api/workspace';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { patientName } from '../utils/workflow';

export default function AdminPatients() {
    const patients = useLoadableResource(fetchPatients, { initialData: [] });
    const bilans = useLoadableResource(fetchBilans, { initialData: [] });
    const [search, setSearch] = useState(''); const [filter, setFilter] = useState('tous');
    const shown = patients.data.filter(patient => `${patientName(patient)} ${patient.email} ${patient.phone || ''}`.toLowerCase().includes(search.trim().toLowerCase()) && (filter === 'tous' || bilans.hasLoaded && (bilans.data.some(bilan => bilan.patientId === patient.id) === (filter === 'suivis')))).sort((a, b) => patientName(a).localeCompare(patientName(b), 'fr'));
    return <AdminLayout><Page><PageHeader title="Patients" action={<Link to="/admin/comptes-patients" className={primaryClass}>Nouveau patient</Link>}>Recherchez un patient et ouvrez son dossier complet.</PageHeader>
        <LoadError error={bilans.error} onRetry={bilans.reload} loading={bilans.loading}/>
        <Card className="mb-6 p-4"><div className="grid gap-4 sm:grid-cols-[1fr_240px]"><label className="text-sm font-semibold">Rechercher<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom, e-mail ou téléphone" className={`${inputClass} mt-2`}/></label><label className="text-sm font-semibold">Suivi<select disabled={!bilans.hasLoaded} value={filter} onChange={event => setFilter(event.target.value)} className={`${inputClass} mt-2`}><option value="tous">Tous les patients</option><option value="suivis">Avec un bilan</option><option value="sans">Sans bilan</option></select></label></div></Card>
        <Card><ResourceState resource={patients} empty={!shown.length} emptyText={patients.data.length ? 'Aucun patient ne correspond à cette recherche.' : 'Aucun patient enregistré. Créez un premier compte.'}><ul className="divide-y divide-slate-200">{shown.map(patient => {
            const bilan = bilans.data.find(item => item.patientId === patient.id);
            return <li key={patient.id}><Link to={`/admin/patients/${patient.id}`} className="flex flex-col justify-between gap-4 p-5 hover:bg-slate-50 sm:flex-row sm:items-center"><div><h2 className="font-semibold">{patientName(patient)}</h2><p className="mt-1 break-all text-sm text-slate-500">{patient.email}</p>{patient.phone && <p className="mt-1 text-sm text-slate-500">{patient.phone}</p>}</div><div className="flex flex-wrap items-center gap-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{bilans.hasLoaded ? bilan ? 'Suivi ouvert' : 'Bilan à créer' : 'Suivi non chargé'}</span>{patient.enabled === false && <span className="text-xs text-amber-800">Compte désactivé</span>}<span className="text-sm font-semibold text-sky-800">Ouvrir le dossier →</span></div></Link></li>;
        })}</ul></ResourceState></Card>
    </Page></AdminLayout>;
}
