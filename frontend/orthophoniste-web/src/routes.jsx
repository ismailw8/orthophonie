import { lazy, Suspense } from 'react';
import { createRoutesFromElements, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import { Page, Spinner } from './components/PageUI';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/HomeProfessional';
import RendezVous from './pages/RendezVous';
import Login from './pages/LoginProfessional';
import Dashboard from './pages/DashboardProfessional';
import AdminOverview from './pages/AdminOverview';
import AdminAgenda from './pages/AdminAgenda';
import AdminBilans from './pages/AdminBilansProfessional';
import AdminPatients from './pages/AdminPatients';
import AdminPatientFile from './pages/AdminPatientFile';
import AdminComptesPatients from './pages/AdminComptesPatients';
import Indisponibilites from './pages/Indisponibilites';
import PatientAppointments from './pages/PatientAppointments';
import NotFound from './pages/NotFound';
import RoleHome from './components/RoleHome';

const Statistics = lazy(() => import('./pages/StatisticsProfessional'));
const statisticsFallback = <AdminLayout><Page><p role="status" className="text-sm text-slate-600">Chargement des statistiques…</p><Spinner/></Page></AdminLayout>;

const adminRoutes = [
    ['/admin', <AdminOverview/>], ['/admin/agenda', <AdminAgenda/>],
    ['/admin/patients', <AdminPatients/>], ['/admin/patients/:patientId', <AdminPatientFile/>],
    ['/admin/bilans', <AdminBilans/>], ['/admin/comptes-patients', <AdminComptesPatients/>],
    ['/admin/indisponibilites', <Indisponibilites/>], ['/admin/statistics', <Suspense fallback={statisticsFallback}><Statistics/></Suspense>],
];
export const appRoutes = createRoutesFromElements(
    <>
        <Route path="/" element={<Home/>}/>
        <Route path="/rendez-vous" element={<RendezVous/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/espace" element={<RoleHome/>}/>
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="ROLE_USER"><Dashboard/></ProtectedRoute>}/>
        <Route path="/mes-rendez-vous" element={<ProtectedRoute requiredRole="ROLE_USER"><PatientAppointments/></ProtectedRoute>}/>
        {adminRoutes.map(([path, page]) => <Route key={path} path={path} element={<ProtectedRoute requiredRole="ROLE_ADMIN">{page}</ProtectedRoute>}/>)}
        <Route path="*" element={<NotFound/>}/>
    </>
);
