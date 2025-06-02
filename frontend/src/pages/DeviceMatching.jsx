import { useParams } from "react-router-dom";
import { useState, useRef } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import { API_ROUTES } from "@/config/apiRoutes";
import { theme } from "@/styles/theme";

export default function DeviceMatching() {
  const { id } = useParams();
  const [isMatching, setIsMatching] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const totalSteps = useRef(0);
  const eventSourceRef = useRef(null);

  const startMatching = () => {
    setIsMatching(true);
    setProgressText("⏳ Iniciando matching...");
    setProgressValue(0);
    setShowModal(true);

    const eventSource = new EventSource(API_ROUTES.DEVICES.MATCH_PROGRESS(id), {
      withCredentials: true,
    });
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        setProgressText("✅ Análisis completado.");
        setProgressValue(100);
        eventSource.close();
        eventSourceRef.current = null;
        setTimeout(() => {
          setShowModal(false);
          setIsMatching(false);
        }, 2000);
      } else {
        setProgressText(event.data);
        const match = event.data.match(/^(\d+)\/(\d+)/);
        if (match) {
          const current = parseInt(match[1]);
          const total = parseInt(match[2]);
          totalSteps.current = total;
          const percentage = Math.round((current / total) * 100);
          setProgressValue(percentage);
        }
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ Error en SSE:", err);
      setProgressText("❌ Error durante el análisis.");
      eventSource.close();
      eventSourceRef.current = null;
      setIsMatching(false);
      setTimeout(() => setShowModal(false), 3000);
    };
  };

  const cancelMatching = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsMatching(false);
    setProgressText("❌ Análisis cancelado.");
    setTimeout(() => setShowModal(false), 1500);
  };

  const deleteMatching = () => {
    alert(`Eliminar matching de dispositivo ${id}`);
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 160px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "2rem",
            fontFamily: theme.font.family,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              marginBottom: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h1 style={{ fontSize: "24px", fontWeight: "700" }}>
              Matching de vulnerabilidades
            </h1>
            <p>Dispositivo ID: {id}</p>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button onClick={startMatching} disabled={isMatching}>
                {isMatching ? "Analizando..." : "Iniciar matching"}
              </Button>
              <Button
                variant="destructive"
                onClick={deleteMatching}
                disabled={isMatching}
              >
                Eliminar matching
              </Button>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                style={{
                  width: "640px",            // ancho fijo
                  height: "360px",           // alto fijo
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderRadius: theme.radius.xl,
                  boxShadow: theme.shadow.soft,
                  border: "1px solid #334155",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    marginBottom: "1rem",
                    textAlign: "center",
                  }}
                >
                  Progreso del análisis
                </h2>

                <div
                  style={{
                    width: "100%",
                    height: "14px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: `${progressValue}%`,
                      height: "100%",
                      backgroundColor: theme.colors.primary,
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>

                <p
                  style={{
                    fontSize: "14px",
                    fontFamily: "monospace",
                    color: theme.colors.muted,
                    textAlign: "center",
                    marginBottom: "1rem",
                  }}
                >
                  {progressText}
                </p>

                <div>
                  <Button variant="destructive" onClick={cancelMatching}>
                    Cancelar análisis
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </PageWrapper>
    </MainLayout>
  );
}
