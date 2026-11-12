import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import BilanEditor from '../components/BilanEditor';
import PatientSessions from '../components/PatientSessions';
import AppointmentActions from '../components/AppointmentActions';
import { Card, Empty, Page, PageHeader, secondaryClass } from '../components/PageUI';
import { AppointmentSummary, Metric, ProgressBar, ResourceState } from '../components/WorkspaceUI';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { fetchAppointments, fetchBilans, fetchPatients, fetchPatientSessions } from '../api/workspace';
import { appointmentsForPatient, axisPercent, formatDate, nextAppointment, patientName } from '../utils/workflow';

const tabs = [['resume', 'Résumé'], ['bilan', 'Bilan'], ['seances', 'Séances'], ['rendez-vous', 'Rendez-vous']];
export default function AdminPatientFile() {
    const { patientId } = useParams(); const [params] = useSearchParams();
    const patients = useLoadableResource(fetchPatients, { initialData: [] });
    const bilans = useLoadableResource(fetchBilans, { initialData: [] });
    const rdvs = useLoadableResource(fetchAppointments, { initialData: [] });
    const sessionLoader = useMemo(() => fetchPatientSessions(patientId), [patientId]);
    const sessions = useLoadableResource(sessionLoader, { initialData: [] });
    const patient = patients.data.find(item => item.id === patientId);
    const bilan = bilans.data.find(item => item.patientId === patientId);
    const appointments = patient ? appointmentsForPatient(rdvs.data, patient).sort((a, b) => String(b.dateConfirmee || b.dateSouhaitee).localeCompare(String(a.dateConfirmee || a.dateSouhaitee))) : [];
    const upcoming = nextAppointment(appointments);
    const tab = tabs.some(([key]) => key === params.get('onglet')) ? params.get('onglet') : 'resume';
    const updated = async () => { await Promise.all([sessions.reload(), bilans.reload()]); };
    return <AdminLayout><Page><div className="mb-5"><Link to="/admin/patients" className="text-sm font-semibold text-sky-800">← Retour aux patients</Link></div>
        <ResourceState resource={patients}>
            {!patient ? <Card><Empty>Ce patient est introuvable. Retournez au répertoire pour choisir un compte existant.</Empty></Card> : <>
                <PageHeader title={patientName(patient)}><span className="break-all">{patient.email}</span>{patient.phone && <span> · {patient.phone}</span>}</PageHeader>
                <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3" aria-label="Rubriques du dossier patient">{tabs.map(([key, label]) => <Link key={key} to={`?onglet=${key}`} aria-current={tab === key ? 'page' : undefined} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold ${tab === key ? 'bg-sky-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{label}</Link>)}</nav>
                {tab === 'resume' && <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Séances effectuées" value={sessions.hasLoaded ? sessions.data.filter(item => item.effectuee).length : '—'} to="?onglet=seances"/><Metric label="Séances enregistrées" value={sessions.hasLoaded ? sessions.data.length : '—'} to="?onglet=seances"/><Metric label="Progression globale" value={bilans.hasLoaded ? bilan ? `${bilan.progressionGlobale} %` : 'Bilan à créer' : '—'} to="?onglet=bilan"/></div>
                    <div className="grid items-start gap-6 lg:grid-cols-2"><Card className="p-5"><h2 className="mb-5 font-semibold">Prochain rendez-vous confirmé</h2><ResourceState resource={rdvs}>{upcoming ? <AppointmentSummary appointment={upcoming}/> : <Empty>Aucun rendez-vous confirmé à venir.</Empty>}<Link to="?onglet=rendez-vous" className={`${secondaryClass} mt-4`}>Consulter les demandes</Link></ResourceState></Card>
                    <Card className="p-5"><h2 className="mb-5 font-semibold">Objectifs du suivi</h2><ResourceState resource={bilans}>{!bilan ? <><p className="text-sm text-slate-600">Le suivi ne dispose pas encore d’un bilan.</p><Link to="?onglet=bilan" className={`${secondaryClass} mt-4`}>Créer le bilan</Link></> : <div className="space-y-4">{(bilan.axes || []).map((axis, index) => <ProgressBar key={index} label={axis.nom} value={axisPercent(axis)}/>)}{!bilan.axes?.length && <Empty>Aucun objectif renseigné.</Empty>}<p className="text-xs text-slate-500">Dernière mise à jour : {formatDate(bilan.updatedAt)}</p></div>}</ResourceState></Card></div>
                    <Card className="p-5"><h2 className="mb-5 font-semibold">Dernières séances</h2><ResourceState resource={sessions} empty={!sessions.data.length} emptyText="Aucune séance enregistrée."><ul className="divide-y divide-slate-200">{[...sessions.data].sort((a, b) => String(b.dateSeance).localeCompare(String(a.dateSeance))).slice(0, 3).map(item => <li key={item.id} className="py-3"><strong className="text-sm">{item.titre}</strong><p className="mt-1 text-sm text-slate-600">{formatDate(item.dateSeance)} · {item.effectuee ? 'Effectuée' : 'Planifiée'}</p></li>)}</ul></ResourceState></Card>
                </div>}
                {tab === 'bilan' && <ResourceState resource={bilans}><ResourceState resource={sessions}><BilanEditor key={patientId} patient={patient} bilan={bilan} sessions={sessions.data} onSaved={bilans.reload}/></ResourceState></ResourceState>}
                {tab === 'seances' && <PatientSessions key={patientId} patient={patient} resource={sessions} onUpdated={updated}/>}
                {tab === 'rendez-vous' && <Card className="p-5"><h2 className="mb-5 text-lg font-semibold">Rendez-vous et demandes</h2><ResourceState resource={rdvs} empty={!appointments.length} emptyText="Aucun rendez-vous associé à l’e-mail de ce patient."><div className="divide-y divide-slate-200">{appointments.map(item => <article key={item.id} className="flex flex-col justify-between gap-4 py-5 sm:flex-row"><div><AppointmentSummary appointment={item}/>{item.motif && <p className="mt-3 text-sm text-slate-600">{item.motif}</p>}</div><AppointmentActions appointment={item} onUpdated={rdvs.reload}/></article>)}</div></ResourceState></Card>}
            </>}
        </ResourceState>
    </Page></AdminLayout>;
}
