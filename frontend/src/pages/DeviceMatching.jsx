import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import { getDateTimeString } from "@/utils/formatDateTime";
import MatchingProgressModal from "@/components/modals/MatchingProgressModal";
import { RefreshCcw, Trash2 } from "lucide-react";
import { theme } from "@/styles/theme";

export default function DeviceMatching() {
  const { id } = useParams();
  const [lastMatching, setLastMatching] = useState(null);
  const [deviceAlias, setDeviceAlias] = useState("...");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(API_ROUTES.DEVICES.GET_LAST_MATCHING(id), { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.timestamp) setLastMatching(data.timestamp);
      });

    fetch(API_ROUTES.DEVICES.GET_CONFIG(id), { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.alias) setDeviceAlias(data.alias);
      });
  }, [id]);

  // ✅ Mostrar automáticamente el modal si hay un matching en curso
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
            setShowModal(true);
          }
        }
      } catch (err) {
        console.error("[❌ DeviceMatching] Error al comprobar el estado de matching:", err);
      }
    };

    checkIfMatchingIsRunning();
  }, [id]);

  const handleStartMatching = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
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
            padding: "2rem 1rem",
            fontFamily: theme.font.family,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Matching de vulnerabilidades para equipo "{deviceAlias}"
          </h1>

          <div
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              fontWeight: 500,
              fontSize: "1rem",
              width: "600px",
              marginTop: "1rem",
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
              onClick={() => {
                /* handleDeleteMatching pendiente */
              }}
            />
          </div>
        </div>

        {showModal && (
          <MatchingProgressModal
            deviceId={id}
            isOpen={showModal}
            onClose={handleCloseModal}
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
