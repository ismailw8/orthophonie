import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

const RendezVous = () => {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        dateSouhaitee: '',
        motif: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axiosInstance.post('/api/rdv', form);
            setSuccess(true);
        } catch {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-20 text-center">
                    <div className="bg-white rounded-3xl p-12 shadow-xl shadow-sky-100 border border-sky-100">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-sky-950 mb-2">Demande envoyée !</h2>
                        <p className="text-gray-400 text-sm mb-2">
                            Nous vous contacterons dans les 24h pour confirmer votre rendez-vous.
                        </p>
                        <p className="text-gray-400 text-sm mb-8">
                            Vérifiez votre téléphone et votre email.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-8 py-3 rounded-2xl font-semibold text-sm hover:shadow-lg hover:shadow-sky-200 transition-all"
                        >
                            Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-12">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Aucune inscription requise
                    </div>
                    <h1 className="text-2xl font-bold text-sky-950 mb-2">Prendre un rendez-vous</h1>
                    <p className="text-gray-400 text-sm">
                        Remplissez ce formulaire et nous vous confirmerons par téléphone sous 24h.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-sky-100 border border-sky-100 p-8">

                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm mb-6">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-sky-900 mb-2">Prénom *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Youssef"
                                    className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-sky-50 placeholder-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-sky-900 mb-2">Nom *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Benali"
                                    className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-sky-50 placeholder-gray-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sky-900 mb-2">Téléphone *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                placeholder="+212 6 00 00 00 00"
                                className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-sky-50 placeholder-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sky-900 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="youssef@mail.com"
                                className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-sky-50 placeholder-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sky-900 mb-2">Date souhaitée *</label>
                            <input
                                type="date"
                                name="dateSouhaitee"
                                value={form.dateSouhaitee}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-sky-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-sky-900 mb-2">
                                Motif de la consultation
                                <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                            </label>
                            <input
                                type="text"
                                name="motif"
                                value={form.motif}
                                onChange={handleChange}
                                placeholder="Ex : bégaiement enfant 7 ans"
                                className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-sky-50 placeholder-gray-300"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-4 rounded-2xl text-sm font-semibold hover:shadow-lg hover:shadow-sky-200 transition-all disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Envoi en cours...
                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Envoyer la demande
                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RendezVous;