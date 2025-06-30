import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import RiskCard from "@/components/RiskCard";
import { API_ROUTES } from "@/config/apiRoutes";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";
import { useTranslation } from "react-i18next";

// Orden para mostrar los niveles de criticidad
const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE", "ALL"];

export default function DeviceVulnerabilities() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Estado para estadísticas de vulnerabilidades por nivel
  const [stats, setStats] = useState({});
  // Alias del dispositivo para mostrar en título
  const [alias, setAlias] = useState("...");

  useEffect(() => {
    // Obtener estadísticas de vulnerabilidades
    axios
      .get(API_ROUTES.VULNERABILITIES.STATS(deviceId), { withCredentials: true })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(t("deviceVulnerabilities.error_loading_stats"), err));

    // Obtener alias del dispositivo
    axios
      .get(API_ROUTES.DEVICES.GET_CONFIG(deviceId), { withCredentials: true })
      .then((res) => {
        if (res.data?.alias) setAlias(res.data.alias);
      })
      .catch((err) => console.error(t("deviceVulnerabilities.error_loading_alias"), err));
  }, [deviceId, t]);

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
              maxWidth: 1090,
            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.DEVICE_LIST)}
              aria-label={t("deviceVulnerabilities.back_button_aria") || "Volver a lista de dispositivos"}
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
                {t("deviceVulnerabilities.title", { alias })}
              </h1>
            </div>

            <div style={{ width: 52 }} />
          </div>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginTop: 16,
              marginBottom: "5rem",
              textAlign: "center",
            }}
          >
            {t("deviceVulnerabilities.subtitle")}
          </p>

          {/* Tarjetas de criticidad */}
          <div
            style={{
              width: "100%",
              maxWidth: 1200,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
              padding: "0 1rem 2rem",
            }}
          >
            {SEVERITY_ORDER.map((level) => (
              <RiskCard
                key={level}
                level={level}
                count={stats[level] || 0}
                deviceId={deviceId}
              />
            ))}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
