import test from 'node:test';
import assert from 'node:assert/strict';
import { appointmentDate, appointmentsForPatient, axisPercent, calendarDays, formatDate, inRange, localDay, nextAppointment, periodRange, statusCounts } from '../src/utils/workflow.js';
import { createPatientPdfBlob } from '../src/utils/patientPdf.js';

test('a rescheduled appointment uses the confirmed date and time', () => {
  assert.equal(appointmentDate({ dateSouhaitee: '2026-10-12', heureSouhaitee: '09:00', dateConfirmee: '2026-10-22T14:45:00' }), '2026-10-22T14:45:00');
  assert.equal(appointmentDate({ dateSouhaitee: '2026-10-12', heureSouhaitee: '09:00' }), '2026-10-12T09:00');
});

test('the next appointment excludes pending, cancelled and past records', () => {
  const now = new Date('2026-10-09T12:00:00');
  const make = (id, status, dateConfirmee) => ({ id, status, dateConfirmee });
  const items = [make('pending', 'EN_ATTENTE', '2026-10-10T09:00:00'), make('cancelled', 'ANNULE', '2026-10-10T10:00:00'), make('past', 'CONFIRME', '2026-10-08T09:00:00'), make('later', 'CONFIRME', '2026-10-20T09:00:00'), make('next', 'CONFIRME', '2026-10-12T11:00:00')];
  assert.equal(nextAppointment(items, now).id, 'next');
  assert.equal(nextAppointment(items.slice(0, 3), now), undefined);
});

test('patient dossiers match normalized email and never other patients', () => {
  assert.deepEqual(appointmentsForPatient([{ id: 'own', email: ' Patient@Example.com ' }, { id: 'other', email: 'other@example.com' }], { email: 'patient@example.com' }).map(item => item.id), ['own']);
});

test('the patient view uses the percentage stored by the administrator, including zero', () => {
  assert.equal(axisPercent({ pourcentage: 65 }), 65);
  assert.equal(axisPercent({ pourcentage: 0, progression: 90 }), 0);
  assert.equal(axisPercent({ progression: 42 }), 42);
  assert.equal(axisPercent({ pourcentage: 120 }), 100);
  assert.equal(axisPercent({ pourcentage: -10 }), 0);
});

test('status counts include empty categories and count each record once', () => {
  assert.deepEqual(statusCounts([{ status: 'CONFIRME' }, { status: 'CONFIRME' }, { status: 'ANNULE' }, { status: 'EN_ATTENTE' }]), { EN_ATTENTE: 1, CONFIRME: 2, ANNULE: 1, TERMINE: 0 });
});

test('the week starts on Monday, including Sunday and year boundaries', () => {
  assert.deepEqual(periodRange('week', new Date('2027-01-03T12:00:00')), { from: '2026-12-28', to: '2027-01-03' });
  assert.deepEqual(periodRange('week', new Date('2027-01-04T12:00:00')), { from: '2027-01-04', to: '2027-01-10' });
});

test('month filters include the final day and handle leap years', () => {
  assert.deepEqual(periodRange('month', new Date('2028-02-15T12:00:00')), { from: '2028-02-01', to: '2028-02-29' });
  assert.deepEqual(periodRange('all'), { from: '', to: '' });
});

test('date filtering is inclusive and uses the effective appointment day', () => {
  const value = appointmentDate({ dateSouhaitee: '2026-09-30', heureSouhaitee: '09:00', dateConfirmee: '2026-10-01T10:00:00' });
  assert.equal(inRange(value, '2026-10-01', '2026-10-31'), true);
  assert.equal(inRange(value, '2026-09-01', '2026-09-30'), false);
  assert.equal(inRange('2026-10-31T23:59:00', '2026-10-01', '2026-10-31'), true);
  assert.equal(inRange('', '', ''), false);
});

test('calendar grids span six weeks and retain adjacent-month dates', () => {
  const days = calendarDays('2027-01');
  assert.equal(days.length, 42);
  assert.equal(days[0], '2026-12-28');
  assert.equal(days[41], '2027-02-07');
  assert.equal(new Set(days).size, 42);
});

test('local day keeps local midnight rather than converting the date to UTC', () => {
  assert.equal(localDay(new Date(2026, 9, 9, 0, 5)), '2026-10-09');
  assert.match(formatDate('2026-10-09', false), /9 octobre 2026/);
});

test('PDF export agrees with the screen on progress and confirmed appointment time', async () => {
  const appointment = { dateSouhaitee: '2026-10-12', heureSouhaitee: '09:00', dateConfirmee: '2026-10-22T14:45:00', status: 'CONFIRME' };
  const blob = createPatientPdfBlob({ user: { firstName: 'Test' }, dashboard: { bilan: { axes: [{ nom: 'Articulation', pourcentage: 65 }] } }, appointments: [appointment] });
  const pdf = Buffer.from(await blob.arrayBuffer()).toString('latin1');
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.ok(pdf.includes('Progression : 65 %'));
  assert.ok(pdf.includes(formatDate(appointmentDate(appointment))));
  assert.equal(pdf.includes('12 octobre 2026'), false);
});
