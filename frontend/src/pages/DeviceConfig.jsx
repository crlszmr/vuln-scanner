// src/pages/DeviceConfig.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import axios from "axios";
import { Button } from "@/components/ui/button"; // ✅ AÑADIDO

export default function DeviceConfig() {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [matches, setMatches] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(API_ROUTES.DEVICES.DEVICE_CONFIG(deviceId), { withCredentials: true })
      .then((res) => setDevice(res.data))
      .catch((err) => console.error("Error loading device config:", err))
      .finally(() => setLoading(false));
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    axios.get(API_ROUTES.DEVICES.DEVICE_MATCHES(deviceId), { withCredentials: true })
      .then(res => {
        const grouped = {};
        for (const m of res.data) {
          if (!grouped[m.device_config_id]) grouped[m.device_config_id] = [];
          grouped[m.device_config_id].push(m);
        }
        setMatches(grouped);
      })
      .catch(err => console.error("Error loading matches:", err));
  }, [deviceId]);

  const [refreshing, setRefreshing] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);

  const handleMatchRefresh = () => {
    setRefreshing(true);
    axios.post(API_ROUTES.DEVICES.MATCH_REFRESH(deviceId), {}, { withCredentials: true })
      .then(res => {
        setLastSummary(res.data);
        return axios.get(API_ROUTES.DEVICES.DEVICE_MATCHES(deviceId), { withCredentials: true });
      })
      .then(res => {
        const grouped = {};
        for (const m of res.data) {
          if (!grouped[m.device_config_id]) grouped[m.device_config_id] = [];
          grouped[m.device_config_id].push(m);
        }
        setMatches(grouped);
      })
      .catch(err => console.error("Error actualizando matches:", err))
      .finally(() => setRefreshing(false));
  };

  const grouped = { o: [], h: [], a: [] };
  if (device?.config) {
    for (const c of device.config) {
      grouped[c.type]?.push(c);
    }
  }

  const toggleExpand = (configId) => {
    setExpanded(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  return (
    <MainLayout>
      <PageWrapper>
        {loading ? (
          <p className="text-muted-foreground">Cargando configuración...</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{device.alias}</h1>
              <Button onClick={handleMatchRefresh} disabled={refreshing}>
                {refreshing ? "Analizando..." : "Iniciar Matching"}
              </Button>
            </div>

            {lastSummary && (
              <p className="text-sm text-muted-foreground mb-2">
                {lastSummary.matched} de {lastSummary.total_configs} elementos con coincidencias ({lastSummary.match_percentage}%)
              </p>
            )}

            {["o", "h", "a"].map((typeKey) => (
              <div key={typeKey} className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  {typeKey === "o" ? "Sistema Operativo" : typeKey === "h" ? "Hardware" : "Aplicaciones"}
                </h2>
                {grouped[typeKey].length === 0 ? (
                  <p className="text-muted-foreground">No hay elementos.</p>
                ) : (
                  <ul className="space-y-4">
                    {grouped[typeKey].map((item, idx) => {
                      const configMatches = matches[item.id] || [];
                      const isOpen = expanded[item.id];

                      // Obtener CVEs únicos
                      const uniqueCves = [...new Set(configMatches.map(m => m.cve_name))];

                      return (
                        <li key={idx} className="border p-3 rounded-xl">
                          <div className="flex justify-between items-center">
                            <span><strong>{item.vendor}</strong> - {item.product} {item.version && <> (v{item.version})</>}</span>
                            {configMatches.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(item.id)}
                              >
                                {isOpen ? "Ocultar matches" : "Mostrar matches"}
                              </Button>
                            )}
                          </div>
                          {isOpen && (
                            <ul className="mt-2 pl-4 text-sm text-muted-foreground space-y-1">
                              {uniqueCves.map((cve, i) => (
                                <li key={i}>• <strong>{cve}</strong></li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
      </PageWrapper>
    </MainLayout>
  );
}
