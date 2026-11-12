import { createContext, useContext, useEffect, useState } from 'react';
import keycloak from '../auth/keycloak';

const AuthContext = createContext(null);
const realmRoles = () => keycloak.tokenParsed?.realm_access?.roles || [];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false })
      .then(authenticated => {
        if (authenticated) {
          const roles = realmRoles();
          const role = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_USER'].find(r => roles.includes(r));
          setUser({ role, email: keycloak.tokenParsed.email, firstName: keycloak.tokenParsed.given_name, lastName: keycloak.tokenParsed.family_name, phone: keycloak.tokenParsed.phone_number });
        }
      }).finally(() => setLoading(false));
  }, []);

  const login = () => keycloak.login({ redirectUri: `${window.location.origin}/espace` });
  const logout = () => keycloak.logout({ redirectUri: window.location.origin });
  const isAdmin = () => ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(user?.role);
  const isUser = () => user?.role === 'ROLE_USER';

  return <AuthContext.Provider value={{ user, login, logout, isAdmin, isUser, loading }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
