import { theme } from '@/styles/theme';
import { API_ROUTES } from '@/config/apiRoutes';
import { APP_ROUTES } from '@/config/appRoutes';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import Navbar from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';
import Home from '@/pages/Home';
import AdminDashboard from '@/pages/AdminDashboard';
import NotAuthorized from '@/pages/NotAuthorized';
import ProtectedRoute from '@/components/ProtectedRoute';

function Vulnerabilities() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    console.log("🔐 TOKEN:", token);

    if (!token) {
      console.warn("No token found.");
      return;
    }

    fetch(API_ROUTES.VULNERABILITIES.LIST, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        const raw = await res.text();

        if (!res.ok) {
          console.error("Fetch error:", res.status, raw);
          throw new Error(`Server error ${res.status}`);
        }

        if (contentType && contentType.includes("application/json")) {
          const json = JSON.parse(raw);
          setData(json);
        } else {
          throw new Error("Expected JSON but got something else.");
        }
      })
      .catch((err) => console.error("🔴 Error loading vulnerabilities:", err.message));
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

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen"> {/* ✅ Estructura para Footer */}
        <Navbar />
        <main style={{flexGrow: 1, backgroundColor: theme.colors.background, color: theme.colors.text, }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path={APP_ROUTES.LOGIN} element={<LoginForm />} />
            <Route path={APP_ROUTES.REGISTER} element={<RegisterForm />} />
            <Route
              path={APP_ROUTES.VULNERABILITY_LIST}
              element={
                <ProtectedRoute>
                  <Vulnerabilities />
                </ProtectedRoute>
              }
            />
            <Route
              path={APP_ROUTES.ADMIN_DASHBOARD}
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path={APP_ROUTES.NOT_AUTHORIZED} element={<NotAuthorized />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <Footer /> {/* ✅ Footer siempre abajo */}
      </div>
    </Router>
  );
}

export default App;


