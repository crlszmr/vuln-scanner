import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Creamos el contexto de autenticación
export const AuthContext = createContext();

// Proveedor que envuelve la app y gestiona la sesión del usuario
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);           // Usuario autenticado
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial

  // Verifica si el token JWT está expirado
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  };

  // Verifica si la sesión sigue siendo válida en el servidor
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

  // Al iniciar la app, comprobamos si hay una sesión válida almacenada
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (isTokenExpired(parsedUser.token)) {
          logout(); // El token ha expirado
        } else {
          const isValid = await validateSession(parsedUser.token);
          if (isValid) {
            setUser(parsedUser); // Sesión válida, restaurar usuario
          } else {
            logout(); // Token inválido
          }
        }
      }
      setIsLoading(false); // Fin de la carga, sea cual sea el resultado
    };

    checkSession();
  }, []);

  // Inicia sesión guardando datos del usuario en estado y localStorage
  const login = ({ token, role, email, username }) => {
    const userData = { token, role, email, username };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Cierra sesión limpiando estado y almacenamiento local
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsLoading(false); // Asegura que se actualice tras cerrar sesión
  };

  // Proporcionamos el estado y funciones al resto de la aplicación
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder fácilmente al contexto de autenticación
export const useAuth = () => useContext(AuthContext);
