import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { useNotification } from '@/context/NotificationContext';

export default function DeviceMatchPlatforms() {
  const { deviceId } = useParams(); // ← espera recibir deviceId por la ruta
  const [matches, setMatches] = useState([]);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!deviceId) return;

    axios.get(`http://localhost:8000/devices/${deviceId}/match-platforms`, {
      withCredentials: true
    })
      .then(res => {
        const result = [];
        Object.entries(res.data).forEach(([configId, platforms]) => {
          platforms.forEach(p => {
            result.push({ device_config_id: configId, ...p });
          });
        });
        setMatches(result);
      })
      .catch(err => {
        console.error(err);
        addNotification("❌ Error al cargar coincidencias con plataformas.", "error");
      });
  }, [deviceId]);

  return (
    <MainLayout>
      <PageWrapper>
        <h2 style={{ fontSize: '24px', marginBottom: '1rem' }}>
          Posibles plataformas para el dispositivo {deviceId}
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID Config</th>
              <th>Platform ID</th>
              <th>Vendor</th>
              <th>Product</th>
              <th>Version</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Sin resultados</td></tr>
            ) : (
              matches.map((m, i) => (
                <tr key={i}>
                  <td>{m.device_config_id}</td>
                  <td>{m.platform_id}</td>
                  <td>{m.vendor}</td>
                  <td>{m.product}</td>
                  <td>{m.version}</td>
                  <td>{m.score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PageWrapper>
    </MainLayout>
  );
}
