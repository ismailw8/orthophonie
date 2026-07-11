import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

const AdminDashboard = () => {
    const [rdvs, setRdvs] = useState([]);
    const [bilans, setBilans] = useState([]);
    const [seances, setSeances] = useState([]);
    const [activeTab, setActiveTab] = useState('rdvs');
    const [loading, setLoading] = useState(true);

    const [showBilanModal, setShowBilanModal] = useState(false);
    const [showSeanceModal, setShowSeanceModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCompteModal, setShowCompteModal] = useState(false);
    const [selectedRdv, setSelectedRdv] = useState(null);
    const [selectedBilan, setSelectedBilan] = useState(null);
    const [compteCree, setCompteCree] = useState(null);

    const [rdvSearch, setRdvSearch] = useState('');
    const [rdvSearchField, setRdvSearchField] = useState('all');
    const [rdvSortBy, setRdvSortBy] = useState('date_desc');
    const [rdvStatusFilter, setRdvStatusFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const [patientSearch, setPatientSearch] = useState('');
    const [patientSortBy, setPatientSortBy] = useState('nom_asc');

    const [compteForm, setCompteForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
    });

    const [bilanForm, setBilanForm] = useState({
        patientId: '',
        patientEmail: '',
        patientNom: '',
        seancesEffectuees: 0,
        seancesPrevues: 0,
        progressionGlobale: 0,
        axes: [
            { nom: 'Articulation', pourcentage: 0, commentaire: '' },
            { nom: 'Fluidité de parole', pourcentage: 0, commentaire: '' },
            { nom: 'Compréhension', pourcentage: 0, commentaire: '' },
        ],
        remarques: '',
    });

    const [seanceForm, setSeanceForm] = useState({
        patientId: '',
        patientEmail: '',
        titre: '',
        description: '',
        dateSeance: '',
    });

    const [confirmForm, setConfirmForm] = useState({ dateConfirmee: '', notes: '' });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [rdvRes, bilanRes] = await Promise.all([
                axiosInstance.get('/api/rdv/admin'),
                axiosInstance.get('/api/suivi/admin/bilans'),
            ]);
            setRdvs(Array.isArray(rdvRes.data) ? rdvRes.data : []);
            setBilans(Array.isArray(bilanRes.data) ? bilanRes.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSeances = async (patientId) => {
        if (!patientId) return;
        try {
            const res = await axiosInstance.get(`/api/suivi/admin/seances/patient/${patientId}`);
            setSeances(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        }
    };

    const normalize = (value) => String(value || '').toLowerCase().trim();

    const getRdvDateValue = (rdv) => rdv.dateConfirmee || rdv.dateSouhaitee || rdv.createdAt || null;

    const toDateKey = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDate = (value) => {
        if (!value) return 'Date non définie';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Date invalide';
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (value) => {
        if (!value) return 'Date non définie';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Date invalide';
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getInitials = (firstName, lastName, fallback = '') => {
        const first = firstName?.charAt(0) || '';
        const last = lastName?.charAt(0) || '';
        const initials = `${first}${last}`.trim();
        return initials || fallback?.charAt(0)?.toUpperCase() || 'P';
    };

    const filteredRdvs = useMemo(() => {
        const search = normalize(rdvSearch);

        return rdvs
            .filter((rdv) => {
                if (rdvStatusFilter !== 'all' && rdv.status !== rdvStatusFilter) return false;
                if (selectedDate && toDateKey(getRdvDateValue(rdv)) !== selectedDate) return false;
                if (!search) return true;

                const values = {
                    firstName: normalize(rdv.firstName),
                    lastName: normalize(rdv.lastName),
                    phone: normalize(rdv.phone),
                    email: normalize(rdv.email),
                };

                if (rdvSearchField === 'all') {
                    return Object.values(values).some((value) => value.includes(search));
                }

                return values[rdvSearchField]?.includes(search);
            })
            .sort((a, b) => {
                if (rdvSortBy === 'nom_asc') return normalize(a.lastName).localeCompare(normalize(b.lastName));
                if (rdvSortBy === 'nom_desc') return normalize(b.lastName).localeCompare(normalize(a.lastName));
                if (rdvSortBy === 'prenom_asc') return normalize(a.firstName).localeCompare(normalize(b.firstName));
                if (rdvSortBy === 'email_asc') return normalize(a.email).localeCompare(normalize(b.email));
                if (rdvSortBy === 'phone_asc') return normalize(a.phone).localeCompare(normalize(b.phone));

                const dateA = new Date(getRdvDateValue(a) || 0).getTime();
                const dateB = new Date(getRdvDateValue(b) || 0).getTime();
                return rdvSortBy === 'date_asc' ? dateA - dateB : dateB - dateA;
            });
    }, [rdvs, rdvSearch, rdvSearchField, rdvSortBy, rdvStatusFilter, selectedDate]);

    const filteredBilans = useMemo(() => {
        const search = normalize(patientSearch);
        return bilans
            .filter((b) => {
                if (!search) return true;
                return (
                    normalize(b.patientNom).includes(search) ||
                    normalize(b.patientEmail).includes(search) ||
                    normalize(b.patientId).includes(search)
                );
            })
            .sort((a, b) => {
                if (patientSortBy === 'nom_desc') return normalize(b.patientNom).localeCompare(normalize(a.patientNom));
                if (patientSortBy === 'email_asc') return normalize(a.patientEmail).localeCompare(normalize(b.patientEmail));
                if (patientSortBy === 'progression_desc') return (b.progressionGlobale || 0) - (a.progressionGlobale || 0);
                if (patientSortBy === 'progression_asc') return (a.progressionGlobale || 0) - (b.progressionGlobale || 0);
                return normalize(a.patientNom).localeCompare(normalize(b.patientNom));
            });
    }, [bilans, patientSearch, patientSortBy]);

    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const days = [];

        for (let i = 0; i < startOffset; i += 1) {
            days.push({ key: `empty-${i}`, empty: true });
        }

        for (let day = 1; day <= lastDay.getDate(); day += 1) {
            const date = new Date(year, month, day);
            const key = toDateKey(date);
            const dayRdvs = rdvs.filter((rdv) => toDateKey(getRdvDateValue(rdv)) === key);
            days.push({ key, day, date, rdvs: dayRdvs });
        }

        return days;
    }, [calendarMonth, rdvs]);

    const selectedDateRdvs = useMemo(() => {
        if (!selectedDate) return [];
        return rdvs.filter((rdv) => toDateKey(getRdvDateValue(rdv)) === selectedDate);
    }, [rdvs, selectedDate]);

    const changeMonth = (direction) => {
        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    };

    const resetRdvFilters = () => {
        setRdvSearch('');
        setRdvSearchField('all');
        setRdvSortBy('date_desc');
        setRdvStatusFilter('all');
        setSelectedDate('');
    };

    const ouvrirCompteModal = () => {
        setCompteForm({ firstName: '', lastName: '', email: '', password: '', phone: '' });
        setCompteCree(null);
        setFormError('');
        setFormSuccess('');
        setShowCompteModal(true);
    };

    const creerCompte = async () => {
        if (!compteForm.firstName || !compteForm.lastName || !compteForm.email || !compteForm.password) {
            setFormError('Tous les champs obligatoires doivent être remplis.');
            return;
        }
        if (compteForm.password.length < 8) {
            setFormError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        try {
            const res = await axiosInstance.post('/api/auth/register', compteForm);
            setCompteCree(res.data);
            setFormSuccess('Compte créé avec succès !');
            setFormError('');
        } catch (err) {
            setFormError(err.response?.data?.message || 'Erreur lors de la création du compte.');
        }
    };

    const copierCredentials = () => {
        const text = `Email    : ${compteForm.email}\nPassword : ${compteForm.password}\nSite     : http://localhost:5173/login`;
        navigator.clipboard.writeText(text);
        alert('Credentials copiés !');
    };

    const ouvrirConfirmModal = (rdv) => {
        setSelectedRdv(rdv);
        setConfirmForm({ dateConfirmee: '', notes: '' });
        setFormError('');
        setFormSuccess('');
        setShowConfirmModal(true);
    };

    const confirmerRdv = async () => {
        if (!confirmForm.dateConfirmee) {
            setFormError('La date est requise.');
            return;
        }
        try {
            await axiosInstance.put(`/api/rdv/admin/${selectedRdv.id}/confirmer`, confirmForm);
            setFormSuccess('RDV confirmé !');
            await fetchAll();
            setTimeout(() => setShowConfirmModal(false), 1000);
        } catch {
            setFormError('Erreur lors de la confirmation.');
        }
    };

    const annulerRdv = async (id) => {
        if (!window.confirm("Confirmer l'annulation ?")) return;
        try {
            await axiosInstance.put(`/api/rdv/admin/${id}/annuler`);
            await fetchAll();
        } catch {
            alert("Erreur lors de l'annulation.");
        }
    };

    const ouvrirBilanModal = (bilan = null) => {
        setFormError('');
        setFormSuccess('');
        if (bilan) {
            setSelectedBilan(bilan);
            setBilanForm({
                patientId: bilan.patientId || '',
                patientEmail: bilan.patientEmail || '',
                patientNom: bilan.patientNom || '',
                seancesEffectuees: bilan.seancesEffectuees || 0,
                seancesPrevues: bilan.seancesPrevues || 0,
                progressionGlobale: bilan.progressionGlobale || 0,
                axes: bilan.axes?.length ? bilan.axes : [],
                remarques: bilan.remarques || '',
            });
            fetchSeances(bilan.patientId);
        } else {
            setSelectedBilan(null);
            setBilanForm({
                patientId: '',
                patientEmail: '',
                patientNom: '',
                seancesEffectuees: 0,
                seancesPrevues: 0,
                progressionGlobale: 0,
                axes: [
                    { nom: 'Articulation', pourcentage: 0, commentaire: '' },
                    { nom: 'Fluidité de parole', pourcentage: 0, commentaire: '' },
                    { nom: 'Compréhension', pourcentage: 0, commentaire: '' },
                ],
                remarques: '',
            });
            setSeances([]);
        }
        setShowBilanModal(true);
    };

    const saveBilan = async () => {
        if (!bilanForm.patientEmail || !bilanForm.patientNom) {
            setFormError('Email et nom sont requis.');
            return;
        }
        try {
            if (selectedBilan) {
                await axiosInstance.put('/api/suivi/admin/bilans', bilanForm);
            } else {
                await axiosInstance.post('/api/suivi/admin/bilans', bilanForm);
            }
            setFormSuccess('Bilan sauvegardé !');
            await fetchAll();
            setTimeout(() => setShowBilanModal(false), 1000);
        } catch {
            setFormError('Erreur lors de la sauvegarde.');
        }
    };

    const updateAxe = (index, field, value) => {
        const newAxes = [...bilanForm.axes];
        newAxes[index] = { ...newAxes[index], [field]: value };
        setBilanForm({ ...bilanForm, axes: newAxes });
    };

    const ajouterAxe = () => {
        setBilanForm({
            ...bilanForm,
            axes: [...bilanForm.axes, { nom: '', pourcentage: 0, commentaire: '' }],
        });
    };

    const supprimerAxe = (index) => {
        setBilanForm({ ...bilanForm, axes: bilanForm.axes.filter((_, i) => i !== index) });
    };

    const ouvrirSeanceModal = () => {
        setFormError('');
        setFormSuccess('');
        setSeanceForm({
            patientId: selectedBilan?.patientId || '',
            patientEmail: selectedBilan?.patientEmail || '',
            titre: '',
            description: '',
            dateSeance: '',
        });
        setShowSeanceModal(true);
    };

    const saveSeance = async () => {
        if (!seanceForm.titre || !seanceForm.dateSeance) {
            setFormError('Titre et date sont requis.');
            return;
        }
        try {
            await axiosInstance.post('/api/suivi/admin/seances', {
                ...seanceForm,
                dateSeance: `${seanceForm.dateSeance}:00`,
            });
            setFormSuccess('Séance ajoutée !');
            await fetchSeances(seanceForm.patientId);
            setTimeout(() => setShowSeanceModal(false), 1000);
        } catch {
            setFormError("Erreur lors de l'ajout.");
        }
    };

    const marquerEffectuee = async (seanceId) => {
        try {
            await axiosInstance.put(`/api/suivi/admin/seances/${seanceId}/effectuee`);
            await fetchSeances(selectedBilan.patientId);
        } catch {
            alert('Erreur.');
        }
    };

    const statusConfig = {
        EN_ATTENTE: { label: 'En attente', class: 'bg-amber-50 text-amber-600 border border-amber-200' },
        CONFIRME: { label: 'Confirmé', class: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
        ANNULE: { label: 'Annulé', class: 'bg-red-50 text-red-500 border border-red-200' },
        TERMINE: { label: 'Terminé', class: 'bg-sky-50 text-sky-600 border border-sky-200' },
    };

    const getPatientAttention = (progression) => {
        const value = Number(progression) || 0;

        if (value <= 30) {
            return {
                label: 'À surveiller',
                class: 'bg-red-50 text-red-500 border border-red-200',
                dot: 'bg-red-400',
            };
        }

        if (value <= 70) {
            return {
                label: 'En progression',
                class: 'bg-amber-50 text-amber-600 border border-amber-200',
                dot: 'bg-amber-400',
            };
        }

        return {
            label: 'Bon progrès',
            class: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
            dot: 'bg-emerald-400',
        };
    };

    const getLastSeance = () => {
        if (!Array.isArray(seances) || seances.length === 0) return null;

        return [...seances]
            .filter((s) => s.dateSeance)
            .sort((a, b) => new Date(b.dateSeance).getTime() - new Date(a.dateSeance).getTime())[0];
    };

    const getProgressWidth = (value) => `${Math.min(Math.max(Number(value) || 0, 0), 100)}%`;

    const tabs = [
        { key: 'rdvs', label: 'Rendez-vous', count: rdvs.length },
        { key: 'patients', label: 'Patients & Bilans', count: bilans.length },
        { key: 'comptes', label: 'Comptes patients', count: null },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
                        <p className="text-sky-400 text-sm">Chargement du dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-sky-950">Dashboard Administration</h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            Gestion complète du cabinet — rendez-vous, calendrier, bilans et comptes
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-white border border-sky-100 rounded-2xl px-4 py-2 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-sky-700 font-medium">Système actif</span>
                    </div>
                </div>

                {/* Stats cards améliorées */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                    {[
                        {
                            label: "Aujourd’hui",
                            value: rdvs.filter((rdv) => toDateKey(getRdvDateValue(rdv)) === toDateKey(new Date())).length,
                            description: "Rendez-vous prévus ce jour",
                            iconBg: "from-sky-400 to-cyan-500",
                            badge: rdvs.filter((rdv) => toDateKey(getRdvDateValue(rdv)) === toDateKey(new Date())).length > 0 ? "Agenda actif" : "Aucun RDV",
                            badgeClass:
                                rdvs.filter((rdv) => toDateKey(getRdvDateValue(rdv)) === toDateKey(new Date())).length > 0
                                    ? "bg-sky-50 text-sky-600 border-sky-100"
                                    : "bg-gray-50 text-gray-400 border-gray-100",
                            icon: (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            ),
                        },
                        {
                            label: "En attente",
                            value: rdvs.filter((rdv) => rdv.status === 'EN_ATTENTE').length,
                            description: "Demandes à confirmer rapidement",
                            iconBg: "from-amber-400 to-orange-500",
                            badge: rdvs.filter((rdv) => rdv.status === 'EN_ATTENTE').length > 0 ? "À traiter" : "À jour",
                            badgeClass:
                                rdvs.filter((rdv) => rdv.status === 'EN_ATTENTE').length > 0
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-100",
                            icon: (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            ),
                        },
                        {
                            label: "Confirmés",
                            value: rdvs.filter((rdv) => rdv.status === 'CONFIRME').length,
                            description: "Rendez-vous planifiés au calendrier",
                            iconBg: "from-emerald-400 to-green-500",
                            badge: "Confirmés",
                            badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
                            icon: (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            ),
                        },
                        {
                            label: "Patients suivis",
                            value: bilans.length,
                            description: "Patients avec bilan actif",
                            iconBg: "from-violet-400 to-purple-500",
                            badge: "Suivi actif",
                            badgeClass: "bg-violet-50 text-violet-600 border-violet-100",
                            icon: (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            ),
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="relative overflow-hidden bg-white rounded-3xl p-6 border border-sky-100 shadow-sm hover:shadow-lg hover:shadow-sky-100 transition-all group"
                        >
                            <div className="absolute -right-8 -top-8 w-28 h-28 bg-sky-50 rounded-full opacity-70 group-hover:scale-110 transition-transform" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div
                                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center shadow-md`}
                                    >
                                        {stat.icon}
                                    </div>

                                    <span
                                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${stat.badgeClass}`}
                                    >
                                        {stat.badge}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-400 mb-1">
                                        {stat.label}
                                    </p>

                                    <p className="text-4xl font-black text-sky-950 leading-none">
                                        {stat.value}
                                    </p>

                                    <p className="text-sm text-gray-400 mt-3">
                                        {stat.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                    <div className="flex flex-wrap border-b border-sky-100">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative ${
                                    activeTab === tab.key
                                        ? 'text-sky-600 bg-sky-50'
                                        : 'text-gray-400 hover:text-sky-500 hover:bg-sky-50'
                                }`}
                            >
                                {tab.label}
                                {tab.count !== null && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                        activeTab === tab.key ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-400'
                                    }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                                {activeTab === tab.key && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-cyan-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'rdvs' && (
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="font-bold text-sky-950 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                                        Calendrier & liste des rendez-vous
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Recherche par numéro, nom, prénom ou email avec filtrage par statut et date.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {['EN_ATTENTE', 'CONFIRME', 'ANNULE'].map((s) => (
                                        <span key={s} className={`text-xs px-2 py-1 rounded-full ${statusConfig[s]?.class}`}>
                                            {rdvs.filter((r) => r.status === s).length} {statusConfig[s]?.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
                                <div className="xl:col-span-1 bg-sky-50 rounded-3xl border border-sky-100 p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => changeMonth(-1)}
                                            className="w-9 h-9 rounded-xl bg-white border border-sky-100 text-sky-600 hover:bg-sky-100 transition"
                                        >
                                            ‹
                                        </button>
                                        <div className="text-center">
                                            <p className="font-bold text-sky-950 capitalize">
                                                {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-gray-400">Cliquez sur un jour pour filtrer</p>
                                        </div>
                                        <button
                                            onClick={() => changeMonth(1)}
                                            className="w-9 h-9 rounded-xl bg-white border border-sky-100 text-sky-600 hover:bg-sky-100 transition"
                                        >
                                            ›
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
                                            <div key={`${d}-${index}`} className="text-center text-[11px] font-bold text-sky-400 py-1">
                                                {d}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((day) => {
                                            if (day.empty) return <div key={day.key} className="h-12" />;
                                            const isSelected = selectedDate === day.key;
                                            const hasRdvs = day.rdvs.length > 0;
                                            return (
                                                <button
                                                    key={day.key}
                                                    onClick={() => setSelectedDate(isSelected ? '' : day.key)}
                                                    className={`h-12 rounded-xl text-xs border transition-all flex flex-col items-center justify-center ${
                                                        isSelected
                                                            ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200'
                                                            : hasRdvs
                                                                ? 'bg-white text-sky-800 border-sky-200 hover:bg-sky-100'
                                                                : 'bg-white/70 text-gray-400 border-transparent hover:border-sky-100'
                                                    }`}
                                                >
                                                    <span className="font-semibold">{day.day}</span>
                                                    {hasRdvs && (
                                                        <span className={`mt-0.5 text-[10px] px-1.5 rounded-full ${
                                                            isSelected ? 'bg-white text-sky-600' : 'bg-sky-100 text-sky-600'
                                                        }`}
                                                        >
                                                            {day.rdvs.length}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedDate && (
                                        <div className="mt-4 bg-white rounded-2xl border border-sky-100 p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold text-sky-800">
                                                    {formatDate(selectedDate)}
                                                </p>
                                                <button onClick={() => setSelectedDate('')} className="text-xs text-gray-400 hover:text-red-500">
                                                    Effacer
                                                </button>
                                            </div>
                                            {selectedDateRdvs.length === 0 ? (
                                                <p className="text-xs text-gray-300">Aucun rendez-vous ce jour.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-36 overflow-y-auto">
                                                    {selectedDateRdvs.map((rdv) => (
                                                        <div
                                                            key={rdv.id}
                                                            className="text-xs bg-sky-50 rounded-xl p-3 border border-sky-100 hover:border-sky-200 transition-all"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-semibold text-sky-950">
                                                                        {rdv.firstName} {rdv.lastName}
                                                                    </p>

                                                                    <p className="text-gray-400 mt-0.5">
                                                                        {rdv.phone || rdv.email || 'Contact non renseigné'}
                                                                    </p>

                                                                    <p className="text-gray-400 mt-0.5">
                                                                        {formatDateTime(getRdvDateValue(rdv))}
                                                                    </p>

                                                                    {rdv.motif && (
                                                                        <p className="text-sky-500 mt-0.5">
                                                                            Motif : {rdv.motif}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <span
                                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                                                                        statusConfig[rdv.status]?.class ||
                                                                        'bg-gray-50 text-gray-500 border border-gray-200'
                                                                    }`}
                                                                >
                                                                    {statusConfig[rdv.status]?.label || rdv.status || 'Non défini'}
                                                                </span>
                                                            </div>

                                                            {rdv.status === 'EN_ATTENTE' && (
                                                                <div className="flex gap-2 mt-3">
                                                                    <button
                                                                        onClick={() => ouvrirConfirmModal(rdv)}
                                                                        className="flex-1 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-600 transition shadow-sm shadow-emerald-200"
                                                                    >
                                                                        Confirmer
                                                                    </button>

                                                                    <button
                                                                        onClick={() => annulerRdv(rdv.id)}
                                                                        className="flex-1 bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="xl:col-span-2 bg-sky-50 rounded-3xl border border-sky-100 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-sky-900 mb-1.5">Recherche</label>
                                            <input
                                                type="text"
                                                value={rdvSearch}
                                                onChange={(e) => setRdvSearch(e.target.value)}
                                                placeholder="Nom, prénom, téléphone ou email..."
                                                className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-sky-900 mb-1.5">Filtrer par</label>
                                            <select
                                                value={rdvSearchField}
                                                onChange={(e) => setRdvSearchField(e.target.value)}
                                                className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                            >
                                                <option value="all">Tous les champs</option>
                                                <option value="phone">Numéro</option>
                                                <option value="lastName">Nom</option>
                                                <option value="firstName">Prénom</option>
                                                <option value="email">Email</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-sky-900 mb-1.5">Statut</label>
                                            <select
                                                value={rdvStatusFilter}
                                                onChange={(e) => setRdvStatusFilter(e.target.value)}
                                                className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                            >
                                                <option value="all">Tous</option>
                                                <option value="EN_ATTENTE">En attente</option>
                                                <option value="CONFIRME">Confirmé</option>
                                                <option value="ANNULE">Annulé</option>
                                                <option value="TERMINE">Terminé</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-sky-900 mb-1.5">Tri</label>
                                            <select
                                                value={rdvSortBy}
                                                onChange={(e) => setRdvSortBy(e.target.value)}
                                                className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                            >
                                                <option value="date_desc">Date récente</option>
                                                <option value="date_asc">Date ancienne</option>
                                                <option value="nom_asc">Nom A-Z</option>
                                                <option value="nom_desc">Nom Z-A</option>
                                                <option value="prenom_asc">Prénom A-Z</option>
                                                <option value="email_asc">Email A-Z</option>
                                                <option value="phone_asc">Numéro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-sky-900 mb-1.5">Date sélectionnée</label>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={resetRdvFilters}
                                                className="w-full border border-sky-200 text-sky-600 bg-white py-2 rounded-xl text-sm font-medium hover:bg-sky-100 transition"
                                            >
                                                Réinitialiser
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                        <span>{filteredRdvs.length} résultat(s) affiché(s)</span>
                                        {selectedDate && <span>Filtré sur : {formatDate(selectedDate)}</span>}
                                    </div>
                                </div>
                            </div>

                            {filteredRdvs.length === 0 ? (
                                <div className="text-center py-16 bg-sky-50 rounded-3xl border border-sky-100">
                                    <p className="text-gray-300 text-sm">Aucun rendez-vous trouvé</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredRdvs.map((rdv) => (
                                        <div
                                            key={rdv.id}
                                            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-sky-50 rounded-2xl border border-sky-100 hover:border-sky-200 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <span className="text-white text-sm font-bold">
                                                        {getInitials(rdv.firstName, rdv.lastName)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sky-950 text-sm">
                                                        {rdv.firstName} {rdv.lastName}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-gray-400">{rdv.phone || 'Téléphone non renseigné'}</span>
                                                        {rdv.email && <span className="text-xs text-gray-400">· {rdv.email}</span>}
                                                        <span className="text-xs text-gray-400">· {formatDateTime(getRdvDateValue(rdv))}</span>
                                                        {rdv.motif && <span className="text-xs text-sky-500">· {rdv.motif}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[rdv.status]?.class || 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                                    {statusConfig[rdv.status]?.label || rdv.status || 'Non défini'}
                                                </span>
                                                {rdv.status === 'EN_ATTENTE' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => ouvrirConfirmModal(rdv)}
                                                            className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-600 transition shadow-sm shadow-emerald-200"
                                                        >
                                                            Confirmer
                                                        </button>
                                                        <button
                                                            onClick={() => annulerRdv(rdv.id)}
                                                            className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                                                        >
                                                            Annuler
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'patients' && (
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="font-bold text-sky-950 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                                        Patients suivis
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-1">Recherche et tri des patients avec bilan.</p>
                                </div>
                                <button
                                    onClick={() => ouvrirBilanModal()}
                                    className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-sky-200 transition-all"
                                >
                                    Nouveau bilan
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 bg-sky-50 border border-sky-100 rounded-3xl p-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-sky-900 mb-1.5">Recherche patient</label>
                                    <input
                                        type="text"
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        placeholder="Nom, email ou ID patient..."
                                        className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-sky-900 mb-1.5">Tri</label>
                                    <select
                                        value={patientSortBy}
                                        onChange={(e) => setPatientSortBy(e.target.value)}
                                        className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                    >
                                        <option value="nom_asc">Nom A-Z</option>
                                        <option value="nom_desc">Nom Z-A</option>
                                        <option value="email_asc">Email A-Z</option>
                                        <option value="progression_desc">Progression élevée</option>
                                        <option value="progression_asc">Progression faible</option>
                                    </select>
                                </div>
                            </div>

                            {filteredBilans.length === 0 ? (
                                <div className="text-center py-16 bg-sky-50 rounded-3xl border border-sky-100">
                                    <p className="text-gray-300 text-sm">Aucun patient trouvé</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredBilans.map((b) => {
                                        const attention = getPatientAttention(b.progressionGlobale);

                                        return (
                                            <div
                                                key={b.id}
                                                className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-4 bg-sky-50 rounded-2xl border border-sky-100 hover:border-sky-200 transition-all"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        <span className="text-white text-sm font-bold">
                                                            {b.patientNom?.charAt(0).toUpperCase() || 'P'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-semibold text-sky-950 text-sm">{b.patientNom}</p>
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${attention.class}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${attention.dot}`} />
                                                                {attention.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 truncate">{b.patientEmail || 'Email non renseigné'}</p>
                                                        <p className="text-[11px] text-gray-300 mt-0.5 font-mono truncate">ID : {b.patientId || 'Non renseigné'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 xl:min-w-[520px]">
                                                    <div className="bg-white border border-sky-100 rounded-2xl px-3 py-2">
                                                        <p className="text-xs text-gray-400 mb-1">Séances</p>
                                                        <p className="text-sm font-bold text-sky-700">
                                                            {b.seancesEffectuees || 0}/{b.seancesPrevues || 0}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white border border-sky-100 rounded-2xl px-3 py-2">
                                                        <p className="text-xs text-gray-400 mb-1">Progression</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full bg-sky-100 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-gradient-to-r from-sky-500 to-cyan-500 h-1.5 rounded-full"
                                                                    style={{ width: getProgressWidth(b.progressionGlobale) }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-sky-700">{b.progressionGlobale || 0}%</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => ouvrirBilanModal(b)}
                                                        className="col-span-2 md:col-span-1 bg-sky-500 text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-sky-600 transition shadow-sm shadow-sky-200"
                                                    >
                                                        Gérer le suivi
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comptes' && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-bold text-sky-950 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                                        Comptes patients
                                    </h2>
                                    <p className="text-gray-400 text-xs mt-0.5">
                                        Créez un compte après la première séance physique.
                                    </p>
                                </div>
                                <button
                                    onClick={ouvrirCompteModal}
                                    className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-sky-200 transition-all"
                                >
                                    Créer un compte
                                </button>
                            </div>

                            <div className="bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 rounded-2xl p-5 mb-6">
                                <p className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-3">Comment ça fonctionne</p>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                                    {['Séance physique', 'Créer compte', 'Communiquer les accès', 'Patient se connecte', 'Créer le bilan'].map((text, i) => (
                                        <div key={text} className="flex sm:flex-col items-center gap-2 sm:gap-1 sm:text-center">
                                            <span className="w-7 h-7 bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                                                {i + 1}
                                            </span>
                                            <p className="text-xs text-sky-700">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                                Patients avec compte actif ({bilans.length})
                            </p>
                            {bilans.length === 0 ? (
                                <div className="text-center py-10 bg-sky-50 rounded-2xl border border-sky-100">
                                    <p className="text-gray-300 text-sm">Aucun compte créé pour l'instant</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bilans.map((b) => (
                                        <div key={b.id} className="flex items-center justify-between px-4 py-3 bg-sky-50 rounded-xl border border-sky-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-lg flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">{b.patientNom?.charAt(0).toUpperCase() || 'P'}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-sky-900">{b.patientNom}</p>
                                                    <p className="text-xs text-gray-400">{b.patientEmail}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                                <span className="text-xs text-emerald-600 font-medium">Actif</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-sky-950 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-sky-200 border border-sky-100">
                        <div className="mb-4">
                            <h2 className="font-bold text-sky-950">Confirmer le rendez-vous</h2>
                            <p className="text-xs text-gray-400">
                                {selectedRdv?.firstName} {selectedRdv?.lastName} — {selectedRdv?.phone}
                            </p>
                        </div>

                        {formError && <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl px-4 py-2 text-xs mb-3">{formError}</div>}
                        {formSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl px-4 py-2 text-xs mb-3">{formSuccess}</div>}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">Date confirmée</label>
                                <input
                                    type="datetime-local"
                                    value={confirmForm.dateConfirmee}
                                    onChange={(e) => setConfirmForm({ ...confirmForm, dateConfirmee: e.target.value })}
                                    className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">Notes</label>
                                <textarea
                                    value={confirmForm.notes}
                                    onChange={(e) => setConfirmForm({ ...confirmForm, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Notes sur la séance..."
                                    className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 border border-sky-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition">
                                Annuler
                            </button>
                            <button onClick={confirmerRdv} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-emerald-200 transition">
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCompteModal && (
                <div className="fixed inset-0 bg-sky-950 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-sky-200 border border-sky-100">
                        <div className="mb-4">
                            <h2 className="font-bold text-sky-950">Créer un compte patient</h2>
                            <p className="text-xs text-gray-400">Le compte sera actif immédiatement.</p>
                        </div>

                        {formError && <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl px-4 py-2 text-xs mb-3">{formError}</div>}

                        {compteCree ? (
                            <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                                    <p className="text-emerald-700 font-semibold text-sm mb-3">Compte créé avec succès !</p>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between"><span className="text-gray-400">Nom</span><span className="font-medium text-gray-700">{compteForm.firstName} {compteForm.lastName}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="font-medium text-gray-700">{compteForm.email}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">Mot de passe</span><span className="font-medium text-gray-700">{compteForm.password}</span></div>
                                    </div>
                                </div>
                                <button onClick={copierCredentials} className="w-full bg-sky-100 text-sky-700 py-2 rounded-xl text-xs font-medium hover:bg-sky-200 transition">
                                    Copier les credentials
                                </button>
                                <button onClick={() => setShowCompteModal(false)} className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition">
                                    Fermer
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">Prénom *</label>
                                        <input type="text" value={compteForm.firstName} onChange={(e) => setCompteForm({ ...compteForm, firstName: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">Nom *</label>
                                        <input type="text" value={compteForm.lastName} onChange={(e) => setCompteForm({ ...compteForm, lastName: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-sky-900 mb-1.5">Email *</label>
                                    <input type="email" value={compteForm.email} onChange={(e) => setCompteForm({ ...compteForm, email: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-sky-900 mb-1.5">Téléphone</label>
                                    <input type="tel" value={compteForm.phone} onChange={(e) => setCompteForm({ ...compteForm, phone: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-sky-900 mb-1.5">Mot de passe temporaire *</label>
                                    <input type="text" value={compteForm.password} onChange={(e) => setCompteForm({ ...compteForm, password: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowCompteModal(false)} className="flex-1 border border-sky-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition">Annuler</button>
                                    <button onClick={creerCompte} className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-sky-200 transition">Créer le compte</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showBilanModal && (
                <div className="fixed inset-0 bg-sky-950 bg-opacity-40 backdrop-blur-sm flex items-start justify-center z-50 px-4 py-6 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl shadow-sky-200 border border-sky-100 my-4">
                        <div className="mb-5">
                            <h2 className="font-bold text-sky-950">{selectedBilan ? 'Modifier le bilan' : 'Nouveau bilan'}</h2>
                            <p className="text-xs text-gray-400">{selectedBilan ? selectedBilan.patientNom : 'Créer un nouveau bilan patient'}</p>
                        </div>

                        {formError && <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl px-4 py-2 text-xs mb-4">{formError}</div>}
                        {formSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl px-4 py-2 text-xs mb-4">{formSuccess}</div>}

                        {selectedBilan && (
                            <div className="bg-gradient-to-r from-sky-50 to-cyan-50 rounded-3xl p-4 border border-sky-100 mb-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-sm">
                                            <span className="text-white text-sm font-bold">
                                                {bilanForm.patientNom?.charAt(0).toUpperCase() || 'P'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-sky-950">{bilanForm.patientNom}</p>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getPatientAttention(bilanForm.progressionGlobale).class}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getPatientAttention(bilanForm.progressionGlobale).dot}`} />
                                                    {getPatientAttention(bilanForm.progressionGlobale).label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">{bilanForm.patientEmail}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-white border border-sky-100 rounded-2xl px-3 py-2">
                                            <p className="text-[11px] text-gray-400">Séances</p>
                                            <p className="text-sm font-bold text-sky-700">{bilanForm.seancesEffectuees || 0}/{bilanForm.seancesPrevues || 0}</p>
                                        </div>
                                        <div className="bg-white border border-sky-100 rounded-2xl px-3 py-2">
                                            <p className="text-[11px] text-gray-400">Progression</p>
                                            <p className="text-sm font-bold text-sky-700">{bilanForm.progressionGlobale || 0}%</p>
                                        </div>
                                        <div className="bg-white border border-sky-100 rounded-2xl px-3 py-2">
                                            <p className="text-[11px] text-gray-400">Dernière séance</p>
                                            <p className="text-xs font-semibold text-sky-700 truncate">{getLastSeance() ? formatDate(getLastSeance().dateSeance) : 'Aucune'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                                <p className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-3">Informations patient</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">Nom complet</label>
                                        <input type="text" value={bilanForm.patientNom} onChange={(e) => setBilanForm({ ...bilanForm, patientNom: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">Email</label>
                                        <input type="email" value={bilanForm.patientEmail} onChange={(e) => setBilanForm({ ...bilanForm, patientEmail: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-sky-900 mb-1.5">Patient ID</label>
                                    <input type="text" value={bilanForm.patientId} onChange={(e) => setBilanForm({ ...bilanForm, patientId: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono" />
                                </div>
                            </div>

                            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                                <p className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-3">Suivi des séances</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">Séances effectuées</label>
                                        <input type="number" min="0" value={bilanForm.seancesEffectuees} onChange={(e) => setBilanForm({ ...bilanForm, seancesEffectuees: parseInt(e.target.value) || 0 })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">Séances prévues</label>
                                        <input type="number" min="0" value={bilanForm.seancesPrevues} onChange={(e) => setBilanForm({ ...bilanForm, seancesPrevues: parseInt(e.target.value) || 0 })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">Progression %</label>
                                        <input type="number" min="0" max="100" value={bilanForm.progressionGlobale} onChange={(e) => setBilanForm({ ...bilanForm, progressionGlobale: parseInt(e.target.value) || 0 })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400" />
                                    </div>
                                </div>
                                <div className="mt-3 w-full bg-sky-100 rounded-full h-2 border border-sky-200">
                                    <div className="bg-gradient-to-r from-sky-500 to-cyan-500 h-2 rounded-full transition-all duration-300" style={{ width: `${bilanForm.progressionGlobale}%` }} />
                                </div>
                            </div>

                            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-xs font-bold text-sky-700 uppercase tracking-wide">Axes de progression</p>
                                    <button onClick={ajouterAxe} className="text-xs text-sky-500 font-medium hover:text-sky-700">Ajouter un axe</button>
                                </div>
                                <div className="space-y-3">
                                    {bilanForm.axes.map((axe, index) => (
                                        <div key={index} className="bg-white rounded-xl p-3 border border-sky-100 space-y-2">
                                            <div className="flex gap-2">
                                                <input type="text" value={axe.nom} onChange={(e) => updateAxe(index, 'nom', e.target.value)} placeholder="Nom de l'axe" className="flex-1 border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs bg-sky-50 focus:outline-none focus:ring-1 focus:ring-sky-400" />
                                                <input type="number" min="0" max="100" value={axe.pourcentage} onChange={(e) => updateAxe(index, 'pourcentage', parseInt(e.target.value) || 0)} className="w-16 border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs bg-sky-50 focus:outline-none focus:ring-1 focus:ring-sky-400 text-center" />
                                                <button onClick={() => supprimerAxe(index)} className="text-red-300 hover:text-red-500 transition px-1">×</button>
                                            </div>
                                            <div className="w-full bg-sky-100 rounded-full h-1.5">
                                                <div className="bg-gradient-to-r from-sky-400 to-cyan-400 h-1.5 rounded-full transition-all" style={{ width: `${axe.pourcentage}%` }} />
                                            </div>
                                            <input type="text" value={axe.commentaire} onChange={(e) => updateAxe(index, 'commentaire', e.target.value)} placeholder="Commentaire..." className="w-full border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs bg-sky-50 focus:outline-none focus:ring-1 focus:ring-sky-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">Remarques générales</label>
                                <textarea value={bilanForm.remarques} onChange={(e) => setBilanForm({ ...bilanForm, remarques: e.target.value })} rows={3} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                            </div>

                            {selectedBilan && (
                                <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <p className="text-xs font-bold text-sky-700 uppercase tracking-wide">Séances ({seances.length})</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Historique des séances liées à ce patient.</p>
                                        </div>
                                        <button onClick={ouvrirSeanceModal} className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-xl font-medium hover:bg-sky-600 transition shadow-sm shadow-sky-200">Ajouter séance</button>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {seances.length === 0 ? (
                                            <div className="text-center py-8 bg-white rounded-2xl border border-sky-100">
                                                <p className="text-sky-900 text-sm font-semibold">Aucune séance enregistrée</p>
                                                <p className="text-gray-400 text-xs mt-1">Ajoutez la première séance pour commencer l’historique du suivi.</p>
                                            </div>
                                        ) : (
                                            seances.map((s) => (
                                                <div key={s.id} className="p-3 bg-white rounded-2xl border border-sky-100 hover:border-sky-200 transition-all">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-sky-950">{s.titre}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.dateSeance)}</p>
                                                            {s.description && (
                                                                <p className="text-xs text-gray-500 mt-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2">{s.description}</p>
                                                            )}
                                                        </div>
                                                        {s.effectuee ? (
                                                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 whitespace-nowrap">Effectuée</span>
                                                        ) : (
                                                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 whitespace-nowrap">Prévue</span>
                                                        )}
                                                    </div>

                                                    {!s.effectuee && (
                                                        <button onClick={() => marquerEffectuee(s.id)} className="mt-3 w-full text-xs bg-sky-50 text-sky-600 px-2 py-2 rounded-xl border border-sky-200 hover:bg-sky-100 transition font-medium">
                                                            Marquer comme effectuée
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowBilanModal(false)} className="flex-1 border border-sky-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition">Fermer</button>
                            <button onClick={saveBilan} className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-sky-200 transition">
                                {selectedBilan ? 'Mettre à jour' : 'Créer le bilan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSeanceModal && (
                <div className="fixed inset-0 bg-sky-950 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-sky-200 border border-sky-100">
                        <div className="mb-4">
                            <h2 className="font-bold text-sky-950">Ajouter une séance</h2>
                            <p className="text-xs text-gray-400">{selectedBilan?.patientNom}</p>
                        </div>

                        {formError && <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl px-4 py-2 text-xs mb-3">{formError}</div>}
                        {formSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl px-4 py-2 text-xs mb-3">{formSuccess}</div>}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">Titre de la séance</label>
                                <input type="text" value={seanceForm.titre} onChange={(e) => setSeanceForm({ ...seanceForm, titre: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">Description</label>
                                <input type="text" value={seanceForm.description} onChange={(e) => setSeanceForm({ ...seanceForm, description: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">Date et heure</label>
                                <input type="datetime-local" value={seanceForm.dateSeance} onChange={(e) => setSeanceForm({ ...seanceForm, dateSeance: e.target.value })} className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400" />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowSeanceModal(false)} className="flex-1 border border-sky-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition">Annuler</button>
                            <button onClick={saveSeance} className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-sky-200 transition">Ajouter</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
