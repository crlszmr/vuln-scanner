import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';
import { API_ROUTES } from '@/config/apiRoutes';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { Button } from '@/components/ui/Button';
import { UploadCloud } from 'lucide-react';
import { theme } from '@/styles/theme';
import { useNotification } from '@/context/NotificationContext';

export default function DeviceUpload() {
  const [alias, setAlias] = useState('');
  const [type, setType] = useState('');
  const [osName, setOsName] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotification();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    setFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      addNotification("❌ Debes seleccionar un archivo system_config.json", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alias", alias);
      formData.append("type", type);
      formData.append("os_name", osName);

      await axios.post(API_ROUTES.DEVICES.UPLOAD, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      addNotification("✅ Configuración del equipo subida correctamente.", "success");
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error(err);
      addNotification("❌ Error al subir la configuración del equipo. Revisa los datos e inténtalo de nuevo.", "error");
    }
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            maxWidth: '450px',
            margin: '40px auto',
            padding: '2rem',
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            boxShadow: theme.shadow.soft,
            color: theme.colors.text,
            fontFamily: theme.font.family,
          }}
        >
          <h2 style={{ fontSize: '24px', textAlign: 'center', fontWeight: 600, marginBottom: '1rem' }}>
            Subir configuración de equipo
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>Alias</label>
              <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label>Tipo de equipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} required style={inputStyle}>
                <option value="">Selecciona una opción</option>
                <option value="laptop">Portátil</option>
                <option value="desktop">Sobremesa</option>
                <option value="server">Servidor</option>
              </select>
            </div>

            <div>
              <label>Sistema operativo</label>
              <input type="text" value={osName} onChange={(e) => setOsName(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label>Archivo de configuración (.json)</label>
              <div style={fileUploadWrapper}>
                <label htmlFor="fileUpload" style={uploadButtonStyle}>
                  <UploadCloud size={18} />
                  Subir archivo
                </label>
                <span style={fileNameStyle}>
                  {fileName ? fileName : 'Ningún archivo seleccionado'}
                </span>
                <input
                  id="fileUpload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>

            <Button type="submit" variant="success" fullWidth>
              Subir configuración
            </Button>
          </form>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}

const inputStyle = {
  padding: '12px',
  borderRadius: theme.radius.md,
  border: '1px solid #334155',
  backgroundColor: '#0f172a',
  color: theme.colors.text,
  width: '100%',
  fontSize: '16px',
};

const fileUploadWrapper = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: '#1e293b',
  padding: '10px 16px',
  borderRadius: theme.radius.md,
  border: '1px solid #334155',
  position: 'relative',
};

const uploadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: theme.colors.primary,
  color: '#fff',
  padding: '10px 14px',
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
};

const fileNameStyle = {
  color: theme.colors.text,
  fontSize: '14px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
