import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import { Button } from "@/components/ui/button";
import { theme } from "@/styles/theme";

export default function DeviceConfig() {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [matches, setMatches] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSummary, setLastSummary] = useState(null);

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
    setExpanded(prev => ({ ...prev, [configId]: !prev[configId] }));
  };

  return (
    <MainLayout>
      <PageWrapper>
        {loading ? (
          <p className="text-muted-foreground">Cargando configuración...</p>
        ) : (
          <>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <h1 style={{
                fontSize: "26px",
                fontWeight: "800",
                color: theme.colors.primary,
                fontFamily: theme.font.family
              }}>
                {device.alias}
              </h1>
              <Button onClick={handleMatchRefresh} disabled={refreshing}>
                {refreshing ? "Analizando..." : "Iniciar Matching"}
              </Button>
            </div>

            {lastSummary && (
              <p style={{ fontSize: "14px", color: theme.colors.muted, marginBottom: "1rem" }}>
                {lastSummary.matched} de {lastSummary.total_configs} elementos con coincidencias ({lastSummary.match_percentage}%)
              </p>
            )}

            {["o", "h", "a"].map((typeKey) => (
              <div key={typeKey} style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "0.75rem" }}>
                  {typeKey === "o" ? "Sistema Operativo" : typeKey === "h" ? "Hardware" : "Aplicaciones"}
                </h2>

                {grouped[typeKey].length === 0 ? (
                  <p style={{ color: theme.colors.muted }}>No hay elementos.</p>
                ) : (
                  <ul style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {grouped[typeKey].map((item, idx) => {
                      const configMatches = matches[item.id] || [];
                      const isOpen = expanded[item.id];
                      const uniqueCves = [...new Set(configMatches.map(m => m.cve_name))];

                      return (
                        <motion.li
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            backgroundColor: theme.colors.surface,
                            border: "1px solid #334155",
                            borderRadius: theme.radius.xl,
                            padding: "1.25rem",
                            boxShadow: theme.shadow.soft,
                            listStyle: "none",
                            fontFamily: theme.font.family
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontWeight: "600" }}>
                              <span style={{ color: theme.colors.primary }}>{item.vendor}</span> — {item.product}
                              {item.version && <span> (v{item.version})</span>}
                            </div>
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
                            <ul style={{
                              listStyle: "none",
                              marginTop: "0.75rem",
                              paddingLeft: "1rem",
                              fontSize: "14px",
                              color: theme.colors.muted,
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.25rem"
                            }}>
                              {uniqueCves.map((cve, i) => (
                                <li key={i}>
                                  <span style={{ marginRight: "6px", color: "#60a5fa", fontWeight: "bold" }}>▸</span>
                                  <Link
                                    to={`/vulnerabilities/${cve}`}
                                    style={{
                                      color: "#60a5fa",
                                      fontWeight: "600",
                                      textDecoration: "none"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                                  >
                                    {cve}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.li>
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
