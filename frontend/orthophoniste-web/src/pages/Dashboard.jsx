import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

const Dashboard = () => {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await axiosInstance.get('/api/suivi/mon-dashboard');
                setDashboard(response.data);
            } catch {
                setError('Impossible de charger votre tableau de bord.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-20 text-center">
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Bonjour, {user?.firstName} 👋
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Voici votre tableau de bord de suivi
                    </p>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        {
                            label: 'Séances effectuées',
                            value: `${dashboard?.seancesEffectuees} / ${dashboard?.seancesPrevues}`,
                            color: 'blue',
                        },
                        {
                            label: 'Progression globale',
                            value: `${dashboard?.progressionGlobale}%`,
                            color: 'green',
                        },
                        {
                            label: 'Prochaine séance',
                            value: dashboard?.prochainesSeances?.[0]
                                ? new Date(dashboard.prochainesSeances[0].dateSeance)
                                    .toLocaleDateString('fr-FR')
                                : 'Aucune',
                            color: 'purple',
                        },
                    ].map((m) => (
                        <div
                            key={m.label}
                            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
                        >
                            <p className="text-gray-400 text-xs mb-1">{m.label}</p>
                            <p className={`text-2xl font-semibold text-${m.color}-600`}>
                                {m.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Progression par axe */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Progression par axe
                    </h2>
                    <div className="space-y-4">
                        {dashboard?.bilan?.axes?.map((axe) => (
                            <div key={axe.nom}>
                                <div className="flex justify-between text-sm text-gray-700 mb-1">
                                    <span>{axe.nom}</span>
                                    <span>{axe.pourcentage}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                        style={{ width: `${axe.pourcentage}%` }}
                                    />
                                </div>
                                {axe.commentaire && (
                                    <p className="text-xs text-gray-400 mt-1">{axe.commentaire}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prochaines séances */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Prochaines séances
                    </h2>
                    {dashboard?.prochainesSeances?.length === 0 ? (
                        <p className="text-gray-400 text-sm">Aucune séance à venir.</p>
                    ) : (
                        <div className="space-y-3">
                            {dashboard?.prochainesSeances?.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg"
                                >
                                    <div className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-lg whitespace-nowrap">
                                        {new Date(s.dateSeance).toLocaleDateString('fr-FR')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{s.titre}</p>
                                        {s.description && (
                                            <p className="text-xs text-gray-400">{s.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Séances passées */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Séances effectuées
                    </h2>
                    {dashboard?.seancesPassees?.length === 0 ? (
                        <p className="text-gray-400 text-sm">Aucune séance effectuée.</p>
                    ) : (
                        <div className="space-y-3">
                            {dashboard?.seancesPassees?.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center gap-4 p-3 bg-green-50 rounded-lg"
                                >
                                    <div className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-lg whitespace-nowrap">
                                        {new Date(s.dateSeance).toLocaleDateString('fr-FR')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{s.titre}</p>
                                        <span className="text-xs text-green-600 font-medium">✓ Effectuée</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;