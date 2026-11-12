import { useState } from 'react';
import { Empty, secondaryClass } from './PageUI';
import { reportTotals } from '../utils/statistics';
import { statusColors } from './StatisticsCharts';

export function BreakdownTable({ rows, total, caption, status = false }) {
    return <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th scope="col" className="pb-3 pr-3 font-medium">Statut</th><th scope="col" className="pb-3 px-2 text-right font-medium">Nombre</th><th scope="col" className="pb-3 pl-2 text-right font-medium">Part</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.status || row.key}><th scope="row" className="py-4 pr-3 font-medium text-slate-700"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: status ? statusColors[row.status] : row.key === 'completed' ? '#059669' : '#64748b' }}/>{row.label}</span></th><td className="px-2 py-4 text-right font-semibold tabular-nums text-slate-950">{row.count}</td><td className="py-4 pl-2 text-right tabular-nums text-slate-600">{row.share}</td></tr>)}</tbody>
        <tfoot><tr className="border-t border-slate-200"><th scope="row" className="pt-4 font-semibold text-slate-950">Total</th><td className="px-2 pt-4 text-right font-semibold tabular-nums">{total}</td><td className="pt-4 text-right tabular-nums text-slate-600">{total ? '100 %' : '—'}</td></tr></tfoot>
    </table></div>;
}

export function ActivityTable({ rows }) {
    const [page, setPage] = useState(1);
    const pageSize = 8; const pages = Math.max(1, Math.ceil(rows.length / pageSize)); const currentPage = Math.min(page, pages);
    const displayed = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totals = reportTotals(rows);
    if (!totals.appointments && !totals.sessions) return <Empty>Aucune activité à détailler sur cette période.</Empty>;
    const cells = row => <><td className="px-4 py-4 text-right font-semibold tabular-nums text-sky-900">{row.appointments}</td><td className="px-4 py-4 text-right tabular-nums">{row.confirmed}</td><td className="px-4 py-4 text-right tabular-nums">{row.completed}</td><td className="px-4 py-4 text-right tabular-nums">{row.cancelled}</td><td className="px-4 py-4 text-right font-semibold tabular-nums text-teal-800">{row.sessions}</td><td className="px-4 py-4 text-right tabular-nums">{row.sessionsCompleted}</td></>;
    return <><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Activité détaillée sur la période</caption>
        <thead className="bg-slate-50"><tr className="border-y border-slate-200 text-xs text-slate-500"><th scope="col" className="px-5 py-4 font-semibold">Période</th>{['Rendez-vous', 'Confirmés', 'Terminés', 'Annulés', 'Séances', 'Séances effectuées'].map(label => <th key={label} scope="col" className="px-4 py-4 text-right font-semibold">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{displayed.map(row => <tr key={row.key} className="transition even:bg-slate-50/50 hover:bg-sky-50/50"><th scope="row" className="px-5 py-4 font-medium capitalize text-slate-700">{row.fullLabel}</th>{cells(row)}</tr>)}</tbody>
        <tfoot className="border-t-2 border-slate-200 bg-slate-50"><tr><th scope="row" className="px-5 py-4 font-semibold">Total de la période</th>{cells(totals)}</tr></tfoot>
    </table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4"><p className="text-xs text-slate-500" role="status">Lignes {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} sur {rows.length} · Page {currentPage} sur {pages}</p><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className={secondaryClass}>Précédent</button><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className={secondaryClass}>Suivant</button></div></div></>;
}
