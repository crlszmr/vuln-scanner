import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { MonitorSmartphone, Settings2 } from "lucide-react"; 

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 0",
            textAlign: "center",
            fontFamily: theme.font.family,
          }}
        >
          {/* Encabezado con botón de regreso y título */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "960px",
              marginBottom: "0rem",
            }}
          >
            {/* Botón para volver a Home */}
            <button
              onClick={() => navigate("/")}
              style={{
                backgroundColor: "#334155",
                color: "white",
                border: "none",
                borderRadius: "12px",
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
              aria-label={t("dashboard.back_button_aria") || "Volver"}
            >
              &lt;
            </button>

            {/* Título centrado */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <h1 style={{ fontSize: "3rem", fontWeight: "700", color: theme.colors.text, margin: 0 }}>
                {t("dashboard.title")}
              </h1>
            </div>

            {/* Espacio para equilibrar layout */}
            <div style={{ width: "52px" }}></div>
          </div>

          {/* Subtítulo descriptivo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginBottom: "5rem",
              maxWidth: "600px",
            }}
          >
            {t("dashboard.subtitle")}
          </p>

          {/* Paneles de acción: Mis equipos y Detector de configuración */}
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
            <DashboardPanel
              icon={<MonitorSmartphone size={64} />}
              label={t("dashboard.my_devices")}
              onClick={() => navigate("/devices/list")}
            />
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

// Componente reutilizable para paneles con icono y texto
function DashboardPanel({ icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") onClick(); }}
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
      aria-label={label}
    >
      {icon}
      <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginTop: "1rem" }}>{label}</h3>
    </div>
  );
}
