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
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Dr</span>
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">
              Dr. Berrada
            </span>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {!user ? (
                            <>
                                <Link
                                    to="/rendez-vous"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    Prendre RDV
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                >
                                    Connexion
                                </Link>
                            </>
                        ) : (
                            <>
                <span className="text-sm text-gray-600">
                  Bonjour, <span className="font-medium">{user.firstName}</span>
                </span>
                                {isAdmin() ? (
                                    <Link
                                        to="/admin"
                                        className="text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
                                    >
                                        Dashboard Admin
                                    </Link>
                                ) : (
                                    <Link
                                        to="/dashboard"
                                        className="text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
                                    >
                                        Mon Suivi
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                >
                                    Déconnexion
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