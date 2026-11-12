import { useState, useEffect } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

// ── Helpers ──────────────────────────────────────────────────

const MOIS = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

const PIE_COLORS = ['#0EA5E9', '#F59E0B', '#EF4444', '#10B981'];

// ── Composant KPI Card ────────────────────────────────────────

const KpiCard = ({ label, value, sub, icon, color }) => (
    <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
                {icon}
            </div>
        </div>
        <p className="text-2xl font-bold text-sky-950">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-emerald-500 font-medium mt-1">{sub}</p>}
    </div>
);

// ── Tooltip personnalisé ──────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-sky-100 rounded-xl p-3 shadow-lg text-xs">
                <p className="font-semibold text-sky-900 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                        {p.name} : <span className="font-bold">{p.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ── Page principale ───────────────────────────────────────────

const Statistics = () => {
    const [rdvs, setRdvs]     = useState([]);
    const [bilans, setBilans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [periode, setPeriode] = useState('mois'); // mois | annee

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rdvRes, bilanRes] = await Promise.all([
                    axiosInstance.get('/api/rdv/admin'),
                    axiosInstance.get('/api/suivi/admin/bilans'),
                ]);
                setRdvs(rdvRes.data);
                setBilans(bilanRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ── Calculs ────────────────────────────────────────────────

    const now = new Date();

    // KPIs
    const totalRdv       = rdvs.length;
    const rdvCeMois      = rdvs.filter(r => {
        const d = new Date(r.dateSouhaitee || r.createdAt);
        return d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
    }).length;

    const confirmes      = rdvs.filter(r => r.status === 'CONFIRME').length;
    const tauxConf       = totalRdv > 0
        ? Math.round((confirmes / totalRdv) * 100)
        : 0;
    const totalPatients  = bilans.length;
    const progressMoyen  = bilans.length > 0
        ? Math.round(bilans.reduce((acc, b) => acc + b.progressionGlobale, 0) / bilans.length)
        : 0;

    // Données par mois (12 derniers mois)
    const dataParMois = Array.from({ length: 12 }, (_, i) => {
        const date  = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const m     = date.getMonth();
        const y     = date.getFullYear();
        const rdvDuMois = rdvs.filter(r => {
            const d = new Date(r.dateSouhaitee || r.createdAt);
            return d.getMonth() === m && d.getFullYear() === y;
        });
        return {
            mois:      `${MOIS[m]} ${y !== now.getFullYear() ? y : ''}`.trim(),
            total:     rdvDuMois.length,
            confirmes: rdvDuMois.filter(r => r.status === 'CONFIRME').length,
            annules:   rdvDuMois.filter(r => r.status === 'ANNULE').length,
            attente:   rdvDuMois.filter(r => r.status === 'EN_ATTENTE').length,
        };
    });

    // Données par semaine (4 dernières semaines)
    const dataParSemaine = Array.from({ length: 4 }, (_, i) => {
        const debut = new Date(now);
        debut.setDate(now.getDate() - (3 - i) * 7 - now.getDay());
        const fin = new Date(debut);
        fin.setDate(debut.getDate() + 6);

        const rdvSemaine = rdvs.filter(r => {
            const d = new Date(r.dateSouhaitee || r.createdAt);
            return d >= debut && d <= fin;
        });

        return {
            semaine:   `S${i + 1}`,
            total:     rdvSemaine.length,
            confirmes: rdvSemaine.filter(r => r.status === 'CONFIRME').length,
            annules:   rdvSemaine.filter(r => r.status === 'ANNULE').length,
        };
    });

    // Données pie chart statuts
    const dataPie = [
        { name: 'Confirmés',  value: rdvs.filter(r => r.status === 'CONFIRME').length },
        { name: 'En attente', value: rdvs.filter(r => r.status === 'EN_ATTENTE').length },
        { name: 'Annulés',    value: rdvs.filter(r => r.status === 'ANNULE').length },
        { name: 'Terminés',   value: rdvs.filter(r => r.status === 'TERMINE').length },
    ].filter(d => d.value > 0);

    // Progression patients
    const dataProgression = bilans
        .map(b => ({
            nom:        b.patientNom?.split(' ')[0] || 'Patient',
            progression: b.progressionGlobale,
            seances:    b.seancesEffectuees,
        }))
        .sort((a, b) => b.progression - a.progression);

    // Tableau mensuel
    const tableauMensuel = dataParMois.slice(-6).map(d => ({
        ...d,
        taux: d.total > 0 ? Math.round((d.confirmes / d.total) * 100) : 0,
    }));

    const dataAffichee = periode === 'semaine' ? dataParSemaine : dataParMois;
    const xKey         = periode === 'semaine' ? 'semaine' : 'mois';

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
                        <p className="text-sky-400 text-sm">Chargement des statistiques...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-sky-950">
                            Statistiques du cabinet
                        </h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            Vue d'ensemble des performances — mis à jour en temps réel
                        </p>
                    </div>

                    {/* Toggle période */}
                    <div className="flex items-center gap-1 bg-white border border-sky-100 rounded-xl p-1 shadow-sm">
                        {['semaine', 'mois'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriode(p)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                                    periode === p
                                        ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-sky-500'
                                }`}
                            >
                                {p === 'semaine' ? 'Par semaine' : 'Par mois'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <KpiCard
                        label="Total rendez-vous"
                        value={totalRdv}
                        icon={
                            <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                        color="bg-sky-50"
                    />
                    <KpiCard
                        label="Ce mois-ci"
                        value={rdvCeMois}
                        sub="Rendez-vous du mois"
                        icon={
                            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                        color="bg-cyan-50"
                    />
                    <KpiCard
                        label="Taux de confirmation"
                        value={`${tauxConf}%`}
                        sub={tauxConf >= 80 ? '✓ Excellent' : 'À améliorer'}
                        icon={
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        color="bg-emerald-50"
                    />
                    <KpiCard
                        label="Patients suivis"
                        value={totalPatients}
                        icon={
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                        color="bg-indigo-50"
                    />
                    <KpiCard
                        label="Progression moyenne"
                        value={`${progressMoyen}%`}
                        sub="Tous patients confondus"
                        icon={
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                        color="bg-amber-50"
                    />
                </div>

                {/* Graphiques principaux */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                    {/* Courbe RDV */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-sky-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-bold text-sky-950 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                                    Évolution des rendez-vous
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {periode === 'semaine' ? '4 dernières semaines' : '12 derniers mois'}
                                </p>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={dataAffichee} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradConf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F9FF" />
                                <XAxis
                                    dataKey={xKey}
                                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    name="Total RDV"
                                    stroke="#0EA5E9"
                                    strokeWidth={2}
                                    fill="url(#gradTotal)"
                                    dot={{ r: 3, fill: '#0EA5E9' }}
                                    activeDot={{ r: 5 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="confirmes"
                                    name="Confirmés"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fill="url(#gradConf)"
                                    dot={{ r: 3, fill: '#10B981' }}
                                    activeDot={{ r: 5 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="annules"
                                    name="Annulés"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    fill="none"
                                    dot={{ r: 3, fill: '#EF4444' }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie chart statuts */}
                    <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm">
                        <h2 className="font-bold text-sky-950 flex items-center gap-2 mb-6">
                            <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                            Répartition par statut
                        </h2>

                        {dataPie.length === 0 ? (
                            <div className="flex items-center justify-center h-48">
                                <p className="text-gray-300 text-sm">Aucune donnée</p>
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={dataPie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {dataPie.map((_, index) => (
                                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="space-y-2 mt-2">
                                    {dataPie.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: PIE_COLORS[index] }}
                                                />
                                                <span className="text-xs text-gray-500">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-sky-950">{item.value}</span>
                                                <span className="text-xs text-gray-300">
                          ({totalRdv > 0 ? Math.round((item.value / totalRdv) * 100) : 0}%)
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Deuxième ligne graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Bar chart comparaison */}
                    <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm">
                        <h2 className="font-bold text-sky-950 flex items-center gap-2 mb-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-400 rounded-full" />
                            Confirmés vs Annulés
                        </h2>
                        <p className="text-xs text-gray-400 mb-6">
                            {periode === 'semaine' ? 'Par semaine' : 'Par mois'}
                        </p>

                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dataAffichee} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F9FF" />
                                <XAxis
                                    dataKey={xKey}
                                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                <Bar
                                    dataKey="confirmes"
                                    name="Confirmés"
                                    fill="#0EA5E9"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="annules"
                                    name="Annulés"
                                    fill="#FCA5A5"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Progression patients */}
                    <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm">
                        <h2 className="font-bold text-sky-950 flex items-center gap-2 mb-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
                            Progression des patients
                        </h2>
                        <p className="text-xs text-gray-400 mb-6">
                            Classement par progression globale
                        </p>

                        {dataProgression.length === 0 ? (
                            <div className="flex items-center justify-center h-48">
                                <p className="text-gray-300 text-sm">Aucun patient suivi</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart
                                    data={dataProgression}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F9FF" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="nom"
                                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="progression"
                                        name="Progression"
                                        radius={[0, 4, 4, 0]}
                                    >
                                        {dataProgression.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={
                                                    entry.progression >= 75 ? '#10B981' :
                                                        entry.progression >= 50 ? '#0EA5E9' :
                                                            entry.progression >= 25 ? '#F59E0B' : '#EF4444'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Tableau mensuel détaillé */}
                <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-sky-50">
                        <h2 className="font-bold text-sky-950 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                            Tableau détaillé — 6 derniers mois
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Synthèse mensuelle des rendez-vous
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-sky-50">
                                {['Mois', 'Total RDV', 'Confirmés', 'En attente', 'Annulés', 'Taux confirmation'].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-5 py-3 text-xs font-semibold text-sky-600 uppercase tracking-wide"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                            {tableauMensuel.map((row, i) => (
                                <tr key={i} className="hover:bg-sky-50 transition">
                                    <td className="px-5 py-3 font-semibold text-sky-950">{row.mois}</td>
                                    <td className="px-5 py-3 text-gray-600">{row.total}</td>
                                    <td className="px-5 py-3">
                                        <span className="text-emerald-600 font-medium">{row.confirmes}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-amber-500 font-medium">{row.attente}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-red-400 font-medium">{row.annules}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-sky-100 rounded-full h-1.5 w-20">
                                                <div
                                                    className={`h-1.5 rounded-full ${
                                                        row.taux >= 80 ? 'bg-emerald-500' :
                                                            row.taux >= 60 ? 'bg-sky-500' : 'bg-amber-400'
                                                    }`}
                                                    style={{ width: `${row.taux}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold ${
                                                row.taux >= 80 ? 'text-emerald-600' :
                                                    row.taux >= 60 ? 'text-sky-600' : 'text-amber-500'
                                            }`}>
                          {row.taux}%
                        </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tableauMensuel.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-300 text-sm">
                                        Aucune donnée disponible
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Statistics;
