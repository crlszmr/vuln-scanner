import { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_ROUTES } from '@/config/apiRoutes';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/theme';
import { AuthContext } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

export default function DeviceUploadForm({ onClose, onSuccess }) {
  const [alias, setAlias] = useState('');
  const [type, setType] = useState('');
  const [osName, setOsName] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotification();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // Enfocar ❌ al abrir
    closeButtonRef.current?.focus();
  }, []);

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

      await axios.post(API_ROUTES.DEVICES.UPLOAD, formData, { withCredentials: true });

      addNotification("✅ Configuración subida correctamente.", "success");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      addNotification("❌ Error al subir la configuración del equipo.", "error");
    }
  };

  return (
    <motion.div
      layoutId="crear-formulario"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={formWrapper}
    >
      {/* Botón de cerrar */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          ref={closeButtonRef}
          onClick={() => {
            onClose?.();
            document.getElementById('crear-nuevo-btn')?.focus(); // volver al botón
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.textSecondary,
            fontSize: '22px',
            cursor: 'pointer',
            lineHeight: '1',
          }}
          aria-label="Cerrar formulario"
          title="Cerrar"
        >
          ×
        </button>
      </div>

      <h2 style={formTitle}>Subir configuración de equipo</h2>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Alias" required style={inputStyle} />
          <select value={type} onChange={(e) => setType(e.target.value)} required style={inputStyle}>
            <option value="">Tipo de equipo</option>
            <option value="laptop">Portátil</option>
            <option value="desktop">Sobremesa</option>
            <option value="server">Servidor</option>
          </select>
          <input type="text" value={osName} onChange={(e) => setOsName(e.target.value)} placeholder="Sistema operativo" style={inputStyle} />

          <div>
            <label>Archivo de configuración (.json)</label>
            <div style={fileUploadWrapper}>
              <label htmlFor="fileUpload" style={uploadButtonStyle}>
                <UploadCloud size={18} /> Subir archivo
              </label>
              <span style={fileNameStyle}>{fileName || 'Ningún archivo seleccionado'}</span>
              <input id="fileUpload" type="file" accept=".json" onChange={handleFileUpload} style={fileInputHidden} />
            </div>
          </div>

          <Button type="submit" variant="success" fullWidth>
            Subir configuración
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

const formWrapper = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.xl,
  padding: '1.5rem',
  width: '100%',
  maxWidth: '500px', // ancho similar a 2 tarjetas
  boxShadow: theme.shadow.soft,
  color: theme.colors.text,
  fontFamily: theme.font.family,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const formTitle = {
  fontSize: '24px',
  textAlign: 'center',
  fontWeight: 600,
  marginBottom: '1rem',
};

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

const fileInputHidden = {
  position: 'absolute',
  left: 0,
  top: 0,
  opacity: 0,
  width: '100%',
  height: '100%',
  cursor: 'pointer',
};
