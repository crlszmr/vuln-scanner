import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { AuthContext } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { API_ROUTES } from "@/config/apiRoutes";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { ShieldAlert, ServerCog, FileSearch } from "lucide-react"; // Iconos modernos

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Función para lanzar importaciones con notificación
  const handleImport = async (endpoint) => {
    try {
      addNotification(t("admin.import_start"), "info");

      const response = await axios.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      addNotification(
        `${t("admin.import_success")}: ${response.data.message || "Success"}`,
        "success"
      );
    } catch (error) {
      console.error("Error en la importación:", error);
      addNotification(
        `${t("admin.import_error")}: ${error.response?.data?.detail || error.message}`,
        "error"
      );
    }
  };

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
          {/* Título */}
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: theme.colors.text,
              marginBottom: "0.5rem",
            }}
          >
            {t("admin.title")}
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
            {t("admin.subtitle")}
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
            <AdminPanel
              icon={<ShieldAlert size={64} />}
              label={t("admin.cve_button")}
              onClick={() => navigate("/cves")}
            />

            <AdminPanel
              icon={<ServerCog size={64} />}
              label={t("admin.cpe_button")}
              onClick={() => navigate("/cpes")}
            />

            <AdminPanel
              icon={<FileSearch size={64} />}
              label={t("admin.cwe_button")}
              onClick={() => handleImport(API_ROUTES.NVD.IMPORT_WEAKNESSES)}
            />
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
};

// Panel visual reutilizable
function AdminPanel({ icon, label, onClick }) {
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

export default AdminDashboard;
