import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-blue-600 font-bold text-2xl">AB</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Dr. Amina Berrada
                    </h1>
                    <p className="text-blue-600 font-medium mb-4">
                        Orthophoniste certifiée — N° ordre 2847
                    </p>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
                        Spécialiste en rééducation du langage, de la parole, de la voix et
                        de la déglutition chez l'enfant et l'adulte. Prise en charge
                        bilingue arabe / français.
                    </p>
                    <Link
                        to="/rendez-vous"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Prendre un rendez-vous
                    </Link>
                </div>
            </section>

            {/* Spécialités */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-xl font-semibold text-gray-800 mb-8 text-center">
                    Spécialités
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: '🗣️', title: 'Bégaiement', desc: 'Troubles de la fluidité verbale' },
                        { icon: '📚', title: 'Dyslexie', desc: 'Difficultés de lecture et écriture' },
                        { icon: '🧠', title: 'Autisme (TSA)', desc: 'Troubles du spectre autistique' },
                        { icon: '💬', title: 'Aphasie', desc: 'Rééducation post-AVC' },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition"
                        >
                            <div className="text-3xl mb-3">{item.icon}</div>
                            <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                            <p className="text-gray-500 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Infos pratiques */}
            <section className="bg-white border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-xl font-semibold text-gray-800 mb-8 text-center">
                        Informations pratiques
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            {
                                icon: '📍',
                                title: 'Cabinet',
                                info: '12 Rue Ibn Batouta, Tanger',
                            },
                            {
                                icon: '🕐',
                                title: 'Horaires',
                                info: 'Lundi – Vendredi : 9h – 17h',
                            },
                            {
                                icon: '📞',
                                title: 'Contact',
                                info: '+212 6 00 00 00 00',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="text-center p-6 bg-gray-50 rounded-xl"
                            >
                                <div className="text-3xl mb-3">{item.icon}</div>
                                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                                <p className="text-gray-500 text-sm">{item.info}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm">
                © 2026 Dr. Amina Berrada — Orthophoniste. Tous droits réservés.
            </footer>
        </div>
    );
};

export default Home;