import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card, Page, PageHeader, inputClass, primaryClass } from '../components/PageUI';
import { ProgressBar, ResourceState } from '../components/WorkspaceUI';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { fetchBilans } from '../api/workspace';
import { formatDate } from '../utils/workflow';

export default function AdminBilansProfessional() {
    const resource = useLoadableResource(fetchBilans, { initialData: [] });
    const [search, setSearch] = useState('');
    const shown = resource.data.filter(item => `${item.patientNom} ${item.patientEmail}`.toLowerCase().includes(search.trim().toLowerCase()));
    return <AdminLayout><Page><PageHeader title="Bilans et suivis" action={<Link to="/admin/patients" className={primaryClass}>Choisir un patient</Link>}>Chaque bilan, ses objectifs et ses séances sont réunis dans le dossier patient.</PageHeader>
        <Card className="mb-6 p-4"><label className="text-sm font-semibold">Rechercher un suivi<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom ou e-mail du patient" className={`${inputClass} mt-2`}/></label></Card>
        <Card><ResourceState resource={resource} empty={!shown.length} emptyText={resource.data.length ? 'Aucun bilan ne correspond à cette recherche.' : 'Aucun bilan enregistré. Choisissez un patient pour créer son suivi.'}><ul className="divide-y divide-slate-200">{shown.map(item => <li key={item.id || item.patientId}><Link to={`/admin/patients/${item.patientId}?onglet=bilan`} className="grid gap-4 p-5 hover:bg-slate-50 sm:grid-cols-[1fr_200px_auto] sm:items-center"><div><h2 className="font-semibold">{item.patientNom}</h2><p className="mt-1 break-all text-sm text-slate-500">{item.patientEmail}</p><p className="mt-2 text-xs text-slate-500">Mis à jour le {formatDate(item.updatedAt)}</p></div><ProgressBar value={item.progressionGlobale}/><span className="text-sm font-semibold text-sky-800">Ouvrir le dossier →</span></Link></li>)}</ul></ResourceState></Card>
    </Page></AdminLayout>;
}
