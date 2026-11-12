export const statusLabels = { EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' };
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const appointmentDate = appointment => appointment.dateConfirmee || (appointment.dateSouhaitee ? `${appointment.dateSouhaitee}T${appointment.heureSouhaitee || '00:00'}` : '');
export const requestedDate = appointment => appointment.dateSouhaitee ? `${appointment.dateSouhaitee}T${appointment.heureSouhaitee || '00:00'}` : '';
export const formatDate = (value, withTime = true) => {
  if (!value) return 'Date à confirmer';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Date à confirmer';
  return date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
};
export const percent = value => Math.max(0, Math.min(100, Number(value) || 0));
export const axisPercent = axis => percent(axis.pourcentage ?? axis.progression);
export const patientName = patient => `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.email || 'Patient';
export const normalizeEmail = email => String(email || '').trim().toLowerCase();
export const appointmentsForPatient = (appointments, patient) => appointments.filter(item => normalizeEmail(item.email) === normalizeEmail(patient.email));
export const nextAppointment = (appointments, now = new Date()) => appointments.filter(item => item.status === 'CONFIRME' && new Date(appointmentDate(item)) >= now).sort((a, b) => appointmentDate(a).localeCompare(appointmentDate(b)))[0];
export const statusCounts = appointments => Object.fromEntries(Object.keys(statusLabels).map(status => [status, appointments.filter(item => item.status === status).length]));
export const periodRange = (period, now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  if (period === 'week') { start.setDate(start.getDate() - (start.getDay() + 6) % 7); end.setTime(start.getTime()); end.setDate(end.getDate() + 6); }
  else if (period === 'month') { start.setDate(1); end.setMonth(end.getMonth() + 1, 0); }
  else return { from: '', to: '' };
  return { from: localDay(start), to: localDay(end) };
};
export const inRange = (value, from, to) => {
  const day = String(value || '').slice(0, 10);
  return !!day && (!from || day >= from) && (!to || day <= to);
};
export const calendarDays = month => {
  const first = new Date(`${month}-01T12:00:00`);
  first.setDate(first.getDate() - (first.getDay() + 6) % 7);
  return Array.from({ length: 42 }, (_, index) => { const date = new Date(first); date.setDate(date.getDate() + index); return localDay(date); });
};
