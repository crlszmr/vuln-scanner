import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import axios from 'axios';
import { API_ROUTES } from '@/config/apiRoutes';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/theme';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  const handleImport = async (endpoint) => {
    try {
      console.log("Importando a URL:", endpoint);
      const response = await axios.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });
      alert(`✅ Importación correcta: ${response.data.message || 'Success'}`);
    } catch (error) {
      console.error('Error en la importación:', error);
      alert(`❌ Error en la importación: ${error.response?.data?.detail || error.message}`);
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
              onClick={() => handleImport(API_ROUTES.NVD.IMPORT_VULNERABILITIES)}
            >
              Importar Vulnerabilidades (CVEs)
            </Button>

            <Button
              variant="success"
              fullWidth
              onClick={() => handleImport(API_ROUTES.NVD.IMPORT_PLATFORMS)}
            >
              Importar Plataformas (CPEs)
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
