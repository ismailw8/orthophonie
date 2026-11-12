import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, LoadError, Spinner, secondaryClass } from './PageUI';
import { appointmentDate, calendarDays, formatDate, percent, requestedDate, statusLabels } from '../utils/workflow';

export function Metric({ label, value, to, detail }) {
  const content = <><p className="text-sm text-slate-600">{label}</p><strong className="mt-2 block text-3xl text-slate-950">{value}</strong>{detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}</>;
  return <Card>{to ? <Link to={to} className="block rounded-2xl p-5 hover:bg-sky-50">{content}<span className="mt-4 block text-sm font-semibold text-sky-800">Consulter →</span></Link> : <div className="p-5">{content}</div>}</Card>;
}
export function ResourceState({ resource, children, empty = false, emptyText = 'Aucun élément enregistré.' }) {
  return <><LoadError error={resource.error} onRetry={resource.reload} loading={resource.loading}/>{resource.loading && !resource.hasLoaded ? <Spinner/> : resource.hasLoaded ? <>{resource.loading && <p role="status" className="my-3 text-sm text-slate-500">Actualisation…</p>}{empty ? <Empty>{emptyText}</Empty> : children}</> : null}</>;
}
export function StatusBadge({ status }) {
  const colors = { EN_ATTENTE: 'border-amber-200 bg-amber-50 text-amber-800', CONFIRME: 'border-sky-200 bg-sky-50 text-sky-800', ANNULE: 'border-red-200 bg-red-50 text-red-700', TERMINE: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{statusLabels[status] || status}</span>;
}
export function ProgressBar({ value, label = 'Progression' }) {
  return <div><div className="mb-2 flex justify-between gap-3 text-sm"><span>{label}</span><strong>{percent(value)} %</strong></div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent(value)} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-800" style={{ width: `${percent(value)}%` }}/></div></div>;
}
export function AppointmentSummary({ appointment }) {
  return <><p className="font-semibold">{formatDate(appointmentDate(appointment))}</p><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={appointment.status}/><span className="text-xs text-slate-500">{appointment.dateConfirmee ? 'Date confirmée par le cabinet' : 'Date souhaitée'}</span></div>{appointment.dateConfirmee && appointmentDate(appointment).slice(0, 16) !== requestedDate(appointment).slice(0, 16) && <p className="mt-2 text-xs text-slate-500">Demande initiale : {formatDate(requestedDate(appointment))}</p>}</>;
}
export function Modal({ title, children, onClose, busy = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/40"><div className="mb-5 flex items-start justify-between gap-4"><h2 id={titleId} className="text-xl font-semibold">{title}</h2><button type="button" aria-label="Fermer la fenêtre" disabled={busy} onClick={onClose} className="rounded-lg px-3 py-1 text-lg">×</button></div>{children}</dialog>;
}
export function Calendar({ month, onMonthChange, selected, onSelect, events, unavailable = [] }) {
  // Days are calculated locally: changing the system timezone must not shift a booking date.
  const first = new Date(`${month}-01T12:00:00`);
  const days = calendarDays(month);
  const move = offset => { const date = new Date(first); date.setMonth(date.getMonth() + offset); onMonthChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`); };
  return <Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4"><button className={secondaryClass} aria-label="Mois précédent" onClick={() => move(-1)}>←</button><h2 className="font-semibold capitalize">{first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2><button className={secondaryClass} aria-label="Mois suivant" onClick={() => move(1)}>→</button></div><div className="overflow-x-auto"><div className="min-w-[560px]"><div className="grid grid-cols-7 bg-slate-50">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <span key={day} className="p-3 text-center text-xs font-semibold text-slate-500">{day}</span>)}</div><div className="grid grid-cols-7">{days.map(day => {
    const items = events.filter(event => String(event.date).slice(0, 10) === day);
    const blocked = unavailable.some(item => day >= item.dateDebut.slice(0, 10) && day <= item.dateFin.slice(0, 10));
    return <button key={day} onClick={() => onSelect(day)} aria-pressed={selected === day} aria-label={`${formatDate(day, false)}, ${items.length} événement(s)${blocked ? ', cabinet indisponible' : ''}`} className={`min-h-28 border-t border-r border-slate-200 p-2 text-left align-top ${selected === day ? 'bg-sky-50 ring-2 ring-inset ring-sky-700' : 'hover:bg-slate-50'} ${day.slice(0, 7) !== month ? 'text-slate-400' : 'text-slate-900'}`}><span className="text-sm font-semibold">{Number(day.slice(8))}</span>{blocked && <span className="mt-1 block rounded bg-amber-100 px-1 text-[11px] text-amber-900">Indisponible</span>}{items.slice(0, 2).map(item => <span key={item.key} className="mt-1 block truncate rounded bg-sky-100 px-1 py-0.5 text-[11px] text-sky-900">{String(item.date).slice(11, 16)} {item.label}</span>)}{items.length > 2 && <span className="mt-1 block text-xs">+ {items.length - 2} événement(s)</span>}</button>;
  })}</div></div></div></Card>;
}
