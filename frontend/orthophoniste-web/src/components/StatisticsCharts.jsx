import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Empty } from './PageUI';

export const statusColors = { EN_ATTENTE: '#d97706', CONFIRME: '#0369a1', ANNULE: '#dc2626', TERMINE: '#059669' };
export const appointmentColor = '#075985';
export const sessionColor = '#0f766e';

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const title = payload[0].payload.fullLabel || payload[0].payload.label || label;
    return <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg"><p className="mb-2 font-semibold capitalize text-slate-900">{title}</p>{payload.map(item => <p key={item.dataKey} className="flex items-center justify-between gap-6 text-slate-600"><span>{item.name}</span><strong className="tabular-nums text-slate-950">{item.value}</strong></p>)}</div>;
}

export function StatusChart({ rows, total }) {
    if (!total) return <Empty>Aucun rendez-vous sur cette période.</Empty>;
    return <div role="img" aria-label={`Répartition de ${total} rendez-vous par statut. Les valeurs sont détaillées dans le tableau adjacent.`} className="relative mx-auto h-64 w-full max-w-xs">
        <ResponsiveContainer width="100%" height={256} minWidth={0}>
            <PieChart accessibilityLayer>
                <Pie data={rows.filter(row => row.count > 0)} dataKey="count" nameKey="label" innerRadius="65%" outerRadius="88%" paddingAngle={3} stroke="#ffffff" strokeWidth={3} isAnimationActive={false}>
                    {rows.filter(row => row.count > 0).map(row => <Cell key={row.status} fill={statusColors[row.status]}/>)}</Pie>
                <Tooltip content={<ChartTooltip/>}/>
            </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true"><strong className="text-4xl font-semibold tabular-nums text-slate-950">{total}</strong><span className="mt-1 text-xs text-slate-500">rendez-vous</span></div>
    </div>;
}

export function ActivityChart({ rows, granularity }) {
    if (!rows.some(row => row.appointments || row.sessions)) return <Empty>Aucune activité enregistrée sur cette période.</Empty>;
    return <div role="img" aria-label={`Évolution des rendez-vous et des séances par ${granularity === 'day' ? 'jour' : granularity === 'month' ? 'mois' : 'année'}. Les valeurs sont détaillées dans le tableau d’activité.`} className="h-80 min-w-0">
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
            <BarChart data={rows} accessibilityLayer margin={{ top: 16, right: 12, left: -15, bottom: 8 }} barGap={3}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3"/>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} minTickGap={24} tickMargin={12}/>
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={48}/>
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip/>}/>
                <Bar dataKey="appointments" name="Rendez-vous" fill={appointmentColor} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}/>
                <Bar dataKey="sessions" name="Séances" fill={sessionColor} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}/>
            </BarChart>
        </ResponsiveContainer>
    </div>;
}

export function SessionsChart({ rows, total }) {
    if (!total) return <Empty>Aucune séance enregistrée sur cette période.</Empty>;
    return <div role="img" aria-label={`${rows[0].count} séances effectuées et ${rows[1].count} séances à effectuer. Les valeurs sont détaillées dans le tableau des séances.`} className="h-44 min-w-0">
        <ResponsiveContainer width="100%" height={176} minWidth={0}>
            <BarChart data={rows} layout="vertical" accessibilityLayer margin={{ top: 4, right: 35, bottom: 4, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3"/>
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }}/>
                <YAxis type="category" dataKey="label" width={88} axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12 }}/>
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip/>}/>
                <Bar dataKey="count" name="Séances" radius={[0, 5, 5, 0]} barSize={22} isAnimationActive={false}>
                    {rows.map(row => <Cell key={row.key} fill={row.key === 'completed' ? '#059669' : '#64748b'}/>)}
                    <LabelList dataKey="count" position="right" fill="#334155" fontSize={12}/>
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>;
}
