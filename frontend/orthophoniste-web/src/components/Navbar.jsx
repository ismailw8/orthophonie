import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white border-b border-sky-100 sticky top-0 z-50 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </div>

                        <div>
                            <p className="font-bold text-sky-900 text-sm leading-tight">
                                Zamzem Soulaymane
                            </p>
                            <p className="text-xs text-sky-400 leading-tight">
                                Orthophoniste
                            </p>
                        </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {!user ? (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sky-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-50 transition"
                                >
                                    Connexion
                                </Link>

                                <Link
                                    to="/rendez-vous"
                                    className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-sky-200 transition-all"
                                >
                                    Prendre RDV
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-xl">
                                    <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                            {user.firstName?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    <span className="text-sm font-medium text-sky-800">
                                        {user.firstName}
                                    </span>
                                </div>

                                {isAdmin() && (
                                    <>
                                        <Link
                                            to="/admin"
                                            className="text-sky-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-50 transition"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/admin/stats"
                                            className="text-sky-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-50 transition"
                                        >
                                            Statistiques
                                        </Link>
                                    </>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 hover:text-gray-600 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;