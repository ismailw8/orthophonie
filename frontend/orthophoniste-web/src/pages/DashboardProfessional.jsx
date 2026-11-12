import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Alert, Card, Empty, Page, PageHeader, primaryClass, secondaryClass } from '../components/PageUI';
import { AppointmentSummary, Metric, ProgressBar, ResourceState } from '../components/WorkspaceUI';
import axios from '../api/axios';
import { fetchPatientAppointments } from '../api/workspace';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { useAuth } from '../context/AuthContext';
import { axisPercent, formatDate, nextAppointment, percent } from '../utils/workflow';
import { downloadPatientPdf } from '../utils/patientPdf';

const fetchDashboard = async signal => { const { data } = await axios.get('/api/suivi/mon-dashboard', { signal }); return data; };
export default function DashboardProfessional() {
    const { user } = useAuth();
    const dashboard = useLoadableResource(fetchDashboard);
    const rdvs = useLoadableResource(fetchPatientAppointments, { initialData: [] });
    const [error, setError] = useState(''); const [exporting, setExporting] = useState(false);
    const bilan = dashboard.data?.bilan; const upcoming = nextAppointment(rdvs.data);
    const sessions = (dashboard.data?.prochainesSeances || []).filter(item => new Date(item.dateSeance) >= new Date()).sort((a, b) => String(a.dateSeance).localeCompare(String(b.dateSeance)));
    const pending = rdvs.data.filter(item => item.status === 'EN_ATTENTE').length;
    const exportFile = async () => { setError(''); setExporting(true); try { const { data } = await axios.get('/api/rdv/patient/mes-rendez-vous'); downloadPatientPdf({ user, dashboard: dashboard.data, appointments: data }); } catch { setError('Le dossier PDF n’a pas pu être généré. Réessayez dans quelques instants.'); } finally { setExporting(false); } };
    return <div className="min-h-screen bg-slate-50"><Navbar/><Page>
        <PageHeader title={`Bonjour ${user?.firstName || ''}`} action={<Link to="/rendez-vous" className={primaryClass}>Demander un rendez-vous</Link>}>Retrouvez votre prochain rendez-vous et les étapes de votre suivi.</PageHeader>
        <Card className="mb-6 border-sky-200 p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><h2 className="text-lg font-semibold">Votre prochain rendez-vous</h2><Link to="/mes-rendez-vous" className="text-sm font-semibold text-sky-800">Tous mes rendez-vous →</Link></div><div className="mt-5"><ResourceState resource={rdvs}>{upcoming ? <AppointmentSummary appointment={upcoming}/> : <p className="text-sm text-slate-600">Vous n’avez pas de rendez-vous confirmé à venir.</p>}{pending > 0 && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{pending} demande(s) en attente de confirmation par le cabinet.</p>}</ResourceState></div></Card>
        {error && <div className="mb-5"><Alert>{error}</Alert></div>}
        <ResourceState resource={dashboard}>{!bilan ? <Card className="p-8"><h2 className="text-lg font-semibold">Votre suivi sera disponible ici</h2><p className="mt-3 text-sm text-slate-600">Le cabinet n’a pas encore créé votre bilan. Vos rendez-vous restent accessibles.</p><Link to="/mes-rendez-vous" className={`${secondaryClass} mt-5`}>Consulter mes rendez-vous</Link></Card> : <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3"><Metric label="Séances effectuées" value={dashboard.data.seancesEffectuees ?? 0}/><Metric label="Séances enregistrées" value={dashboard.data.seancesPrevues ?? 0}/><Metric label="Progression globale" value={`${percent(dashboard.data.progressionGlobale)} %`} detail="Progression renseignée par le cabinet"/></div>
            <div className="grid items-start gap-6 lg:grid-cols-2"><Card className="p-6"><h2 className="mb-6 text-lg font-semibold">Prochaines séances</h2>{!sessions.length ? <Empty>Aucune séance à venir pour le moment.</Empty> : <ul className="divide-y divide-slate-200">{sessions.slice(0, 5).map(item => <li key={item.id} className="py-4"><h3 className="font-semibold">{item.titre}</h3><p className="mt-2 text-sm text-slate-600">{formatDate(item.dateSeance)}</p>{item.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>}</li>)}</ul>}</Card>
                <Card className="p-6"><h2 className="mb-6 text-lg font-semibold">Objectifs de votre suivi</h2>{!bilan.axes?.length ? <Empty>Aucun objectif renseigné.</Empty> : <div className="space-y-6">{bilan.axes.map((axis, index) => <div key={index}><ProgressBar label={axis.nom || axis.titre || 'Objectif'} value={axisPercent(axis)}/>{axis.commentaire && <p className="mt-2 text-sm text-slate-600">{axis.commentaire}</p>}</div>)}</div>}</Card>
            </div>
            <Card className="mt-6 p-6"><h2 className="text-lg font-semibold">Note du cabinet</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{bilan.remarques || 'Aucune note pour le moment.'}</p><p className="mt-5 text-xs text-slate-500">Bilan mis à jour le {formatDate(bilan.updatedAt)}</p></Card>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-slate-500">Vous pouvez conserver une copie de votre dossier.</p><button disabled={exporting} onClick={exportFile} className={secondaryClass}>{exporting ? 'Préparation…' : 'Télécharger mon dossier PDF'}</button></div>
        </>}</ResourceState>
    </Page></div>;
}
