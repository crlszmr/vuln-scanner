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
import { APP_ROUTES } from "../config/appRoutes";

export default function DeviceMatching() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lastMatching, setLastMatching] = useState(null);
  const [deviceAlias, setDeviceAlias] = useState("...");
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchLastMatching = async () => {
    try {
      const res = await fetch(API_ROUTES.DEVICES.GET_LAST_MATCHING(id), {
        credentials: "include",
      });
      const data = await res.json();

      if (data && data.timestamp) {
        setLastMatching(data.timestamp);
      } else {
        setLastMatching(null); // ✅ fuerza mostrar el mensaje alternativo
      }
    } catch (err) {
      console.error("[❌] Error cargando último matching:", err);
      setLastMatching(null); // ✅ también en caso de error
    }
  };

  useEffect(() => {
    fetchLastMatching();

    fetch(API_ROUTES.DEVICES.GET_CONFIG(id), { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.alias) setDeviceAlias(data.alias);
      });
  }, [id]);

  useEffect(() => {
    const checkIfMatchingIsRunning = async () => {
      try {
        const res = await fetch(API_ROUTES.DEVICES.MATCH_STATUS(id), {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.running) {
            console.log("[🔄 DeviceMatching] Matching activo al cargar. Mostrando modal...");
            setShowMatchingModal(true);
          }
        }
      } catch (err) {
        console.error("[❌ DeviceMatching] Error al comprobar el estado de matching:", err);
      }
    };

    checkIfMatchingIsRunning();
  }, [id]);

  const handleStartMatching = () => {
    setShowMatchingModal(true);
  };

  const handleCloseMatchingModal = () => {
    setShowMatchingModal(false);
    fetchLastMatching(); // ✅ actualiza la fecha
  };

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
            padding: "0rem",
            fontFamily: theme.font.family,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {/* Encabezado */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "960px",
              marginBottom: "1rem",
              marginTop: "2rem",
            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.DEVICE_LIST)}
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
            >
              &lt;
            </button>

            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <h1 style={{ fontSize: "3rem", fontWeight: "700", margin: 0 }}>
                Matching de CVEs para {deviceAlias}
              </h1>
            </div>

            <div style={{ width: "52px" }}></div>
          </div>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginBottom: "5rem",
              marginTop: "0rem"
            }}
          >
            Análisis para detectar qué vulnerabilidades afectan a su equipo.
          </p>

          <div
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              fontWeight: 500,
              fontSize: "1rem",
              width: "600px",
              marginBottom: "2rem",
              boxShadow: theme.shadow.medium,
            }}
          >
            {lastMatching
              ? `Último matching realizado el ${getDateTimeString(lastMatching)}`
              : "No hay matching disponible para este equipo. Si quiere lanzar uno, pulse en Analizar este equipo."}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "40px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <CVEPanel
              icon={<RefreshCcw size={64} />}
              title="Analizar este equipo"
              color="#16a34a"
              onClick={handleStartMatching}
            />
            <CVEPanel
              icon={<Trash2 size={64} />}
              title="Eliminar matching"
              color="#dc2626"
              onClick={() => setShowDeleteModal(true)}
            />
          </div>
        </div>

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

function CVEPanel({ icon, title, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "400px",
        height: "200px",
        cursor: "pointer",
        backgroundColor: color || "#334155",
        color: "white",
        borderRadius: "16px",
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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
      <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "1.5rem", fontWeight: 600 }}>
        {title}
      </div>
    </div>
  );
}
