import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { MonitorSmartphone, Settings2 } from "lucide-react"; // Iconos modernos

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 64px)", // misma altura que Register/Login
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 0",
            textAlign: "center",
            fontFamily: theme.font.family,
          }}
        >
          {/* Título */}
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: theme.colors.text,
              marginBottom: "0.5rem",
            }}
          >
            {t("dashboard.title")}
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginBottom: "2rem",
              maxWidth: "600px",
            }}
          >
            {t("dashboard.subtitle")}
          </p>

          {/* Paneles de acción */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              flexWrap: "wrap",
              justifyContent: "center",
              width: "100%",
              maxWidth: "960px",
            }}
          >
            {/* Botón: Mis equipos */}
            <DashboardPanel
              icon={<MonitorSmartphone size={64} />}
              label={t("dashboard.my_devices")}
              onClick={() => navigate("/devices/list")}
            />

            {/* Botón: Detector de configuración */}
            <DashboardPanel
              icon={<Settings2 size={64} />}
              label={t("dashboard.config_detector")}
              onClick={() => navigate("/detector")}
            />
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}

// Componente reutilizable para panel visual
function DashboardPanel({ icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
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
      {icon}
      <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginTop: "1rem" }}>{label}</h3>
    </div>
  );
}
