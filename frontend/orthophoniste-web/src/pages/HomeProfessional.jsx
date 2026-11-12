import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useHomeMotion } from '../hooks/useHomeMotion';
import '../styles/home.css';

const services = [
    { icon: 'book', number: '01', title: 'Comprendre vos besoins', label: 'Le bilan orthophonique', text: 'Une écoute attentive et une évaluation structurée pour identifier vos besoins et définir ensemble les objectifs du suivi.' },
    { icon: 'dialogue', number: '02', title: 'Avancer à votre rythme', label: 'Le suivi personnalisé', text: 'Des séances adaptées à chaque personne, avec des objectifs concrets et une progression que vous pouvez suivre dans votre espace.' },
    { icon: 'plant', number: '03', title: 'Grandir ensemble', label: 'L’accompagnement familial', text: 'Des repères accessibles pour les proches, afin de prolonger le travail des séances dans les échanges du quotidien.' },
];
const steps = [
    ['01', 'Vous faites le premier pas', 'Choisissez une date et un horaire disponibles, puis indiquez vos coordonnées et votre besoin.'],
    ['02', 'Nous confirmons ensemble', 'Le cabinet examine votre demande et vous contacte pour confirmer le rendez-vous.'],
    ['03', 'Votre suivi prend vie', 'Retrouvez vos séances, votre bilan et votre progression dans votre espace personnel.'],
];

function Arrow({ diagonal = false }) {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M5 12h14m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ServiceIcon({ type }) {
    return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {type === 'book' ? <path d="M16 9c-4-3-8-3-12-2v17c4-1 8-1 12 2 4-3 8-3 12-2V7c-4-1-8-1-12 2Zm0 0v17M8 12h4m-4 5h4m8-5h4m-4 5h4"/> : type === 'dialogue' ? <path d="M5 7h17v12H11l-6 5V7Zm17 5h5v15l-5-4h-6v-4M9 12h9m-9 3h6"/> : <path d="M16 27V14m0 5C7 20 4 15 4 10c7 0 12 3 12 9Zm0-5C16 6 21 4 27 4c0 7-4 11-11 10ZM9 27h14"/>}
    </svg>;
}

export default function HomeProfessional() {
    const { user } = useAuth();
    const pageRef = useRef(null);
    useHomeMotion(pageRef);
    const accountPath = user ? '/espace' : '/login';
    return <div ref={pageRef} className="home-page">
        <a href="#home-main" className="home-skip-link">Aller au contenu</a>
        <Navbar home/>
        <main id="home-main" tabIndex={-1}>
            <section className="home-hero" aria-labelledby="home-title">
                <div className="home-container home-hero-grid">
                    <div className="home-hero-copy">
                        <p className="home-eyebrow"><span aria-hidden="true"/>Cabinet d’orthophonie</p>
                        <h1 id="home-title" className="home-display">Les mots ouvrent<br/>de nouveaux<br/><em>horizons.</em></h1>
                        <p className="home-intro">Une écoute, un lien, un pas après l’autre. Un accompagnement du langage et de la communication, à chaque âge de la vie.</p>
                        <div className="home-hero-actions"><Link to="/rendez-vous" className="home-button">Demander un rendez-vous<Arrow/></Link><Link to={accountPath} className="home-text-link">Mon espace personnel<Arrow diagonal/></Link></div>
                        <p className="home-appointment-note">Consultations sur rendez-vous · Confirmation par le cabinet</p>
                    </div>
                    <figure className="home-hero-figure">
                        <div className="home-image-frame"><img src="/images/orthophonie-affiches.jpg" width="745" height="478" alt="Affiches encadrées sur le langage, l’anatomie du larynx, l’oreille et les mécanismes de la phonation." fetchPriority="high" decoding="async"/></div>
                        <figcaption><span className="home-image-caption">Le langage, dans toutes ses dimensions</span><span className="home-image-index" aria-hidden="true">Langage & communication</span></figcaption>
                        <div className="home-photo-note"><span className="home-photo-note-mark" aria-hidden="true">“</span><p className="home-display">Chaque progrès commence<br/>par une rencontre.</p></div>
                    </figure>
                </div>
                <div className="home-container"><dl className="home-facts"><div><dt>Pour qui ?</dt><dd>Enfants, adolescents et adultes</dd></div><div><dt>Notre approche</dt><dd>Écouter, comprendre, accompagner</dd></div><div><dt>Votre espace</dt><dd>Rendez-vous, séances et progression</dd></div></dl></div>
            </section>
            <section id="cabinet" className="home-section home-container" aria-labelledby="home-care-title">
                <div className="home-section-heading"><div><p className="home-eyebrow">Un accompagnement à votre mesure</p><h2 id="home-care-title" className="home-display">Votre histoire est unique.<br/>Votre suivi l’est aussi.</h2></div><p className="home-section-intro">Chaque parcours commence par une rencontre. Nous prenons le temps de comprendre vos besoins pour avancer avec des objectifs partagés.</p></div>
                <div className="home-services">{services.map(service => <article key={service.number} className="home-service"><div className="home-service-top"><span className="home-service-icon"><ServiceIcon type={service.icon}/></span><span className="home-service-number" aria-hidden="true">{service.number}</span></div><p className="home-service-label">{service.label}</p><h3 className="home-display">{service.title}</h3><p className="home-service-description">{service.text}</p></article>)}</div>
            </section>
            <section id="accompagnement" className="home-journey" aria-labelledby="home-journey-title"><div className="home-container home-section"><div className="home-journey-heading"><div><p className="home-eyebrow">Votre parcours</p><h2 id="home-journey-title" className="home-display">Un premier pas.<br/>Puis, un chemin ensemble.</h2></div><Link to="/rendez-vous" className="home-text-link">Commencer ma demande<Arrow/></Link></div><ol className="home-steps">{steps.map(([number, title, text]) => <li key={number}><span className="home-step-number" aria-hidden="true">{number}</span><h3>{title}</h3><p>{text}</p></li>)}</ol><p className="home-journey-note">Votre demande reste en attente jusqu’à la confirmation du cabinet.</p></div></section>
            <section className="home-section home-container home-faq" aria-labelledby="home-faq-title"><div><p className="home-eyebrow">Quelques repères</p><h2 id="home-faq-title" className="home-display">Avant de<br/>nous rencontrer.</h2><p className="home-section-intro">Des réponses simples pour préparer votre premier contact avec le cabinet.</p></div><div className="home-questions">
                <details><summary>Le rendez-vous est-il confirmé immédiatement ?<span aria-hidden="true"/></summary><p>La demande en ligne vous permet de choisir un créneau disponible. Le cabinet vous contacte ensuite pour confirmer la date et l’heure du rendez-vous.</p></details>
                <details><summary>À qui s’adresse l’accompagnement ?<span aria-hidden="true"/></summary><p>Le cabinet accompagne les enfants, les adolescents et les adultes pour les besoins liés au langage, à la communication et aux apprentissages.</p></details>
                <details><summary>Comment retrouver mon suivi ?<span aria-hidden="true"/></summary><p>Une fois votre compte créé par le cabinet, connectez-vous à votre espace personnel pour consulter vos séances, votre bilan et votre progression. <Link to={accountPath}>Accéder à mon espace.</Link></p></details>
            </div></section>
            <section className="home-contact home-container" aria-labelledby="home-contact-title"><div><p className="home-eyebrow">Prenons le temps d’échanger</p><h2 id="home-contact-title" className="home-display">Le premier pas,<br/><em>c’est une rencontre.</em></h2><p>Choisissez un créneau et adressez votre demande au cabinet.</p><Link to="/rendez-vous" className="home-button">Voir les disponibilités<Arrow/></Link></div><div className="home-contact-decoration" aria-hidden="true"><svg viewBox="0 0 220 240" fill="none"><path d="M110 220V81m0 89C61 171 31 135 31 103c44-2 79 23 79 67Zm0-59C110 58 147 27 190 23c3 45-31 83-80 88Zm0 99c44 0 66-26 71-50-38-1-63 18-71 50Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M61 219h98M110 168l-48-39m50-23 49-48m-49 147 41-26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></div></section>
        </main>
        <footer className="home-footer"><div className="home-container"><div><strong>OrthoConnect</strong><span>Cabinet d’orthophonie</span></div><p>© {new Date().getFullYear()} · À chaque mot, un pas de plus.</p><Link to={accountPath}>Mon espace<Arrow diagonal/></Link></div></footer>
    </div>;
}
