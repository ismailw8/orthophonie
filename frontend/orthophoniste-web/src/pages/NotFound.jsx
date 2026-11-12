import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center">
            <div>
                <p className="text-sm font-semibold text-sky-800">Erreur 404</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Cette page n’existe pas</h1>
                <p className="mt-4 text-slate-600">Le lien est peut-être incorrect ou la page a été déplacée.</p>
                <Link to="/" className="mt-8 inline-flex rounded-xl bg-sky-800 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-900">Retour à l’accueil</Link>
            </div>
        </main>
    );
}
