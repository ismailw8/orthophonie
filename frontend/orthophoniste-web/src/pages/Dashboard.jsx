import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

const CircularProgress = ({
                              value,
                              max = 100,
                              size = 118,
                              stroke = 10,
                              label,
                              subLabel,
                              variant = 'sky',
                          }) => {
    const safeValue = Number(value || 0);
    const safeMax = Number(max || 1);
    const percentage = Math.min(Math.round((safeValue / safeMax) * 100), 100);

    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const gradientId = `gradient-${label?.replace(/\s+/g, '-').toLowerCase()}-${variant}`;

    const gradientColors = {
        sky: ['#0ea5e9', '#06b6d4'],
        emerald: ['#10b981', '#22c55e'],
        amber: ['#f59e0b', '#fb923c'],
    };

    const colors = gradientColors[variant] || gradientColors.sky;

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colors[0]} />
                            <stop offset="100%" stopColor={colors[1]} />
                        </linearGradient>
                    </defs>

                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e0f2fe"
                        strokeWidth={stroke}
                    />

                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-2xl font-bold text-sky-950 leading-none">
                        {safeValue}
                        {safeMax === 100 ? '%' : ''}
                    </p>

                    {safeMax !== 100 && (
                        <p className="text-xs text-gray-400 mt-1">
                            /{safeMax}
                        </p>
                    )}
                </div>
            </div>

            <p className="text-sm font-semibold text-sky-950 mt-4 text-center">
                {label}
            </p>

            {subLabel && (
                <p className="text-xs text-gray-400 mt-1 text-center">
                    {subLabel}
                </p>
            )}
        </div>
    );
};

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
                setError('Erreur');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
                <Navbar />

                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
                        <p className="text-sky-400 text-sm">Chargement de votre suivi...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !dashboard?.bilan) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
                <Navbar />

                <div className="max-w-lg mx-auto px-4 py-20">
                    <div className="bg-white rounded-3xl p-10 border border-sky-100 shadow-xl shadow-sky-100 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-sky-950 mb-2">
                            Bienvenue, {user?.firstName} ! 👋
                        </h2>

                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            Votre espace de suivi est en cours de préparation par Zamzem Soulaymane.
                            Il apparaîtra ici après votre première séance.
                        </p>

                        <div className="bg-gradient-to-r from-sky-50 to-cyan-50 rounded-2xl p-5 text-left border border-sky-100">
                            <p className="text-xs font-bold text-sky-700 mb-3 uppercase tracking-wide">
                                Prochaines étapes
                            </p>

                            {[
                                'Effectuer votre première séance physique',
                                'Le docteur prépare votre bilan de suivi',
                                'Votre progression apparaîtra ici',
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
                                    <span className="w-6 h-6 bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">
                                        {i + 1}
                                    </span>

                                    <p className="text-xs text-sky-800">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const progressColor = (p) => {
        if (p >= 75) return 'from-emerald-400 to-green-500';
        if (p >= 50) return 'from-sky-400 to-cyan-500';
        return 'from-amber-400 to-orange-400';
    };

    const progressionVariant =
        dashboard.progressionGlobale >= 75
            ? 'emerald'
            : dashboard.progressionGlobale >= 50
                ? 'sky'
                : 'amber';

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-sky-950">
                            Bonjour, {user?.firstName} 👋
                        </h1>

                        <p className="text-gray-400 text-sm mt-1">
                            Voici votre tableau de bord de suivi
                        </p>
                    </div>

                    <div className="inline-flex items-center justify-center bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-md shadow-sky-200">
                        Lecture seule
                    </div>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                    {/* Séances effectuées */}
                    <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                    Suivi des séances
                                </p>

                                <h3 className="text-lg font-bold text-sky-950 mt-1">
                                    Séances effectuées
                                </h3>
                            </div>

                            <div className="w-11 h-11 bg-sky-100 rounded-2xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                        </div>

                        <CircularProgress
                            value={dashboard.seancesEffectuees}
                            max={dashboard.seancesPrevues || 1}
                            label="Séances réalisées"
                            subLabel={`${dashboard.seancesEffectuees} séance(s) sur ${dashboard.seancesPrevues}`}
                            variant="sky"
                        />
                    </div>

                    {/* Progression globale */}
                    <div className="bg-gradient-to-br from-sky-500 to-cyan-500 rounded-3xl p-6 shadow-lg shadow-sky-200 text-white">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-xs font-semibold text-sky-100 uppercase tracking-wide">
                                    Évolution générale
                                </p>

                                <h3 className="text-lg font-bold text-white mt-1">
                                    Progression globale
                                </h3>
                            </div>

                            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-5">
                            <CircularProgress
                                value={dashboard.progressionGlobale}
                                max={100}
                                label="Progression"
                                subLabel="Calculée selon le bilan actuel"
                                variant={progressionVariant}
                            />
                        </div>
                    </div>

                    {/* Prochaine séance */}
                    <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                    Planning
                                </p>

                                <h3 className="text-lg font-bold text-sky-950 mt-1">
                                    Prochaine séance
                                </h3>
                            </div>

                            <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100 rounded-2xl p-5">
                            <p className="text-2xl font-bold text-sky-950 mb-2">
                                {dashboard.prochainesSeances?.[0]
                                    ? new Date(dashboard.prochainesSeances[0].dateSeance)
                                        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                                    : 'Aucune'}
                            </p>

                            {dashboard.prochainesSeances?.[0] ? (
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {dashboard.prochainesSeances[0].titre}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Aucune séance planifiée pour le moment.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Axes de progression */}
                <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100 mb-6">
                    <h2 className="font-bold text-sky-950 mb-6 flex items-center gap-2 text-lg">
                        <span className="w-1 h-6 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full"></span>
                        Progression par axe
                    </h2>

                    <div className="space-y-6">
                        {dashboard.bilan?.axes?.map((axe) => (
                            <div key={axe.nom}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-sky-900">{axe.nom}</span>
                                    <span className="text-sm font-bold text-sky-700">{axe.pourcentage}%</span>
                                </div>

                                <div className="w-full bg-sky-50 rounded-full h-3 border border-sky-100">
                                    <div
                                        className={`bg-gradient-to-r ${progressColor(axe.pourcentage)} h-3 rounded-full transition-all duration-700`}
                                        style={{ width: `${axe.pourcentage}%` }}
                                    />
                                </div>

                                {axe.commentaire && (
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        {axe.commentaire}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Prochaines séances */}
                    <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100">
                        <h2 className="font-bold text-sky-950 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full"></span>
                            Prochaines séances
                        </h2>

                        {dashboard.prochainesSeances?.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-gray-300 text-sm">Aucune séance planifiée</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboard.prochainesSeances?.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100"
                                    >
                                        <div className="text-center bg-white rounded-lg p-2 min-w-12 border border-sky-100">
                                            <p className="text-xs font-bold text-sky-600">
                                                {new Date(s.dateSeance).toLocaleDateString('fr-FR', { day: 'numeric' })}
                                            </p>

                                            <p className="text-xs text-gray-400">
                                                {new Date(s.dateSeance).toLocaleDateString('fr-FR', { month: 'short' })}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-sky-900">{s.titre}</p>

                                            {s.description && (
                                                <p className="text-xs text-gray-400">{s.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Séances effectuées */}
                    <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-md shadow-sky-100">
                        <h2 className="font-bold text-sky-950 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></span>
                            Séances effectuées
                        </h2>

                        {dashboard.seancesPassees?.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-gray-300 text-sm">Aucune séance effectuée</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboard.seancesPassees?.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100"
                                    >
                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-sky-900">{s.titre}</p>

                                            <p className="text-xs text-emerald-500 font-medium">
                                                {new Date(s.dateSeance).toLocaleDateString('fr-FR')} — Effectuée
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Remarques */}
                {dashboard.bilan?.remarques && (
                    <div className="mt-6 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-3xl p-6 border border-sky-100 shadow-sm">
                        <h2 className="font-bold text-sky-950 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                            Remarques du docteur
                        </h2>

                        <p className="text-sm text-sky-800 leading-relaxed">
                            {dashboard.bilan.remarques}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;