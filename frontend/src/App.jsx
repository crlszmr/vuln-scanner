// Tema visual
import { theme } from '@/styles/theme';

// Rutas centralizadas
import { API_ROUTES } from '@/config/apiRoutes';
import { APP_ROUTES } from '@/config/appRoutes';

// Librerías externas
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Contexto de autenticación y notificaciones
import { useAuth } from '@/context/AuthContext';
import { NotificationProvider, useNotification } from '@/context/NotificationContext';

// Componentes de interfaz
import Navbar from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';
import NotificationContainer from '@/components/ui/NotificationContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

// Formularios de autenticación
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

// Vistas públicas y privadas
import Home from '@/pages/Home';
import AdminDashboard from '@/pages/AdminDashboard';
import NotAuthorized from '@/pages/NotAuthorized';
import Dashboard from '@/pages/Dashboard';
import DevicesList from '@/pages/DevicesList';
import DeviceConfig from '@/pages/DeviceConfig';
import DeviceConfigDetail from '@/pages/DeviceConfigDetail';
import CPEManagement from '@/pages/CPEManagement';
import CVEManagement from '@/pages/CVEManagement';
import CWEManagement from '@/pages/CWEManagement';
import Detector from '@/pages/Detector';
import DeviceMatching from '@/pages/DeviceMatching';
import DeviceVulnerabilities from '@/pages/DeviceVulnerabilities';
import DeviceVulnerabilitiesList from '@/pages/DeviceVulnerabilitiesList';
import VulnerabilityDetails from '@/pages/VulnerabilityDetails';
import WeaknessDetails from '@/pages/WeaknessDetails';

// Vista específica de vulnerabilidades (requiere token)
function Vulnerabilities() {
  const { token } = useAuth();
  const { notify } = useNotification();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetch(API_ROUTES.VULNERABILITIES.LIST, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const contentType = res.headers.get('content-type');
        const raw = await res.text();

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        if (contentType && contentType.includes('application/json')) {
          setData(JSON.parse(raw));
        } else {
          throw new Error('Expected JSON but got something else.');
        }
      })
      .catch((err) => {
        notify('error', `Error loading vulnerabilities: ${err.message}`);
      });
  }, [token]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vulnerabilities</h1>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p className="text-gray-500 italic">No data available or unauthorized.</p>
      )}
    </div>
  );
}

// Componente principal de la app (Routing + Layout general)
function App() {
  return (
    <Router>
      <NotificationProvider>
        <NotificationContainer />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main
            style={{
              flexGrow: 1,
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
            }}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path={APP_ROUTES.LOGIN} element={<LoginForm />} />
              <Route path={APP_ROUTES.REGISTER} element={<RegisterForm />} />

              {/* Rutas protegidas por rol */}
              <Route
                path={APP_ROUTES.VULNERABILITY_LIST}
                element={<ProtectedRoute><Vulnerabilities /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.ADMIN_DASHBOARD}
                element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
              />
              <Route path={APP_ROUTES.NOT_AUTHORIZED} element={<NotAuthorized />} />
              <Route
                path={APP_ROUTES.USER_DASHBOARD}
                element={<ProtectedRoute requiredRole="user"><Dashboard /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.DEVICE_LIST}
                element={<ProtectedRoute requiredRole="user"><DevicesList /></ProtectedRoute>}
              />

              {/* Configuración de dispositivos */}
              <Route
                path={APP_ROUTES.DEVICE_CONFIG(':deviceId')}
                element={<ProtectedRoute requiredRole="user"><DeviceConfig /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.DEVICE_CONFIG_BY_TYPE(':deviceId', ':type')}
                element={<ProtectedRoute requiredRole="user"><DeviceConfigDetail /></ProtectedRoute>}
              />
              <Route
                 path={APP_ROUTES.DEVICE_CONFIG_CVES(':deviceId', ':configId')}
                element={<ProtectedRoute requiredRole="user"><DeviceVulnerabilitiesList /></ProtectedRoute>}
              />

              {/* Gestión de CVEs/CPEs/CWEs */}
              <Route
                path={APP_ROUTES.CPE_MANAGEMENT}
                element={<ProtectedRoute requiredRole="admin"><CPEManagement /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.CVE_MANAGEMENT}
                element={<ProtectedRoute requiredRole="admin"><CVEManagement /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.CWE_MANAGEMENT}
                element={<ProtectedRoute requiredRole="admin"><CWEManagement /></ProtectedRoute>}
              />

              {/* Matching y análisis */}
              <Route path={APP_ROUTES.DEVICE_MATCHING(':id')} element={<DeviceMatching />} />
              <Route
                path={APP_ROUTES.DEVICE_VULNERABILITIES_OVERVIEW(':deviceId')}
                element={<ProtectedRoute requiredRole="user"><DeviceVulnerabilities /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.DEVICE_VULNERABILITIES(':deviceId')}
                element={<ProtectedRoute requiredRole="user"><DeviceVulnerabilitiesList /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.DEVICE_VULNERABILITIES_BY_SEVERITY(':deviceId', ':severity')}
                element={<ProtectedRoute requiredRole="user"><DeviceVulnerabilitiesList /></ProtectedRoute>}
              />

              {/* Detalles y extras */}
              <Route
                path={APP_ROUTES.VULNERABILITY_DETAILS(':cveId')}
                element={<ProtectedRoute><VulnerabilityDetails /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.WEAKNESS_DETAILS(':cweId')}
                element={<ProtectedRoute><WeaknessDetails /></ProtectedRoute>}
              />
              <Route
                path={APP_ROUTES.DETECTOR}
                element={<ProtectedRoute requiredRole="user"><Detector /></ProtectedRoute>}
              />

              {/* Ruta comodín */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;