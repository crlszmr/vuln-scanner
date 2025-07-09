import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import { getDateTimeString } from "@/utils/formatDateTime";
import MatchingProgressModal from "@/components/modals/MatchingProgressModal";
import DeleteMatchingModal from "@/components/modals/DeleteMatchingModal";
import { RefreshCcw, Trash2 } from "lucide-react";
import { theme } from "@/styles/theme";
import { APP_ROUTES } from "@/config/appRoutes";
import { useTranslation } from "react-i18next";

export default function DeviceMatching() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [lastMatching, setLastMatching] = useState(null);
  const [deviceAlias, setDeviceAlias] = useState("...");
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Obtener la fecha del último matching para el dispositivo
  const fetchLastMatching = async () => {
    try {
      const res = await fetch(API_ROUTES.DEVICES.GET_LAST_MATCHING(id), {
        credentials: "include",
      });
      const data = await res.json();

      if (data && data.timestamp) {
        setLastMatching(data.timestamp);
      } else {
        setLastMatching(null);
      }
    } catch (err) {
      setLastMatching(null);
    }
  };

  // Obtener alias del dispositivo
  const fetchDeviceAlias = async () => {
    const res = await fetch(API_ROUTES.DEVICES.DEVICE_CONFIG(id), { credentials: "include" });
    const data = await res.json();
    if (data && data.alias) setDeviceAlias(data.alias);
  };

  // Al montar el componente, obtener datos
  useEffect(() => {
    fetchLastMatching();
    fetchDeviceAlias();
  }, [id]);

  // Comprobar si un matching está en ejecución para mostrar modal
  useEffect(() => {
    const checkIfMatchingIsRunning = async () => {
      try {
        const res = await fetch(API_ROUTES.DEVICES.MATCH_STATUS(id), {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.running) {
            setShowMatchingModal(true);
          }
        }
      } catch (err) {
      }
    };

    checkIfMatchingIsRunning();
  }, [id]);

  // Abre modal para iniciar matching
  const handleStartMatching = () => {
    setShowMatchingModal(true);
  };

  // Cierra modal de matching y refresca la fecha del último matching
  const handleCloseMatchingModal = () => {
    setShowMatchingModal(false);
    fetchLastMatching();
  };

  // Cierra modal de confirmación de borrado
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
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
            padding: 0,
            fontFamily: theme.font.family,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {/* Encabezado con botón volver y título */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: 960,
              marginTop: "2rem",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.DEVICE_LIST)}
              aria-label={t("deviceMatching.back_button_aria") || "Volver a lista de dispositivos"}
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
              <h1 style={{ fontSize: "3rem", fontWeight: 700, margin: 0 }}>
                {t("deviceMatching.title", { alias: deviceAlias })}
              </h1>
            </div>

            <div style={{ width: 52 }}></div>
          </div>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginTop: 0,
              marginBottom: "5rem",
            }}
          >
            {t("deviceMatching.subtitle")}
          </p>

          {/* Estado último matching */}
          <div
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              padding: "1rem 1.5rem",
              borderRadius: 12,
              fontWeight: 500,
              fontSize: "1rem",
              width: 600,
              marginBottom: "2rem",
              boxShadow: theme.shadow.medium,
            }}
          >
            {lastMatching
              ? t("deviceMatching.last_matching_done", { datetime: getDateTimeString(lastMatching) })
              : t("deviceMatching.no_matching_yet")}
          </div>

          {/* Paneles de acción para analizar o eliminar matching */}
          <div
            style={{
              display: "flex",
              gap: 40,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <ActionPanel
              icon={<RefreshCcw size={64} aria-hidden="true" />}
              label={t("deviceMatching.analyze_button")}
              color="#16a34a"
              onClick={handleStartMatching}
            />
            <ActionPanel
              icon={<Trash2 size={64} aria-hidden="true" />}
              label={t("deviceMatching.delete_button")}
              color="#dc2626"
              onClick={() => setShowDeleteModal(true)}
            />
          </div>
        </div>

        {/* Modales condicionales */}
        {showMatchingModal && (
          <MatchingProgressModal
            deviceId={id}
            isOpen={showMatchingModal}
            onClose={handleCloseMatchingModal}
          />
        )}

        {showDeleteModal && (
          <DeleteMatchingModal
            deviceId={id}
            onClose={handleCloseDeleteModal}
            onDeleted={fetchLastMatching}
          />
        )}
      </PageWrapper>
    </MainLayout>
  );
}

// Componente reutilizable para botones de acción con icono y texto
function ActionPanel({ icon, label, color, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      style={{
        width: 400,
        height: 200,
        cursor: "pointer",
        backgroundColor: color || "#334155",
        color: "white",
        borderRadius: 16,
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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
      <div style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: 600, textAlign: "center" }}>
        {label}
      </div>
    </div>
  );
}
