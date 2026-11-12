import test from 'node:test';
import assert from 'node:assert/strict';
import { activityReport, appointmentBreakdown, reportTotals, sessionBreakdown, share } from '../src/utils/statistics.js';

test('daily charts and tables use the confirmed date and include days without activity', () => {
    const report = activityReport([
        { dateSouhaitee: '2026-09-30', heureSouhaitee: '09:00', dateConfirmee: '2026-10-02T14:45:00', status: 'CONFIRME' },
        { dateSouhaitee: '2026-10-03', heureSouhaitee: '10:00', status: 'ANNULE' },
    ], [{ dateSeance: '2026-10-03T11:00:00', effectuee: true }], { from: '2026-10-01', to: '2026-10-03' });
    assert.equal(report.granularity, 'day');
    assert.equal(report.rows.length, 3);
    assert.equal(report.rows[0].appointments, 0);
    assert.equal(report.rows[1].confirmed, 1);
    assert.equal(report.rows[2].cancelled, 1);
    assert.equal(report.rows[2].sessionsCompleted, 1);
    assert.deepEqual(reportTotals(report.rows), { appointments: 2, confirmed: 1, completed: 0, cancelled: 1, sessions: 1, sessionsCompleted: 1 });
});

test('monthly reports preserve a month with zero activity between two busy months', () => {
    const report = activityReport([{ dateConfirmee: '2026-01-05T10:00:00', status: 'TERMINE' }], [{ dateSeance: '2026-03-20T11:00:00', effectuee: false }]);
    assert.equal(report.granularity, 'month');
    assert.deepEqual(report.rows.map(row => row.key), ['2026-01', '2026-02', '2026-03']);
    assert.equal(report.rows[1].appointments + report.rows[1].sessions, 0);
    assert.equal(report.rows[0].completed, 1);
    assert.equal(report.rows[2].sessions, 1);
});

test('long histories are grouped by year while retaining correct totals', () => {
    const report = activityReport([{ dateConfirmee: '2021-01-01T10:00:00', status: 'TERMINE' }, { dateConfirmee: '2026-10-09T10:00:00', status: 'CONFIRME' }], []);
    assert.equal(report.granularity, 'year');
    assert.equal(report.rows.length, 6);
    assert.equal(reportTotals(report.rows).appointments, 2);
    assert.equal(report.rows[1].appointments, 0);
});

test('partial months include only events inside the selected dates', () => {
    const report = activityReport([{ dateConfirmee: '2026-01-01T10:00:00', status: 'TERMINE' }, { dateConfirmee: '2026-01-15T10:00:00', status: 'CONFIRME' }], [{ dateSeance: '2026-03-31T10:00:00', effectuee: true }], { from: '2026-01-10', to: '2026-03-20' });
    assert.equal(report.granularity, 'month');
    assert.equal(reportTotals(report.rows).appointments, 1);
    assert.equal(reportTotals(report.rows).sessions, 0);
});

test('statut and session tables compute their percentages against their own totals', () => {
    const rows = appointmentBreakdown([{ status: 'CONFIRME' }, { status: 'CONFIRME' }, { status: 'ANNULE' }]);
    assert.equal(rows.find(row => row.status === 'CONFIRME').share, '66,7 %');
    assert.equal(rows.find(row => row.status === 'ANNULE').count, 1);
    assert.equal(rows.find(row => row.status === 'EN_ATTENTE').share, '0 %');
    const sessions = sessionBreakdown([{ effectuee: true }, { effectuee: false }]);
    assert.deepEqual(sessions.map(row => row.share), ['50 %', '50 %']);
    assert.equal(share(0, 0), '—');
});

test('empty and invalid periods never produce imaginary activity', () => {
    assert.deepEqual(activityReport([], []), { rows: [], granularity: 'day' });
    assert.deepEqual(activityReport([], [], { from: '2026-10-12', to: '2026-10-01' }).rows, []);
    const emptyPeriod = activityReport([], [], { from: '2026-10-01', to: '2026-10-07' });
    assert.equal(emptyPeriod.rows.length, 7);
    assert.equal(reportTotals(emptyPeriod.rows).appointments, 0);
    assert.equal(appointmentBreakdown([]).every(row => row.share === '—'), true);
});
