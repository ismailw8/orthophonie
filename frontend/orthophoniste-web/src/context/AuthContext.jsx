import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const role = localStorage.getItem('role');
        const email = localStorage.getItem('email');
        const firstName = localStorage.getItem('firstName');

        if (token && role) {
            setUser({ token, role, email, firstName });
        }
        setLoading(false);
    }, []);

    const login = (data) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('role', data.role);
        localStorage.setItem('email', data.email);
        localStorage.setItem('firstName', data.firstName);
        setUser({
            token: data.accessToken,
            role: data.role,
            email: data.email,
            firstName: data.firstName,
        });
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    const isAdmin = () =>
        user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';

    const isUser = () => user?.role === 'ROLE_USER';

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin, isUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);