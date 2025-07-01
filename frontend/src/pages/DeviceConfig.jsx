import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { API_ROUTES } from "@/config/apiRoutes";
import { APP_ROUTES } from "@/config/appRoutes";
import { MonitorSmartphone, Cpu, Boxes } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DeviceConfig() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Estado para configuraciones enriquecidas del dispositivo
  const [configs, setConfigs] = useState([]);
  // Estado para información básica del dispositivo (alias)
  const [deviceInfo, setDeviceInfo] = useState(null);
  // Estado para conteos de CVEs por tipo (o: OS, h: hardware, a: app/software)
  const [cveCounts, setCveCounts] = useState({ o: 0, h: 0, a: 0 });

  useEffect(() => {
    // Función para obtener configuraciones enriquecidas del dispositivo
    const fetchConfigs = async () => {
      try {
        const res = await axios.get(API_ROUTES.DEVICES.GET_ENRICHED_CONFIG(deviceId), {
          withCredentials: true,
        });

        const allConfigs = Array.isArray(res.data) ? res.data : [];

        // Contabiliza CVEs no resueltos por tipo
        const counts = { o: 0, h: 0, a: 0 };
        for (const item of allConfigs) {
          const unsolved = (item.cves || []).filter((cve) => !cve.solved);
          counts[item.type] += unsolved.length;
        }

        setConfigs(allConfigs);
        setCveCounts(counts);
      } catch (error) {
      }
    };

    // Función para obtener la info básica del dispositivo, especialmente el alias
    const fetchDeviceInfo = async () => {
      try {
        const res = await axios.get(API_ROUTES.DEVICES.GET_CONFIG(deviceId), {
          withCredentials: true,
        });
        setDeviceInfo(res.data);
      } catch (error) {
        // En caso de error, se puede asignar alias genérico
        setDeviceInfo({ alias: t("deviceConfig.default_alias") });
      }
    };

    fetchConfigs();
    fetchDeviceInfo();
  }, [deviceId, t]);

  // Navega a la página filtrada por tipo de configuración
  const handleNavigate = (type) => {
    navigate(APP_ROUTES.DEVICE_CONFIG_BY_TYPE(deviceId, type));
  };

  // Define paneles con labels, tipo interno e iconos
  const panels = [
    { label: t("deviceConfig.os_label"), type: "os", internal: "o", icon: <MonitorSmartphone size={64} /> },
    { label: t("deviceConfig.hardware_label"), type: "hardware", internal: "h", icon: <Cpu size={64} /> },
    { label: t("deviceConfig.software_label"), type: "software", internal: "a", icon: <Boxes size={64} /> },
  ];

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "2rem 1rem",
            fontFamily: theme.font.family,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {/* Header con botón volver y título */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: 960,
            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.DEVICE_LIST)}
              aria-label={t("deviceConfig.back_button_aria") || t("deviceConfig.default_back_label")}
              style={{
                backgroundColor: "#334155",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "6px 14px",
                fontSize: "1.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = theme.shadow.medium;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              &lt;
            </button>

            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <h1 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0 }}>
                {t("deviceConfig.title", { alias: deviceInfo?.alias ?? t("deviceConfig.default_alias") })}
              </h1>
            </div>

            <div style={{ width: 52 }} />
          </div>

          {/* Subtítulo explicativo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginTop: 16,
              marginBottom: 80,
              textAlign: "center",
            }}
          >
            {t("deviceConfig.subtitle")}
          </p>

          {/* Paneles para tipos de configuración con conteo de CVEs */}
          <div
            style={{
              display: "flex",
              gap: 40,
              flexWrap: "wrap",
              justifyContent: "center",
              width: "100%",
              maxWidth: 960,
              marginTop: 32,
            }}
          >
            {panels.map((panel) => (
              <div
                key={panel.type}
                onClick={() => handleNavigate(panel.type)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleNavigate(panel.type);
                }}
                style={{
                  flex: "1 1 300px",
                  cursor: "pointer",
                  backgroundColor: "#334155",
                  color: "white",
                  borderRadius: 16,
                  padding: "2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = theme.shadow.medium;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                aria-label={`${panel.label}, ${cveCounts[panel.internal]?.toLocaleString("es-ES")} CVEs`}
              >
                {panel.icon}
                <h3 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "1rem 0 0.5rem" }}>
                  {panel.label}
                </h3>
                <div style={{ fontSize: "1.25rem" }}>
                  {cveCounts[panel.internal]?.toLocaleString("es-ES")} {t("deviceConfig.cves_found")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
