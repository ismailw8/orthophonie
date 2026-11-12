import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card, Page, PageHeader, primaryClass, secondaryClass } from '../components/PageUI';
import { AppointmentSummary, Metric, ResourceState } from '../components/WorkspaceUI';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { fetchAppointments, fetchPatients, fetchSessions } from '../api/workspace';
import { appointmentDate, formatDate, localDay, patientName } from '../utils/workflow';

export default function AdminOverview() {
    const rdvs = useLoadableResource(fetchAppointments, { initialData: [] });
    const patients = useLoadableResource(fetchPatients, { initialData: [] });
    const sessions = useLoadableResource(fetchSessions, { initialData: [] });
    const today = localDay();
    const todayAppointments = rdvs.data.filter(item => item.status === 'CONFIRME' && appointmentDate(item).slice(0, 10) === today).sort((a, b) => appointmentDate(a).localeCompare(appointmentDate(b)));
    const pending = rdvs.data.filter(item => item.status === 'EN_ATTENTE').sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    const upcoming = sessions.data.filter(item => !item.effectuee && new Date(item.dateSeance) >= new Date()).sort((a, b) => String(a.dateSeance).localeCompare(String(b.dateSeance)));
    const value = (resource, number) => resource.hasLoaded ? number : '—';
    return <AdminLayout><Page>
        <PageHeader title="Tableau de bord" action={<Link to="/admin/agenda" className={primaryClass}>Ouvrir l’agenda</Link>}>Votre journée et les demandes à traiter — {formatDate(today, false)}.</PageHeader>
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Rendez-vous aujourd’hui" value={value(rdvs, todayAppointments.length)} to={`/admin/agenda?date=${today}`} detail="Rendez-vous confirmés"/>
            <Metric label="Demandes à confirmer" value={value(rdvs, pending.length)} to="/admin/agenda?statut=EN_ATTENTE"/>
            <Metric label="Séances à venir" value={value(sessions, upcoming.length)} to={`/admin/agenda?type=seances&du=${today}`}/>
            <Metric label="Patients du cabinet" value={value(patients, patients.data.length)} to="/admin/patients"/>
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-2">
            <Card className="p-5"><h2 className="mb-5 text-lg font-semibold">Rendez-vous du jour</h2><ResourceState resource={rdvs} empty={!todayAppointments.length} emptyText="Aucun rendez-vous confirmé aujourd’hui."><div className="divide-y divide-slate-200">{todayAppointments.map(item => <div key={item.id} className="py-4"><p className="mb-2 text-sm text-slate-600">{patientName(item)}</p><AppointmentSummary appointment={item}/></div>)}</div></ResourceState></Card>
            <Card className="p-5"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Demandes à confirmer</h2><Link to="/admin/agenda?statut=EN_ATTENTE" className="text-sm font-semibold text-sky-800">Voir toutes</Link></div><ResourceState resource={rdvs} empty={!pending.length} emptyText="Toutes les demandes ont été traitées."><div className="divide-y divide-slate-200">{pending.slice(0, 4).map(item => <Link key={item.id} to={`/admin/agenda?statut=EN_ATTENTE&rdv=${item.id}`} className="block rounded-lg py-4 hover:bg-slate-50"><p className="mb-2 text-sm text-slate-600">{patientName(item)}</p><AppointmentSummary appointment={item}/><span className="mt-3 block text-sm font-semibold text-sky-800">Traiter la demande →</span></Link>)}</div></ResourceState></Card>
            <Card className="p-5"><h2 className="mb-5 text-lg font-semibold">Prochaines séances</h2><ResourceState resource={sessions} empty={!upcoming.length} emptyText="Aucune séance à venir."><ul className="divide-y divide-slate-200">{upcoming.slice(0, 5).map(item => <li key={item.id} className="py-4"><Link to={`/admin/patients/${item.patientId}?onglet=seances`} className="font-semibold text-sky-800">{item.titre}</Link><p className="mt-1 text-sm">{formatDate(item.dateSeance)}</p><p className="mt-1 break-all text-xs text-slate-500">{patients.data.find(patient => patient.id === item.patientId) ? patientName(patients.data.find(patient => patient.id === item.patientId)) : item.patientEmail}</p></li>)}</ul></ResourceState></Card>
            <Card className="p-5"><h2 className="mb-5 text-lg font-semibold">Patients et accès rapides</h2><ResourceState resource={patients}><p className="mb-5 text-sm text-slate-600">Retrouvez un dossier, créez un compte ou préparez un bilan.</p><div className="flex flex-wrap gap-3"><Link to="/admin/patients" className={primaryClass}>Rechercher un patient</Link><Link to="/admin/comptes-patients" className={secondaryClass}>Nouveau patient</Link><Link to="/admin/bilans" className={secondaryClass}>Consulter les suivis</Link></div></ResourceState></Card>
        </div>
    </Page></AdminLayout>;
}
