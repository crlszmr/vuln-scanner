import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  };

  const validateSession = async (token) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (isTokenExpired(parsedUser.token)) {
          logout();
        } else {
          const isValid = await validateSession(parsedUser.token);
          if (isValid) {
            setUser(parsedUser);
          } else {
            logout();
          }
        }
      }
      setIsLoading(false); // ✅ esto se ejecuta siempre
    };

    checkSession();
  }, []);

  const login = ({ token, role, email, username }) => {
    const userData = { token, role, email, username };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsLoading(false); // ✅ asegurar actualización tras logout
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
