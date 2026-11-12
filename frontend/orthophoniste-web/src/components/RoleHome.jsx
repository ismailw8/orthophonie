import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleHome() {
    const { user, loading, isAdmin } = useAuth();
    if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50"><p className="text-sm font-medium text-slate-600">Ouverture de votre espace…</p></main>;
    if (!user) return <Navigate to="/login" replace />;
    if (user.mustChangePassword) return <Navigate to="/changer-mot-de-passe" replace />;
    return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
}
