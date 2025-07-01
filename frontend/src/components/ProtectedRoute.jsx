import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { APP_ROUTES } from '@/config/appRoutes';
import { theme } from '@/styles/theme';
import { Loader } from '@/components/ui/Loader';

//Componente que protege rutas en función del estado de autenticación
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Mientras se carga el estado de autenticación, mostrar loader
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 160px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Loader />
      </div>
    );
  }

  // Si no hay usuario autenticado, redirige al login
  if (!user) {
    return <Navigate to={APP_ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  // Si el usuario no tiene el rol requerido, redirige a 'No autorizado'
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={APP_ROUTES.NOT_AUTHORIZED} replace />;
  }

  // Si pasa todas las condiciones, renderiza el contenido protegido
  return children;
};

export default ProtectedRoute;
