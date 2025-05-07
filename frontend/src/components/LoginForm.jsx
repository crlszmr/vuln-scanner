import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { APP_ROUTES } from '@/config/appRoutes';
import { API_ROUTES } from '@/config/apiRoutes';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/theme';
import { useNotification } from '@/context/NotificationContext';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await axios.post(API_ROUTES.AUTH.LOGIN, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true, // 👈 IMPORTANTE para que mande la cookie
      });

      const { access_token, role, email: userEmail } = response.data;

      // ✅ Guardar en contexto (Navbar leerá esto y se actualizará)
      login({ token: access_token, role, email: userEmail });
      
      addNotification("✅ Inicio de sesión exitoso.", "success");
      
      // ✅ Redirigir según rol (FORZAMOS A MINÚSCULAS para que sea siempre fiable)
      if (role.toLowerCase() === 'admin') {
          navigate(APP_ROUTES.ADMIN_DASHBOARD);
      } else {
          navigate(APP_ROUTES.DEVICE_UPLOAD);
      }

    } catch (error) {
      console.error('Error de login:', error);

      if (error.response) {
        if (error.response.status === 400 || error.response.status === 401) {
          addNotification("❌ Usuario o contraseña incorrectos.", "error");
        } else {
          addNotification("❌ Error desconocido. Inténtalo más tarde.", "error");
        }
      } else {
        addNotification("❌ No se pudo conectar al servidor.", "error");
      }
    }
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: 'calc(100vh - 160px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              padding: '2.5rem',
              borderRadius: theme.radius.xl,
              boxShadow: theme.shadow.soft,
              width: '100%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              fontFamily: theme.font.family,
            }}
          >
            <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              Bienvenido
            </h1>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '12px',
                borderRadius: theme.radius.md,
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: theme.colors.text,
                fontSize: '16px',
              }}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '12px',
                borderRadius: theme.radius.md,
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: theme.colors.text,
                fontSize: '16px',
              }}
            />

            <Button type="submit" fullWidth>
              Entrar
            </Button>
          </form>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
