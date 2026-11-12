import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Card, Page, PageHeader, inputClass } from '../components/PageUI';
import { Metric, ResourceState } from '../components/WorkspaceUI';
import { ActivityChart, SessionsChart, StatusChart, appointmentColor, sessionColor } from '../components/StatisticsCharts';
import { ActivityTable, BreakdownTable } from '../components/StatisticsTables';
import { useLoadableResource } from '../hooks/useLoadableResource';
import { fetchAppointments, fetchBilans, fetchSessions } from '../api/workspace';
import { appointmentDate, formatDate, inRange, periodRange, statusCounts } from '../utils/workflow';
import { activityReport, appointmentBreakdown, sessionBreakdown, share } from '../utils/statistics';

const periods = [['week', 'Cette semaine'], ['month', 'Ce mois'], ['all', 'Tout l’historique'], ['custom', 'Personnalisée']];
const granularityLabels = { day: 'Regroupement par jour.', month: 'Regroupement par mois.', year: 'Regroupement par année.' };

function PanelHeader({ title, description, context }) {
    return <header className="mb-6"><h2 className="text-xl font-semibold leading-7 tracking-tight text-slate-950">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{description}</p>{context && <p className="mt-2 text-sm leading-6 text-slate-600">{context}</p>}</header>;
}
function SeriesLegend() {
    return <div className="mb-4 flex flex-wrap gap-5 text-xs font-medium text-slate-600">{[['Rendez-vous', appointmentColor], ['Séances', sessionColor]].map(([label, color]) => <span key={label} className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }}/>{label}</span>)}</div>;
}

export default function StatisticsProfessional() {
    const rdvs = useLoadableResource(fetchAppointments, { initialData: [] });
    const bilans = useLoadableResource(fetchBilans, { initialData: [] });
    const sessions = useLoadableResource(fetchSessions, { initialData: [] });
    const [period, setPeriod] = useState('month');
    const [custom, setCustom] = useState({ from: '', to: '' });
    const range = period === 'custom' ? custom : periodRange(period);
    const invalid = period === 'custom' && (!range.from || !range.to || range.from > range.to);
    const filtered = useMemo(() => invalid ? [] : rdvs.data.filter(item => inRange(appointmentDate(item), range.from, range.to)), [rdvs.data, invalid, range.from, range.to]);
    const selectedSessions = useMemo(() => invalid ? [] : sessions.data.filter(item => inRange(item.dateSeance, range.from, range.to)), [sessions.data, invalid, range.from, range.to]);
    const counts = statusCounts(filtered);
    const statuses = appointmentBreakdown(filtered);
    const sessionRows = sessionBreakdown(selectedSessions);
    const report = useMemo(() => invalid ? { rows: [], granularity: 'day' } : activityReport(filtered, selectedSessions, { from: range.from, to: range.to }), [filtered, selectedSessions, invalid, range.from, range.to]);
    const trackedPatients = new Set(bilans.data.map(item => item.patientId || item.patientEmail).filter(Boolean)).size;
    const periodLabel = range.from && range.to ? `Du ${formatDate(range.from, false)} au ${formatDate(range.to, false)}` : 'Toutes les dates enregistrées';

    return <AdminLayout><Page width="max-w-7xl">
        <PageHeader title="Statistiques">Activité du cabinet : rendez-vous, séances et patients suivis.</PageHeader>
        <Card className="mb-7 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div><h2 id="statistics-period-title" className="text-xl font-semibold leading-7 text-slate-950">Période d’analyse</h2><p id="statistics-period-help" className="mt-2 max-w-md text-sm leading-6 text-slate-700">Sélectionnez une période pour actualiser les graphiques et les tableaux.</p></div><div role="group" className="flex flex-wrap gap-2" aria-labelledby="statistics-period-title" aria-describedby="statistics-period-help">{periods.map(([value, label]) => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)} className={`rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800 ${period === value ? 'border-sky-800 bg-sky-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{label}</button>)}</div></div>
            {period === 'custom' && <div className="mt-5 grid gap-4 sm:max-w-2xl sm:grid-cols-2"><label className="text-sm font-semibold">Du<input type="date" value={custom.from} onChange={event => setCustom({ ...custom, from: event.target.value })} className={`${inputClass} mt-2`}/></label><label className="text-sm font-semibold">Au<input type="date" min={custom.from} value={custom.to} onChange={event => setCustom({ ...custom, to: event.target.value })} className={`${inputClass} mt-2`}/></label></div>}
            <div className="mt-5 border-t border-slate-100 pt-4"><p role={invalid ? 'status' : undefined} className={`text-sm ${invalid ? 'text-amber-800' : 'font-medium text-slate-600'}`}>{invalid ? 'Choisissez une date de début et une date de fin valide pour afficher les résultats.' : periodLabel}</p></div>
        </Card>

        <ResourceState resource={rdvs}>{!invalid && <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Rendez-vous sur la période" value={filtered.length} detail="Toutes les demandes et tous les statuts"/>
            <Metric label="Rendez-vous terminés" value={counts.TERMINE} detail={filtered.length ? `${share(counts.TERMINE, filtered.length)} du total` : 'Aucun rendez-vous sur la période'}/>
            <Metric label="Rendez-vous annulés" value={counts.ANNULE} detail="Annulations enregistrées sur la période"/>
            <Metric label="Part des rendez-vous annulés" value={share(counts.ANNULE, filtered.length)} detail="Annulés / tous les rendez-vous"/>
        </div>}</ResourceState>

        {!invalid && <>
            <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.2fr]">
                <Card className="min-w-0 p-5 sm:p-6"><PanelHeader title="Répartition des rendez-vous" description="Quels statuts occupent la plus grande part de votre activité ?"/>
                    <ResourceState resource={rdvs}><StatusChart rows={statuses} total={filtered.length}/><div className="mt-4"><BreakdownTable rows={statuses} total={filtered.length} caption="Répartition des rendez-vous par statut" status/></div></ResourceState>
                </Card>
                <Card className="min-w-0 p-5 sm:p-6"><PanelHeader title="Évolution de l’activité" description="Comparez le nombre de rendez-vous et de séances au fil du temps." context={granularityLabels[report.granularity]}/>
                    <ResourceState resource={rdvs}><ResourceState resource={sessions}><SeriesLegend/><ActivityChart rows={report.rows} granularity={report.granularity}/><p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">Chaque barre représente un nombre d’événements. Les périodes sans activité restent visibles ; le regroupement s’adapte à la durée sélectionnée.</p></ResourceState></ResourceState>
                </Card>
            </div>

            <Card className="mt-6 overflow-hidden"><div className="px-5 pt-6 sm:px-6"><PanelHeader title="Activité détaillée" description="Les chiffres exacts du graphique, avec le détail des rendez-vous et des séances." context={granularityLabels[report.granularity]}/></div>
                <ResourceState resource={rdvs}><ResourceState resource={sessions}><ActivityTable key={`${period}-${range.from}-${range.to}-${report.granularity}`} rows={report.rows}/></ResourceState></ResourceState>
            </Card>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
                <Card className="min-w-0 p-5 sm:p-6"><PanelHeader title="État des séances" description="Distinguez les séances effectuées de celles restant à effectuer." context="Ces résultats correspondent à la période sélectionnée."/>
                    <ResourceState resource={sessions}><SessionsChart rows={sessionRows} total={selectedSessions.length}/><div className="mt-4"><BreakdownTable rows={sessionRows} total={selectedSessions.length} caption="Répartition des séances par état"/></div><p className="mt-4 text-sm leading-6 text-slate-600">« À effectuer » comprend toutes les séances non marquées comme effectuées, y compris celles dont la date est passée.</p></ResourceState>
                </Card>
                <Card className="p-5 sm:p-6"><PanelHeader title="Suivi du cabinet" description="Les patients qui disposent actuellement d’un bilan." context="Situation actuelle, indépendante de la période sélectionnée."/>
                    <ResourceState resource={bilans}><dl><div className="border-b border-slate-200 pb-5"><dt className="text-sm font-medium text-slate-700">Patients suivis actuellement</dt><dd className="mt-3 text-4xl font-semibold tabular-nums text-slate-950">{trackedPatients}</dd><dd className="mt-2 text-sm leading-6 text-slate-600">Patients distincts avec au moins un bilan enregistré.</dd></div><div className="mt-5 flex items-center justify-between gap-3 text-sm"><dt className="text-slate-700">Bilans enregistrés</dt><dd className="font-semibold tabular-nums text-slate-950">{bilans.data.length}</dd></div></dl></ResourceState>
                </Card>
            </div>
        </>}

        <aside aria-labelledby="statistics-reading-title" className="mt-8 border-t border-slate-300 pt-6"><h2 id="statistics-reading-title" className="text-xl font-semibold leading-7 text-slate-950">Comment lire ces statistiques ?</h2><div className="mt-3 max-w-3xl space-y-3 text-sm leading-7 text-slate-700"><p>Un rendez-vous est compté à sa date confirmée. Si le cabinet ne l’a pas encore confirmé, la date souhaitée est utilisée. Les statuts affichés sont les statuts actuels des rendez-vous.</p><p>Les séances sont comptées à leur date planifiée. Un rendez-vous et une séance restent deux événements distincts ; les graphiques les présentent séparément.</p><p>La colonne « Part » indique le pourcentage de chaque statut dans le total de la période. Le total du tableau d’activité porte sur toute la période, même lorsque le tableau affiche plusieurs pages.</p></div></aside>
    </Page></AdminLayout>;
}
