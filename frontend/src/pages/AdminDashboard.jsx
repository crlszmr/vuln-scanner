import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import axios from 'axios';
import { API_ROUTES } from '@/config/apiRoutes';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/theme';
import { useNotification } from '@/context/NotificationContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleImport = async (endpoint) => {
    try {
      addNotification("Iniciando importación...", "info");

      const response = await axios.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });

      addNotification(`Importación correcta: ${response.data.message || 'Success'}`, "success");

    } catch (error) {
      console.error('Error en la importación:', error);
      addNotification(`Error en la importación: ${error.response?.data?.detail || error.message}`, "error");
    }
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: 'calc(100vh - 160px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: theme.font.family,
            color: theme.colors.text,
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            Panel de Administración
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              width: '100%',
              maxWidth: '400px',
            }}
          >
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate("/cves")}
            >
              Importar Vulnerabilidades (CVEs)
            </Button>


            <Button
              variant="success"
              fullWidth
              onClick={() => navigate("/cpes")}
            >
              Gestión de Plataformas (CPEs)
            </Button>

            <Button
              variant="primary"
              fullWidth
              onClick={() => handleImport(API_ROUTES.NVD.IMPORT_WEAKNESSES)}
            >
              Importar Weaknesses (CWEs)
            </Button>
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
};

export default AdminDashboard;
