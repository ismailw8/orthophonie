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
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Une erreur est survenue. Veuillez réessayer.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-20 text-center">
                    <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Demande envoyée !
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Nous vous contacterons sous 24h pour confirmer votre rendez-vous.
                        </p>
                        <Link
                            to="/"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                            Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-lg mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h1 className="text-xl font-semibold text-gray-800 mb-1">
                        Prendre un rendez-vous
                    </h1>
                    <p className="text-gray-400 text-sm mb-6">
                        Aucune inscription requise. Nous vous contacterons pour confirmer.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Prénom</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Youssef"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Nom</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Benali"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                placeholder="+212 6 00 00 00 00"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="youssef@mail.com"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Date souhaitée
                            </label>
                            <input
                                type="date"
                                name="dateSouhaitee"
                                value={form.dateSouhaitee}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">
                                Motif (optionnel)
                            </label>
                            <input
                                type="text"
                                name="motif"
                                value={form.motif}
                                onChange={handleChange}
                                placeholder="Ex : bégaiement enfant 7 ans"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RendezVous;