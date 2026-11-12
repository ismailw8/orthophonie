import { appointmentDate, inRange, localDay, statusLabels } from './workflow.js';

export const share = (value, total) => total ? `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value / total * 100)} %` : '—';

export function appointmentBreakdown(appointments) {
    return Object.entries(statusLabels).map(([status, label]) => {
        const count = appointments.filter(item => item.status === status).length;
        return { status, label, count, share: share(count, appointments.length) };
    });
}

export function sessionBreakdown(sessions) {
    const completed = sessions.filter(item => item.effectuee).length;
    return [
        { key: 'completed', label: 'Effectuées', count: completed, share: share(completed, sessions.length) },
        { key: 'planned', label: 'À effectuer', count: sessions.length - completed, share: share(sessions.length - completed, sessions.length) },
    ];
}

const emptyRow = (key, granularity) => {
    const date = new Date(`${key.length === 4 ? `${key}-01-01` : key.length === 7 ? `${key}-01` : key}T12:00:00`);
    const options = granularity === 'day' ? { day: '2-digit', month: 'short' } : granularity === 'month' ? { month: 'short', year: 'numeric' } : { year: 'numeric' };
    const fullOptions = granularity === 'day' ? { day: 'numeric', month: 'long', year: 'numeric' } : granularity === 'month' ? { month: 'long', year: 'numeric' } : { year: 'numeric' };
    return { key, label: date.toLocaleDateString('fr-FR', options), fullLabel: date.toLocaleDateString('fr-FR', fullOptions), appointments: 0, confirmed: 0, completed: 0, cancelled: 0, sessions: 0, sessionsCompleted: 0 };
};

// Both the chart and the table use these rows, including periods with no events.
export function activityReport(appointments, sessions, { from = '', to = '' } = {}) {
    const rdvs = appointments.filter(item => inRange(appointmentDate(item), from, to));
    const selectedSessions = sessions.filter(item => inRange(item.dateSeance, from, to));
    const dates = [...rdvs.map(item => appointmentDate(item).slice(0, 10)), ...selectedSessions.map(item => item.dateSeance.slice(0, 10))].sort();
    const start = from || dates[0]; const end = to || dates[dates.length - 1];
    if (!start || !end || start > end) return { rows: [], granularity: 'day' };
    const length = (Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86_400_000 + 1;
    const months = (Number(end.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(end.slice(5, 7)) - Number(start.slice(5, 7)) + 1;
    const granularity = length <= 45 ? 'day' : months <= 36 ? 'month' : 'year';
    const keyLength = granularity === 'day' ? 10 : granularity === 'month' ? 7 : 4;
    const cursor = new Date(`${start}T12:00:00`);
    if (granularity !== 'day') cursor.setDate(1);
    if (granularity === 'year') cursor.setMonth(0);
    const rows = [];
    const endDate = new Date(`${end}T12:00:00`);
    while (cursor <= endDate) {
        rows.push(emptyRow(localDay(cursor).slice(0, keyLength), granularity));
        if (granularity === 'day') cursor.setDate(cursor.getDate() + 1);
        else if (granularity === 'month') cursor.setMonth(cursor.getMonth() + 1);
        else cursor.setFullYear(cursor.getFullYear() + 1);
    }
    const indexed = new Map(rows.map(row => [row.key, row]));
    rdvs.forEach(item => {
        const row = indexed.get(appointmentDate(item).slice(0, keyLength));
        if (!row) return;
        row.appointments++;
        if (item.status === 'CONFIRME') row.confirmed++;
        if (item.status === 'TERMINE') row.completed++;
        if (item.status === 'ANNULE') row.cancelled++;
    });
    selectedSessions.forEach(item => {
        const row = indexed.get(item.dateSeance.slice(0, keyLength));
        if (!row) return;
        row.sessions++;
        if (item.effectuee) row.sessionsCompleted++;
    });
    return { rows, granularity };
}

export function reportTotals(rows) {
    return rows.reduce((total, row) => Object.fromEntries(Object.entries(total).map(([key, value]) => [key, value + row[key]])), { appointments: 0, confirmed: 0, completed: 0, cancelled: 0, sessions: 0, sessionsCompleted: 0 });
}
