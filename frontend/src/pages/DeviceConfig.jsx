import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { API_ROUTES } from "../config/apiRoutes";
import { APP_ROUTES } from "../config/appRoutes";
import { MonitorSmartphone, Cpu, Boxes } from "lucide-react";

export default function DeviceConfig() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [cveCounts, setCveCounts] = useState({ o: 0, h: 0, a: 0 });

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await axios.get(API_ROUTES.DEVICES.GET_ENRICHED_CONFIG(deviceId), {
          withCredentials: true,
        });

        setDeviceInfo({ alias: "Equipo" });
        const allConfigs = Array.isArray(res.data) ? res.data : [];

        const counts = { o: 0, h: 0, a: 0 };
        for (const item of allConfigs) {
          console.log(item.cves)
          const unsolved = (item.cves || []).filter(cve => !cve.solved);
          counts[item.type] += unsolved.length;
        }

        setConfigs(allConfigs);
        setCveCounts(counts);
      } catch (error) {
        console.error("❌ Error al obtener configuraciones enriquecidas:", error);
      }
    };

    fetchConfigs();
  }, [deviceId]);

  const handleNavigate = (type) => {
    navigate(APP_ROUTES.DEVICE_CONFIG_BY_TYPE(deviceId, type));
  };

  const panels = [
    { label: "Sistema Operativo", type: "os", internal: "o", icon: <MonitorSmartphone size={64} /> },
    { label: "Hardware", type: "hardware", internal: "h", icon: <Cpu size={64} /> },
    { label: "Software", type: "software", internal: "a", icon: <Boxes size={64} /> },
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
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Vulnerabilidades de {deviceInfo?.alias || "..."}
          </h1>

          <div
            style={{
              display: "flex",
              gap: "40px",
              flexWrap: "wrap",
              justifyContent: "center",
              width: "100%",
              maxWidth: "960px",
              marginTop: "2rem",
            }}
          >
            {panels.map((panel) => (
              <div
                key={panel.type}
                onClick={() => handleNavigate(panel.type)}
                style={{
                  flex: "1 1 300px",
                  cursor: "pointer",
                  backgroundColor: "#334155",
                  color: "white",
                  borderRadius: "16px",
                  padding: "2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = theme.shadow.medium;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {panel.icon}
                <h3 style={{ fontSize: "1.5rem", fontWeight: "600", margin: "1rem 0 0.5rem" }}>
                  {panel.label}
                </h3>
                <div style={{ fontSize: "1.25rem" }}>
                  {cveCounts[panel.internal]?.toLocaleString("es-ES")} CVEs encontrados
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
