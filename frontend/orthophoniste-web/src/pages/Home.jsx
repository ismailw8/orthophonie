import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const specialites = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
            </svg>
        ),
        title: 'Bégaiement',
        desc: "Le bégaiement est un trouble de la fluidité verbale qui peut toucher l’enfant, l’adolescent ou l’adulte. La prise en charge orthophonique vise à améliorer le rythme de la parole, réduire les blocages, renforcer la confiance à l’oral et accompagner le patient dans les situations de communication du quotidien.",
        points: ['Fluidité verbale', 'Confiance à l’oral', 'Suivi personnalisé'],
        color: 'from-sky-50 to-sky-100 border-sky-200',
        iconColor: 'bg-sky-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
            </svg>
        ),
        title: 'Dyslexie',
        desc: "La dyslexie concerne les difficultés durables liées à la lecture, à l’identification des mots, à la compréhension écrite et parfois à l’orthographe. L’accompagnement permet de travailler les stratégies de lecture, la conscience phonologique, la mémorisation et l’autonomie scolaire.",
        points: ['Lecture', 'Compréhension', 'Stratégies scolaires'],
        color: 'from-cyan-50 to-cyan-100 border-cyan-200',
        iconColor: 'bg-cyan-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
            </svg>
        ),
        title: 'Autisme (TSA)',
        desc: "L’accompagnement des troubles du spectre de l’autisme vise à développer la communication, les interactions sociales, la compréhension des consignes et l’expression des besoins. Les séances peuvent intégrer des supports visuels, des routines structurées et des exercices adaptés au profil de chaque enfant.",
        points: ['Communication', 'Interactions sociales', 'Supports adaptés'],
        color: 'from-indigo-50 to-indigo-100 border-indigo-200',
        iconColor: 'bg-indigo-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        ),
        title: 'Aphasie',
        desc: "L’aphasie apparaît souvent après un AVC ou une atteinte neurologique et peut perturber la parole, la compréhension, la lecture ou l’écriture. La rééducation orthophonique aide le patient à récupérer ses capacités de communication et à mettre en place des stratégies compensatoires.",
        points: ['Post-AVC', 'Langage oral', 'Rééducation neurologique'],
        color: 'from-emerald-50 to-emerald-100 border-emerald-200',
        iconColor: 'bg-emerald-500',
    },
];

const socialLinks = [
    {
        name: 'Instagram',
        username: 'soulaymane.zemzam',
        href: 'https://www.instagram.com/soulaymane.zemzam',
        desc: 'Conseils, publications et actualités du cabinet.',
        color: 'from-pink-50 to-rose-100 border-rose-200',
        iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5" strokeWidth={1.8} />
                <circle cx="12" cy="12" r="4" strokeWidth={1.8} />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    {
        name: 'TikTok',
        username: '@soulaymane.zemzam',
        href: 'https://www.tiktok.com/@soulaymane.zemzam',
        desc: 'Vidéos courtes, sensibilisation et contenus éducatifs.',
        color: 'from-slate-50 to-slate-100 border-slate-200',
        iconBg: 'bg-slate-900',
        icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 3c.4 2.3 1.8 3.8 4 4.1v3.1c-1.5 0-2.9-.5-4-1.3v5.9c0 3.1-2.4 5.2-5.4 5.2-2.8 0-5.1-2.1-5.1-4.8 0-3 2.4-5 5.5-4.8v3.2c-1.2-.2-2.2.4-2.2 1.5 0 .9.7 1.6 1.7 1.6 1.1 0 1.9-.7 1.9-2.1V3h3.6z" />
            </svg>
        ),
    },
    {
        name: 'WhatsApp Business',
        username: '+212 6 00 00 00 00',
        href: 'https://wa.me/212600000000',
        desc: 'Contact professionnel pour rendez-vous et informations.',
        color: 'from-emerald-50 to-emerald-100 border-emerald-200',
        iconBg: 'bg-emerald-500',
        icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.27-1.38c1.45.79 3.08 1.21 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2zm0 18.15h-.01c-1.51 0-2.98-.41-4.26-1.18l-.31-.18-3.13.82.84-3.05-.2-.31c-.84-1.33-1.28-2.83-1.28-4.34 0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.83 2.42 1.56 1.56 2.42 3.63 2.42 5.83 0 4.55-3.7 8.24-8.26 8.24zm4.52-6.18c-.25-.12-1.47-.73-1.7-.81-.23-.08-.4-.12-.56.12-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.38-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.02 2.61c.12.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.29z" />
            </svg>
        ),
    },
];

const Home = () => {
    return (
        <div
            className="min-h-screen bg-cover bg-center bg-fixed relative"
            style={{
                backgroundImage: "url('/images/home-bg.jpg')",
            }}
        >
            {/* Overlay pour garder le texte lisible */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50/95 via-white/90 to-white/95"></div>

            <div className="relative z-10">
                <Navbar />

                {/* Hero */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Left */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-sky-100/90 text-sky-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-sm">
                                <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                                Cabinet disponible — Lun. au Ven.
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-bold text-sky-950 leading-tight mb-4">
                                Retrouvez le plaisir
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-500">
                                    {' '}de communiquer
                                </span>
                            </h1>

                            <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-xl">
                                Zamzem Soulaymane, orthophoniste, vous accompagne dans votre
                                rééducation du langage, de la parole et de la voix.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                                <Link
                                    to="/rendez-vous"
                                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm hover:shadow-lg hover:shadow-sky-200 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    Prendre rendez-vous
                                </Link>

                                <a
                                    href="#specialites"
                                    className="inline-flex items-center justify-center gap-2 bg-white/90 text-sky-700 border border-sky-200 px-8 py-3.5 rounded-2xl font-semibold text-sm hover:bg-sky-50 transition-all"
                                >
                                    Nos spécialités
                                </a>
                            </div>
                        </div>

                        {/* Right — carte docteur */}
                        <div className="flex-1 flex justify-center">
                            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-sky-100 border border-sky-100 p-8 max-w-sm w-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">ZS</span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-sky-950">Zamzem Soulaymane</h3>
                                        <p className="text-sky-500 text-xs">Orthophoniste</p>
                                        <p className="text-gray-400 text-xs">N° ordre 2847</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {[
                                        { icon: '🎓', label: "12 ans d'expérience clinique" },
                                        { icon: '🌍', label: 'Bilingue arabe / français' },
                                        { icon: '🏥', label: 'Membre AMO' },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center gap-3 bg-sky-50 rounded-xl px-3 py-2"
                                        >
                                            <span className="text-base">{item.icon}</span>
                                            <span className="text-xs text-sky-800 font-medium">{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-sky-100 pt-4 grid grid-cols-3 gap-2 text-center">
                                    {[
                                        { value: '500+', label: 'Patients' },
                                        { value: '12', label: 'Ans exp.' },
                                        { value: '4.9', label: 'Note' },
                                    ].map((stat) => (
                                        <div key={stat.label}>
                                            <p className="font-bold text-sky-700 text-sm">{stat.value}</p>
                                            <p className="text-gray-400 text-xs">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Spécialités */}
                <section id="specialites" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-sky-950 mb-3">Nos spécialités</h2>
                        <p className="text-gray-500 text-sm md:text-base">
                            Une prise en charge adaptée à chaque patient, selon son âge, ses besoins et son rythme d’évolution.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {specialites.map((s) => (
                            <div
                                key={s.title}
                                className={`bg-gradient-to-b ${s.color} border rounded-3xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                            >
                                <div className="flex flex-col sm:flex-row items-start gap-5">
                                    <div
                                        className={`w-14 h-14 ${s.iconColor} rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0`}
                                    >
                                        {s.icon}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-sky-950 mb-3 text-lg">{s.title}</h3>

                                        <p className="text-gray-600 text-sm leading-relaxed mb-5">
                                            {s.desc}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {s.points.map((point) => (
                                                <span
                                                    key={point}
                                                    className="bg-white/70 text-sky-800 border border-white px-3 py-1 rounded-full text-xs font-medium"
                                                >
                                                    {point}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Réseaux sociaux */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="bg-white/95 backdrop-blur-sm border border-sky-100 rounded-3xl shadow-lg shadow-sky-100 p-8">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
                                    <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                                    Contact professionnel
                                </div>

                                <h2 className="text-2xl font-bold text-sky-950 mb-3">
                                    Suivez M. Soulaymane sur les réseaux sociaux
                                </h2>

                                <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                                    Retrouvez les actualités du cabinet, les conseils en orthophonie,
                                    les contenus de sensibilisation ainsi que les moyens de contact
                                    professionnels de Zamzem Soulaymane.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`group bg-gradient-to-b ${social.color} border rounded-2xl p-5 hover:shadow-md hover:-translate-y-1 transition-all`}
                                    >
                                        <div
                                            className={`w-12 h-12 ${social.iconBg} rounded-2xl flex items-center justify-center text-white mb-4 shadow-md`}
                                        >
                                            {social.icon}
                                        </div>

                                        <h3 className="font-bold text-sky-950 text-sm mb-1">
                                            {social.name}
                                        </h3>

                                        <p className="text-sky-700 text-xs font-semibold mb-2">
                                            {social.username}
                                        </p>

                                        <p className="text-gray-500 text-xs leading-relaxed">
                                            {social.desc}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Infos pratiques */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-3xl p-8 lg:p-12 shadow-xl shadow-sky-100">
                        <div className="text-center mb-10">
                            <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                Informations pratiques
                            </span>

                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                                Cabinet Zamzem Soulaymane
                            </h2>

                            <p className="text-sky-100 text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
                                Retrouvez toutes les informations nécessaires pour contacter le cabinet,
                                prendre rendez-vous et organiser votre consultation en toute simplicité.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-white">
                            <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-6 hover:bg-white/20 transition-all">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-md">
                                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </div>

                                <h3 className="font-bold text-lg mb-2">Adresse du cabinet</h3>

                                <p className="text-sky-50 text-sm leading-relaxed mb-4">
                                    Le cabinet vous accueille dans un espace calme, adapté aux enfants,
                                    aux adolescents et aux adultes.
                                </p>

                                <div className="bg-white/20 rounded-xl px-4 py-3">
                                    <p className="text-white text-sm font-medium">
                                        12 Rue Ibn Batouta, Tanger
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-6 hover:bg-white/20 transition-all">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-md">
                                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>

                                <h3 className="font-bold text-lg mb-2">Horaires d’ouverture</h3>

                                <p className="text-sky-50 text-sm leading-relaxed mb-4">
                                    Les consultations sont organisées sur rendez-vous afin de garantir
                                    un suivi personnalisé pour chaque patient.
                                </p>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-white/20 rounded-xl px-4 py-3">
                                        <span className="text-sm font-medium text-white">Lundi – Vendredi</span>
                                        <span className="text-sm text-sky-50">9h – 17h</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-white/10 rounded-xl px-4 py-3">
                                        <span className="text-sm font-medium text-white">Samedi</span>
                                        <span className="text-sm text-sky-50">Sur rendez-vous</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-6 hover:bg-white/20 transition-all">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-md">
                                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                    </svg>
                                </div>

                                <h3 className="font-bold text-lg mb-2">Contact professionnel</h3>

                                <p className="text-sky-50 text-sm leading-relaxed mb-4">
                                    Pour une demande d’information ou une prise de rendez-vous,
                                    contactez directement le cabinet.
                                </p>

                                <div className="space-y-2">
                                    <a
                                        href="tel:+212600000000"
                                        className="flex items-center justify-between bg-white/20 rounded-xl px-4 py-3 hover:bg-white/30 transition-all"
                                    >
                                        <span className="text-sm font-medium text-white">Téléphone</span>
                                        <span className="text-sm text-sky-50">+212 6 00 00 00 00</span>
                                    </a>

                                    <a
                                        href="https://wa.me/212600000000"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 hover:bg-white/25 transition-all"
                                    >
                                        <span className="text-sm font-medium text-white">WhatsApp</span>
                                        <span className="text-sm text-sky-50">Envoyer un message</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/25 text-center">
                            <p className="text-sky-100 text-sm mb-5">
                                Besoin d’un accompagnement orthophonique ? Vous pouvez demander un rendez-vous directement en ligne.
                            </p>

                            <Link
                                to="/rendez-vous"
                                className="inline-flex items-center justify-center gap-2 bg-white text-sky-600 px-8 py-3.5 rounded-2xl font-semibold text-sm hover:shadow-lg hover:bg-sky-50 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Prendre rendez-vous maintenant
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-sky-100 py-8 bg-white/70 backdrop-blur-sm">
                    <div className="max-w-6xl mx-auto px-4 text-center">
                        <p className="text-gray-400 text-xs">
                            © 2026 Zamzem Soulaymane — Orthophoniste. Tous droits réservés.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Home;