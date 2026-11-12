import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import axiosInstance from "../api/axios";

const STATUS_CONFIG = {
    EN_ATTENTE: {
        label: "En attente",
        className: "bg-amber-50 text-amber-600 border border-amber-200",
    },
    CONFIRME: {
        label: "Confirmé",
        className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    },
    ANNULE: {
        label: "Annulé",
        className: "bg-red-50 text-red-500 border border-red-200",
    },
    TERMINE: {
        label: "Terminé",
        className: "bg-sky-50 text-sky-600 border border-sky-200",
    },
};

const normalize = (value) =>
    String(value || "")
        .toLowerCase()
        .trim();

const parseDateValue = (value) => {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (value) => {
    const date = value instanceof Date ? value : parseDateValue(value);
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getRdvDateValue = (rdv) => {
    if (rdv.dateConfirmee) return rdv.dateConfirmee;

    if (rdv.dateSouhaitee && rdv.heureSouhaitee) {
        return `${rdv.dateSouhaitee}T${rdv.heureSouhaitee}`;
    }

    return rdv.dateSouhaitee || rdv.createdAt || null;
};

const formatDate = (value) => {
    const date = parseDateValue(value);
    if (!date) return "Date non définie";

    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    const date = parseDateValue(value);
    if (!date) return "Date non définie";

    const hasTime = typeof value === "string" && value.includes("T");

    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        ...(hasTime && {
            hour: "2-digit",
            minute: "2-digit",
        }),
    });
};

const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.trim().toUpperCase() || "P";
};

const AdminDashboard = () => {
    const [rdvs, setRdvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [rdvSearch, setRdvSearch] = useState("");
    const [rdvSearchField, setRdvSearchField] = useState("all");
    const [rdvSortBy, setRdvSortBy] = useState("date_desc");
    const [rdvStatusFilter, setRdvStatusFilter] = useState("all");
    const [selectedDate, setSelectedDate] = useState("");
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedRdv, setSelectedRdv] = useState(null);
    const [confirmForm, setConfirmForm] = useState({
        dateConfirmee: "",
        notes: "",
    });
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRdvs = async () => {
        try {
            setLoadError("");
            const response = await axiosInstance.get("/api/rdv/admin");
            setRdvs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erreur lors du chargement des rendez-vous :", error);
            setLoadError("Impossible de charger les rendez-vous.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRdvs();
    }, []);

    const filteredRdvs = useMemo(() => {
        const search = normalize(rdvSearch);

        return [...rdvs]
            .filter((rdv) => {
                if (rdvStatusFilter !== "all" && rdv.status !== rdvStatusFilter) {
                    return false;
                }

                if (selectedDate && toDateKey(getRdvDateValue(rdv)) !== selectedDate) {
                    return false;
                }

                if (!search) return true;

                const values = {
                    firstName: normalize(rdv.firstName),
                    lastName: normalize(rdv.lastName),
                    phone: normalize(rdv.phone),
                    email: normalize(rdv.email),
                };

                if (rdvSearchField === "all") {
                    return Object.values(values).some((value) => value.includes(search));
                }

                return values[rdvSearchField]?.includes(search);
            })
            .sort((firstRdv, secondRdv) => {
                if (rdvSortBy === "nom_asc") {
                    return normalize(firstRdv.lastName).localeCompare(
                        normalize(secondRdv.lastName),
                    );
                }

                if (rdvSortBy === "nom_desc") {
                    return normalize(secondRdv.lastName).localeCompare(
                        normalize(firstRdv.lastName),
                    );
                }

                if (rdvSortBy === "prenom_asc") {
                    return normalize(firstRdv.firstName).localeCompare(
                        normalize(secondRdv.firstName),
                    );
                }

                if (rdvSortBy === "email_asc") {
                    return normalize(firstRdv.email).localeCompare(
                        normalize(secondRdv.email),
                    );
                }

                if (rdvSortBy === "phone_asc") {
                    return normalize(firstRdv.phone).localeCompare(
                        normalize(secondRdv.phone),
                    );
                }

                const firstDate =
                    parseDateValue(getRdvDateValue(firstRdv))?.getTime() || 0;
                const secondDate =
                    parseDateValue(getRdvDateValue(secondRdv))?.getTime() || 0;

                return rdvSortBy === "date_asc"
                    ? firstDate - secondDate
                    : secondDate - firstDate;
            });
    }, [
        rdvs,
        rdvSearch,
        rdvSearchField,
        rdvSortBy,
        rdvStatusFilter,
        selectedDate,
    ]);

    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const days = [];

        for (let index = 0; index < startOffset; index += 1) {
            days.push({ key: `empty-${index}`, empty: true });
        }

        for (let day = 1; day <= lastDay.getDate(); day += 1) {
            const date = new Date(year, month, day);
            const key = toDateKey(date);
            const dayRdvs = rdvs.filter(
                (rdv) => toDateKey(getRdvDateValue(rdv)) === key,
            );

            days.push({ key, day, rdvs: dayRdvs });
        }

        return days;
    }, [calendarMonth, rdvs]);

    const selectedDateRdvs = useMemo(() => {
        if (!selectedDate) return [];

        return rdvs.filter(
            (rdv) => toDateKey(getRdvDateValue(rdv)) === selectedDate,
        );
    }, [rdvs, selectedDate]);

    const todayKey = toDateKey(new Date());
    const todayCount = rdvs.filter(
        (rdv) => toDateKey(getRdvDateValue(rdv)) === todayKey,
    ).length;
    const pendingCount = rdvs.filter((rdv) => rdv.status === "EN_ATTENTE").length;
    const confirmedCount = rdvs.filter((rdv) => rdv.status === "CONFIRME").length;

    const changeMonth = (direction) => {
        setCalendarMonth(
            (currentMonth) =>
                new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + direction,
                    1,
                ),
        );
    };

    const resetRdvFilters = () => {
        setRdvSearch("");
        setRdvSearchField("all");
        setRdvSortBy("date_desc");
        setRdvStatusFilter("all");
        setSelectedDate("");
    };

    const ouvrirConfirmModal = (rdv) => {
        const desiredDateTime = rdv.dateSouhaitee
            ? `${rdv.dateSouhaitee}T${rdv.heureSouhaitee || "09:00"}`
            : "";

        setSelectedRdv(rdv);
        setConfirmForm({
            dateConfirmee: desiredDateTime,
            notes: "",
        });
        setFormError("");
        setFormSuccess("");
        setShowConfirmModal(true);
    };

    const fermerConfirmModal = () => {
        if (actionLoading) return;
        setShowConfirmModal(false);
        setSelectedRdv(null);
        setFormError("");
        setFormSuccess("");
    };

    const confirmerRdv = async () => {
        if (!selectedRdv?.id) {
            setFormError("Rendez-vous invalide.");
            return;
        }

        if (!confirmForm.dateConfirmee) {
            setFormError("La date et l’heure confirmées sont requises.");
            return;
        }

        try {
            setActionLoading(true);
            setFormError("");

            await axiosInstance.put(
                `/api/rdv/admin/${selectedRdv.id}/confirmer`,
                confirmForm,
            );

            setFormSuccess("Rendez-vous confirmé avec succès.");
            await fetchRdvs();

            window.setTimeout(() => {
                setShowConfirmModal(false);
                setSelectedRdv(null);
            }, 800);
        } catch (error) {
            console.error("Erreur lors de la confirmation :", error);
            setFormError(
                error.response?.data?.message || "Erreur lors de la confirmation.",
            );
        } finally {
            setActionLoading(false);
        }
    };

    const annulerRdv = async (rdvId) => {
        if (!window.confirm("Confirmer l'annulation de ce rendez-vous ?")) {
            return;
        }

        try {
            await axiosInstance.put(`/api/rdv/admin/${rdvId}/annuler`);
            await fetchRdvs();
        } catch (error) {
            console.error("Erreur lors de l'annulation :", error);
            window.alert("Erreur lors de l'annulation.");
        }
    };

    const terminerRdv = async (rdvId) => {
        if (!window.confirm("Marquer ce rendez-vous comme terminé ?")) return;
        try {
            await axiosInstance.put(`/api/rdv/admin/${rdvId}/terminer`);
            await fetchRdvs();
        } catch (error) {
            console.error("Erreur lors de la clôture :", error);
            window.alert(error.response?.data?.message || "Erreur lors de la clôture.");
        }
    };

    const stats = [
        {
            label: "Aujourd’hui",
            value: todayCount,
            description: "Rendez-vous prévus ce jour",
            iconBg: "from-sky-400 to-cyan-500",
            badge: todayCount > 0 ? "Agenda actif" : "Aucun RDV",
            badgeClass:
                todayCount > 0
                    ? "bg-sky-50 text-sky-600 border-sky-100"
                    : "bg-gray-50 text-gray-400 border-gray-100",
        },
        {
            label: "En attente",
            value: pendingCount,
            description: "Demandes à traiter rapidement",
            iconBg: "from-amber-400 to-orange-500",
            badge: pendingCount > 0 ? "À traiter" : "À jour",
            badgeClass:
                pendingCount > 0
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100",
        },
        {
            label: "Confirmés",
            value: confirmedCount,
            description: "Rendez-vous planifiés",
            iconBg: "from-emerald-400 to-green-500",
            badge: "Planifiés",
            badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
        },
        {
            label: "Total",
            value: rdvs.length,
            description: "Toutes les demandes reçues",
            iconBg: "from-violet-400 to-purple-500",
            badge: "Historique",
            badgeClass: "bg-violet-50 text-violet-600 border-violet-100",
        },
    ];

    if (loading) {
        return (
            <AdminLayout>

                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4" />
                        <p className="text-sky-400 text-sm">Chargement du dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-sky-950">
                            Dashboard Administration
                        </h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            Tableau de bord, calendrier et gestion des rendez-vous.
                        </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-white border border-sky-100 rounded-2xl px-4 py-2 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-sky-700 font-medium">
              Système actif
            </span>
                    </div>
                </div>

                {loadError && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {loadError}
                    </div>
                )}

                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                    {stats.map((stat) => (
                        <article
                            key={stat.label}
                            className="relative overflow-hidden bg-white rounded-3xl p-6 border border-sky-100 shadow-sm hover:shadow-lg hover:shadow-sky-100 transition-all group"
                        >
                            <div className="absolute -right-8 -top-8 w-28 h-28 bg-sky-50 rounded-full opacity-70 group-hover:scale-110 transition-transform" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div
                                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center shadow-md`}
                                    >
                                        <svg
                                            className="w-6 h-6 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>

                                    <span
                                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${stat.badgeClass}`}
                                    >
                    {stat.badge}
                  </span>
                                </div>

                                <p className="text-sm font-semibold text-gray-400 mb-1">
                                    {stat.label}
                                </p>
                                <p className="text-4xl font-black text-sky-950 leading-none">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-gray-400 mt-3">{stat.description}</p>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                            <div>
                                <h2 className="font-bold text-sky-950 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full" />
                                    Calendrier et liste des rendez-vous
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Recherchez et filtrez les demandes par statut ou par date.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {["EN_ATTENTE", "CONFIRME", "ANNULE"].map((status) => (
                                    <span
                                        key={status}
                                        className={`text-xs px-2 py-1 rounded-full ${STATUS_CONFIG[status].className}`}
                                    >
                    {rdvs.filter((rdv) => rdv.status === status).length}{" "}
                                        {STATUS_CONFIG[status].label}
                  </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
                            <div className="xl:col-span-1 bg-sky-50 rounded-3xl border border-sky-100 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        type="button"
                                        onClick={() => changeMonth(-1)}
                                        className="w-9 h-9 rounded-xl bg-white border border-sky-100 text-sky-600 hover:bg-sky-100 transition"
                                        aria-label="Mois précédent"
                                    >
                                        ‹
                                    </button>

                                    <div className="text-center">
                                        <p className="font-bold text-sky-950 capitalize">
                                            {calendarMonth.toLocaleDateString("fr-FR", {
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Cliquez sur un jour pour filtrer
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => changeMonth(1)}
                                        className="w-9 h-9 rounded-xl bg-white border border-sky-100 text-sky-600 hover:bg-sky-100 transition"
                                        aria-label="Mois suivant"
                                    >
                                        ›
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
                                        <div
                                            key={`${day}-${index}`}
                                            className="text-center text-[11px] font-bold text-sky-400 py-1"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day) => {
                                        if (day.empty) {
                                            return <div key={day.key} className="h-12" />;
                                        }

                                        const isSelected = selectedDate === day.key;
                                        const hasRdvs = day.rdvs.length > 0;

                                        return (
                                            <button
                                                key={day.key}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedDate(isSelected ? "" : day.key)
                                                }
                                                className={`h-12 rounded-xl text-xs border transition-all flex flex-col items-center justify-center ${
                                                    isSelected
                                                        ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200"
                                                        : hasRdvs
                                                            ? "bg-white text-sky-800 border-sky-200 hover:bg-sky-100"
                                                            : "bg-white/70 text-gray-400 border-transparent hover:border-sky-100"
                                                }`}
                                            >
                                                <span className="font-semibold">{day.day}</span>

                                                {hasRdvs && (
                                                    <span
                                                        className={`mt-0.5 text-[10px] px-1.5 rounded-full ${
                                                            isSelected
                                                                ? "bg-white text-sky-600"
                                                                : "bg-sky-100 text-sky-600"
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
                                            <p className="text-xs font-bold text-sky-800 capitalize">
                                                {formatDate(selectedDate)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDate("")}
                                                className="text-xs text-gray-400 hover:text-red-500"
                                            >
                                                Effacer
                                            </button>
                                        </div>

                                        {selectedDateRdvs.length === 0 ? (
                                            <p className="text-xs text-gray-300">
                                                Aucun rendez-vous ce jour.
                                            </p>
                                        ) : (
                                            <div className="space-y-2 max-h-44 overflow-y-auto">
                                                {selectedDateRdvs.map((rdv) => (
                                                    <div
                                                        key={rdv.id}
                                                        className="text-xs bg-sky-50 rounded-xl p-3 border border-sky-100"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-semibold text-sky-950">
                                                                    {rdv.firstName} {rdv.lastName}
                                                                </p>
                                                                <p className="text-gray-400 mt-0.5">
                                                                    {rdv.phone ||
                                                                        rdv.email ||
                                                                        "Contact non renseigné"}
                                                                </p>
                                                                <p className="text-sky-600 font-medium mt-0.5 capitalize">
                                                                    {formatDateTime(getRdvDateValue(rdv))}
                                                                </p>
                                                            </div>

                                                            <span
                                                                className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                                                                    STATUS_CONFIG[rdv.status]?.className ||
                                                                    "bg-gray-50 text-gray-500 border border-gray-200"
                                                                }`}
                                                            >
                                {STATUS_CONFIG[rdv.status]?.label ||
                                    rdv.status ||
                                    "Non défini"}
                              </span>
                                                        </div>
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
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">
                                            Recherche
                                        </label>
                                        <input
                                            type="text"
                                            value={rdvSearch}
                                            onChange={(event) => setRdvSearch(event.target.value)}
                                            placeholder="Nom, prénom, téléphone ou email..."
                                            className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">
                                            Filtrer par
                                        </label>
                                        <select
                                            value={rdvSearchField}
                                            onChange={(event) =>
                                                setRdvSearchField(event.target.value)
                                            }
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
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">
                                            Statut
                                        </label>
                                        <select
                                            value={rdvStatusFilter}
                                            onChange={(event) =>
                                                setRdvStatusFilter(event.target.value)
                                            }
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
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">
                                            Tri
                                        </label>
                                        <select
                                            value={rdvSortBy}
                                            onChange={(event) => setRdvSortBy(event.target.value)}
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
                                        <label className="block text-xs font-medium text-sky-900 mb-1.5">
                                            Date sélectionnée
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(event) => setSelectedDate(event.target.value)}
                                            className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={resetRdvFilters}
                                            className="w-full border border-sky-200 text-sky-600 bg-white py-2 rounded-xl text-sm font-medium hover:bg-sky-100 transition"
                                        >
                                            Réinitialiser
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                                    <span>{filteredRdvs.length} résultat(s) affiché(s)</span>
                                    {selectedDate && (
                                        <span className="capitalize">
                      Filtré sur : {formatDate(selectedDate)}
                    </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {filteredRdvs.length === 0 ? (
                            <div className="text-center py-16 bg-sky-50 rounded-3xl border border-sky-100">
                                <p className="text-gray-300 text-sm">
                                    Aucun rendez-vous trouvé
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredRdvs.map((rdv) => (
                                    <article
                                        key={rdv.id}
                                        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-sky-50 rounded-2xl border border-sky-100 hover:border-sky-200 transition-all"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white text-sm font-bold">
                          {getInitials(rdv.firstName, rdv.lastName)}
                        </span>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-sky-950 text-sm">
                                                    {rdv.firstName} {rdv.lastName}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">
                            {rdv.phone || "Téléphone non renseigné"}
                          </span>
                                                    {rdv.email && (
                                                        <span className="text-xs text-gray-400">
                              · {rdv.email}
                            </span>
                                                    )}
                                                    <span className="text-xs text-sky-600 font-medium capitalize">
                            · {formatDateTime(getRdvDateValue(rdv))}
                          </span>
                                                    {rdv.motif && (
                                                        <span className="text-xs text-sky-500">
                              · {rdv.motif}
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                              STATUS_CONFIG[rdv.status]?.className ||
                              "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                      >
                        {STATUS_CONFIG[rdv.status]?.label ||
                            rdv.status ||
                            "Non défini"}
                      </span>

                                            {rdv.status === "EN_ATTENTE" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => ouvrirConfirmModal(rdv)}
                                                        className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-600 transition shadow-sm shadow-emerald-200"
                                                    >
                                                        Confirmer
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => annulerRdv(rdv.id)}
                                                        className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            )}
                                            {rdv.status === "CONFIRME" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => terminerRdv(rdv.id)}
                                                        className="bg-sky-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-sky-600 transition"
                                                    >
                                                        Terminer
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => annulerRdv(rdv.id)}
                                                        className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-6 shadow-2xl shadow-sky-200">
                        <div className="mb-4">
                            <h2 className="font-bold text-sky-950">
                                Confirmer le rendez-vous
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                {selectedRdv?.firstName} {selectedRdv?.lastName}
                                {selectedRdv?.phone ? ` — ${selectedRdv.phone}` : ""}
                            </p>
                            {selectedRdv?.dateSouhaitee && (
                                <p className="text-xs text-sky-600 font-medium mt-1 capitalize">
                                    Demande : {formatDateTime(getRdvDateValue(selectedRdv))}
                                </p>
                            )}
                        </div>

                        {formError && (
                            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-500">
                                {formError}
                            </div>
                        )}

                        {formSuccess && (
                            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-600">
                                {formSuccess}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">
                                    Date et heure confirmées
                                </label>
                                <input
                                    type="datetime-local"
                                    value={confirmForm.dateConfirmee}
                                    onChange={(event) =>
                                        setConfirmForm((currentForm) => ({
                                            ...currentForm,
                                            dateConfirmee: event.target.value,
                                        }))
                                    }
                                    className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-sky-900 mb-1.5">
                                    Notes
                                </label>
                                <textarea
                                    value={confirmForm.notes}
                                    onChange={(event) =>
                                        setConfirmForm((currentForm) => ({
                                            ...currentForm,
                                            notes: event.target.value,
                                        }))
                                    }
                                    rows={3}
                                    placeholder="Notes concernant le rendez-vous..."
                                    className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                type="button"
                                onClick={fermerConfirmModal}
                                disabled={actionLoading}
                                className="flex-1 border border-sky-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-sky-50 transition disabled:opacity-60"
                            >
                                Fermer
                            </button>
                            <button
                                type="button"
                                onClick={confirmerRdv}
                                disabled={actionLoading}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-emerald-200 transition disabled:opacity-60"
                            >
                                {actionLoading ? "Confirmation..." : "Confirmer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;
