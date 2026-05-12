import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

const AdminDashboard = () => {
    const [rdvs, setRdvs] = useState([]);
    const [bilans, setBilans] = useState([]);
    const [seances, setSeances] = useState([]);
    const [activeTab, setActiveTab] = useState('rdvs');
    const [loading, setLoading] = useState(true);

    // Modals
    const [showBilanModal, setShowBilanModal] = useState(false);
    const [showSeanceModal, setShowSeanceModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedRdv, setSelectedRdv] = useState(null);
    const [selectedBilan, setSelectedBilan] = useState(null);

    // Formulaire bilan
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

    // Formulaire séance
    const [seanceForm, setSeanceForm] = useState({
        patientId: '',
        patientEmail: '',
        titre: '',
        description: '',
        dateSeance: '',
    });

    // Formulaire confirmation RDV
    const [confirmForm, setConfirmForm] = useState({
        dateConfirmee: '',
        notes: '',
    });

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
            setRdvs(rdvRes.data);
            setBilans(bilanRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSeances = async (patientId) => {
        try {
            const res = await axiosInstance.get(
                `/api/suivi/admin/seances/patient/${patientId}`
            );
            setSeances(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // ── RDV ──────────────────────────────────────────────────

    const ouvrirConfirmModal = (rdv) => {
        setSelectedRdv(rdv);
        setConfirmForm({ dateConfirmee: '', notes: '' });
        setFormError('');
        setFormSuccess('');
        setShowConfirmModal(true);
    };

    const confirmerRdv = async () => {
        if (!confirmForm.dateConfirmee) {
            setFormError('La date de confirmation est requise.');
            return;
        }
        try {
            await axiosInstance.put(
                `/api/rdv/admin/${selectedRdv.id}/confirmer`,
                confirmForm
            );
            setFormSuccess('RDV confirmé avec succès.');
            await fetchAll();
            setTimeout(() => setShowConfirmModal(false), 1000);
        } catch {
            setFormError('Erreur lors de la confirmation.');
        }
    };

    const annulerRdv = async (id) => {
        if (!window.confirm('Confirmer l\'annulation ?')) return;
        try {
            await axiosInstance.put(`/api/rdv/admin/${id}/annuler`);
            await fetchAll();
        } catch {
            alert('Erreur lors de l\'annulation.');
        }
    };

    // ── BILAN ─────────────────────────────────────────────────

    const ouvrirBilanModal = (bilan = null) => {
        setFormError('');
        setFormSuccess('');
        if (bilan) {
            setSelectedBilan(bilan);
            setBilanForm({
                patientId: bilan.patientId,
                patientEmail: bilan.patientEmail,
                patientNom: bilan.patientNom,
                seancesEffectuees: bilan.seancesEffectuees,
                seancesPrevues: bilan.seancesPrevues,
                progressionGlobale: bilan.progressionGlobale,
                axes: bilan.axes || [],
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
            setFormError('Email et nom du patient sont requis.');
            return;
        }
        try {
            if (selectedBilan) {
                await axiosInstance.put('/api/suivi/admin/bilans', bilanForm);
            } else {
                await axiosInstance.post('/api/suivi/admin/bilans', bilanForm);
            }
            setFormSuccess('Bilan sauvegardé avec succès.');
            await fetchAll();
            setTimeout(() => setShowBilanModal(false), 1000);
        } catch {
            setFormError('Erreur lors de la sauvegarde du bilan.');
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
        const newAxes = bilanForm.axes.filter((_, i) => i !== index);
        setBilanForm({ ...bilanForm, axes: newAxes });
    };

    // ── SÉANCE ────────────────────────────────────────────────

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
                dateSeance: seanceForm.dateSeance + ':00',
            });
            setFormSuccess('Séance ajoutée avec succès.');
            await fetchSeances(seanceForm.patientId);
            setTimeout(() => setShowSeanceModal(false), 1000);
        } catch {
            setFormError('Erreur lors de l\'ajout de la séance.');
        }
    };

    const marquerEffectuee = async (seanceId) => {
        try {
            await axiosInstance.put(
                `/api/suivi/admin/seances/${seanceId}/effectuee`
            );
            await fetchSeances(selectedBilan.patientId);
        } catch {
            alert('Erreur.');
        }
    };

    // ── UI HELPERS ────────────────────────────────────────────

    const statusBadge = (status) => {
        const styles = {
            EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
            CONFIRME: 'bg-green-100 text-green-700',
            ANNULE: 'bg-red-100 text-red-600',
            TERMINE: 'bg-gray-100 text-gray-600',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
        );
    };

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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-800">Dashboard Admin</h1>
                    <p className="text-gray-400 text-sm mt-1">Gestion des rendez-vous, bilans et séances</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total RDV', value: rdvs.length },
                        { label: 'En attente', value: rdvs.filter(r => r.status === 'EN_ATTENTE').length },
                        { label: 'Confirmés', value: rdvs.filter(r => r.status === 'CONFIRME').length },
                        { label: 'Patients suivis', value: bilans.length },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                            <p className="text-2xl font-semibold text-gray-800">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'rdvs', label: '📅 Rendez-vous' },
                        { key: 'patients', label: '👥 Patients & Bilans' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                activeTab === tab.key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── TAB RDV ── */}
                {activeTab === 'rdvs' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Patient', 'Téléphone', 'Date souhaitée', 'Motif', 'Statut', 'Actions'].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {rdvs.map((rdv) => (
                                <tr key={rdv.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {rdv.firstName} {rdv.lastName}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{rdv.phone}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(rdv.dateSouhaitee).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{rdv.motif || '—'}</td>
                                    <td className="px-4 py-3">{statusBadge(rdv.status)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            {rdv.status === 'EN_ATTENTE' && (
                                                <>
                                                    <button
                                                        onClick={() => ouvrirConfirmModal(rdv)}
                                                        className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100 transition"
                                                    >
                                                        Confirmer
                                                    </button>
                                                    <button
                                                        onClick={() => annulerRdv(rdv.id)}
                                                        className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition"
                                                    >
                                                        Annuler
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {rdvs.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-10">Aucun rendez-vous.</p>
                        )}
                    </div>
                )}

                {/* ── TAB PATIENTS ── */}
                {activeTab === 'patients' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => ouvrirBilanModal()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                + Nouveau bilan
                            </button>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {['Patient', 'Séances', 'Progression', 'Mise à jour', 'Actions'].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                {bilans.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">{b.patientNom}</p>
                                            <p className="text-xs text-gray-400">{b.patientEmail}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {b.seancesEffectuees} / {b.seancesPrevues}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-2 w-24">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${b.progressionGlobale}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600">{b.progressionGlobale}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {new Date(b.updatedAt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => ouvrirBilanModal(b)}
                                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
                                            >
                                                Gérer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {bilans.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-10">Aucun patient suivi.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAL CONFIRMATION RDV ── */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">Confirmer le rendez-vous</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            {selectedRdv?.firstName} {selectedRdv?.lastName} — {selectedRdv?.phone}
                        </p>

                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm mb-3">
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-2 text-sm mb-3">
                                {formSuccess}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Date confirmée</label>
                                <input
                                    type="datetime-local"
                                    value={confirmForm.dateConfirmee}
                                    onChange={(e) => setConfirmForm({ ...confirmForm, dateConfirmee: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Notes (optionnel)</label>
                                <textarea
                                    value={confirmForm.notes}
                                    onChange={(e) => setConfirmForm({ ...confirmForm, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Notes sur la séance..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmerRdv}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL BILAN ── */}
            {showBilanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50 px-4 py-6 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {selectedBilan ? 'Modifier le bilan' : 'Nouveau bilan'}
                        </h2>

                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm mb-3">
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-2 text-sm mb-3">
                                {formSuccess}
                            </div>
                        )}

                        <div className="space-y-4">

                            {/* Infos patient */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Nom complet patient</label>
                                    <input
                                        type="text"
                                        value={bilanForm.patientNom}
                                        onChange={(e) => setBilanForm({ ...bilanForm, patientNom: e.target.value })}
                                        placeholder="Youssef Benali"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Email patient</label>
                                    <input
                                        type="email"
                                        value={bilanForm.patientEmail}
                                        onChange={(e) => setBilanForm({ ...bilanForm, patientEmail: e.target.value })}
                                        placeholder="youssef@test.com"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Patient ID (MongoDB)</label>
                                <input
                                    type="text"
                                    value={bilanForm.patientId}
                                    onChange={(e) => setBilanForm({ ...bilanForm, patientId: e.target.value })}
                                    placeholder="6640abc123def456789012"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Séances */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Séances effectuées</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bilanForm.seancesEffectuees}
                                        onChange={(e) => setBilanForm({ ...bilanForm, seancesEffectuees: parseInt(e.target.value) })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Séances prévues</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bilanForm.seancesPrevues}
                                        onChange={(e) => setBilanForm({ ...bilanForm, seancesPrevues: parseInt(e.target.value) })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Progression globale %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={bilanForm.progressionGlobale}
                                        onChange={(e) => setBilanForm({ ...bilanForm, progressionGlobale: parseInt(e.target.value) })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Axes */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-gray-600 font-medium">Axes de progression</label>
                                    <button
                                        onClick={ajouterAxe}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        + Ajouter un axe
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {bilanForm.axes.map((axe, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={axe.nom}
                                                    onChange={(e) => updateAxe(index, 'nom', e.target.value)}
                                                    placeholder="Nom de l'axe"
                                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={axe.pourcentage}
                                                    onChange={(e) => updateAxe(index, 'pourcentage', parseInt(e.target.value))}
                                                    placeholder="%"
                                                    className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    onClick={() => supprimerAxe(index)}
                                                    className="text-red-400 hover:text-red-600 text-sm px-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-blue-500 h-1.5 rounded-full"
                                                    style={{ width: `${axe.pourcentage}%` }}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={axe.commentaire}
                                                onChange={(e) => updateAxe(index, 'commentaire', e.target.value)}
                                                placeholder="Commentaire..."
                                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Remarques */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Remarques générales</label>
                                <textarea
                                    value={bilanForm.remarques}
                                    onChange={(e) => setBilanForm({ ...bilanForm, remarques: e.target.value })}
                                    rows={3}
                                    placeholder="Observations sur le patient..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Séances du patient */}
                            {selectedBilan && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm text-gray-600 font-medium">
                                            Séances ({seances.length})
                                        </label>
                                        <button
                                            onClick={ouvrirSeanceModal}
                                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
                                        >
                                            + Ajouter séance
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {seances.length === 0 ? (
                                            <p className="text-gray-400 text-xs text-center py-4">
                                                Aucune séance enregistrée.
                                            </p>
                                        ) : (
                                            seances.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{s.titre}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(s.dateSeance).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    </div>
                                                    {s.effectuee ? (
                                                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                              ✓ Effectuée
                            </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => marquerEffectuee(s.id)}
                                                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition"
                                                        >
                                                            Marquer effectuée
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
                            <button
                                onClick={() => setShowBilanModal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                            >
                                Fermer
                            </button>
                            <button
                                onClick={saveBilan}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                            >
                                {selectedBilan ? 'Mettre à jour' : 'Créer le bilan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL SÉANCE ── */}
            {showSeanceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ajouter une séance</h2>

                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm mb-3">
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-2 text-sm mb-3">
                                {formSuccess}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Titre de la séance</label>
                                <input
                                    type="text"
                                    value={seanceForm.titre}
                                    onChange={(e) => setSeanceForm({ ...seanceForm, titre: e.target.value })}
                                    placeholder="Séance 9 — Articulation avancée"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Description (optionnel)</label>
                                <input
                                    type="text"
                                    value={seanceForm.description}
                                    onChange={(e) => setSeanceForm({ ...seanceForm, description: e.target.value })}
                                    placeholder="Travail sur les phonèmes..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Date et heure</label>
                                <input
                                    type="datetime-local"
                                    value={seanceForm.dateSeance}
                                    onChange={(e) => setSeanceForm({ ...seanceForm, dateSeance: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => setShowSeanceModal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={saveSeance}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;