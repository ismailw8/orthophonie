import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
                <div className="text-center" role="status">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-sky-800" />
                    <p className="mt-4 text-sm font-medium text-slate-600">Ouverture de votre espace…</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        if (
            requiredRole === 'ROLE_ADMIN' &&
            user.role === 'ROLE_SUPER_ADMIN'
        ) {
            return children;
        }
        return <Navigate to="/espace" replace />;
    }

    return children;
};

export default ProtectedRoute;
