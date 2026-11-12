import axios from './axios';

const list = url => async signal => {
  const { data } = await axios.get(url, { signal });
  if (!Array.isArray(data)) throw new Error('Réponse du service invalide.');
  return data;
};
export const fetchAppointments = list('/api/rdv/admin');
export const fetchPatientAppointments = list('/api/rdv/patient/mes-rendez-vous');
export const fetchPatients = list('/api/auth/admin/patients');
export const fetchBilans = list('/api/suivi/admin/bilans');
export const fetchSessions = list('/api/suivi/admin/seances');
export const fetchUnavailable = list('/api/rdv/admin/indisponibilites');
export const fetchPatientSessions = patientId => list(`/api/suivi/admin/seances/patient/${encodeURIComponent(patientId)}`);
