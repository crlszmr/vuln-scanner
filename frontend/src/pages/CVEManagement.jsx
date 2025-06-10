import { useState, useRef, useEffect } from "react";
import { useNotification } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { CloudDownload, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ImportProgressModal from "@/components/modals/ImportProgressModal";

export default function CVEManagement() {
  const [status, setStatus] = useState("idle");
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [waitingForSSE, setWaitingForSSE] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const eventSourceRef = useRef(null);

  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const setupEventSource = (eventSource) => {
    eventSource.onmessage = (event) => {
  try {
    const cleanData = event.data.startsWith("data: ") ? event.data.slice(6) : event.data;
    const data = JSON.parse(cleanData);
    console.log("📥 Evento SSE recibido:", data); // 🧪 DEBUG

    if (data.type === "start") {
      console.log("🚀 Procesando evento 'start'");
      setStatus("running");
      setImported(0);
      setTotal(data.total || 0);
      setLabel(data.label || t("cve.importing"));
      setLoading(true);
      setWaitingForSSE(false);
      setShowModal(true);
      return;
    }

    if (data.type === "progress") {
      setStatus("running");
      setImported(data.imported);
      setTotal(data.total);
      setLabel(data.file ? `${t("cve.file")}: ${data.file}` : t("cve.importing"));
    }

    if (data.type === "done") {
      console.log("✅ Evento 'done' recibido");
      setStatus("completed");
      setImported(data.imported);
      setLoading(false);
      setLabel(data.imported === 0 ? t("cve.no_new_cves") : t("cve.completed"));
      if (eventSourceRef.current) eventSourceRef.current.close();
      eventSourceRef.current = null;
      localStorage.removeItem("cve_import_status");
      addNotification(t("cve.import_success", { count: data.imported }), "success");
    }

    if (data.type) setWaitingForSSE(false);
  } catch (err) {
    console.error("❌ Error procesando evento:", err);
  }
};


    eventSource.onerror = () => {
      setWaitingForSSE(false);
      setStatus("error");
      setLoading(false);
      setLabel(t("cve.connection_error"));
      eventSource.close();
      eventSourceRef.current = null;
      localStorage.removeItem("cve_import_status");
      addNotification(t("cve.connection_error"), "error");
    };
  };

  useEffect(() => {
    const checkImportStatus = async () => {
      const runningFlag = localStorage.getItem("cve_import_status");

      if (runningFlag === "running") {
        setShowModal(true);
        setStatus("running");
        setWaitingForSSE(true);
        setLabel(t("cve.importing"));

        if (!eventSourceRef.current) {
          const eventSource = new EventSource("http://localhost:8000/nvd/cve-import-stream");
          eventSourceRef.current = eventSource;
          setupEventSource(eventSource);
        }
      }

      try {
        const res = await fetch("http://localhost:8000/nvd/cve-import-status");
        const statusData = await res.json();

        if (statusData.running) {
          setShowModal(true);
          setStatus("running");
          setImported(statusData.imported || 0);
          setTotal(statusData.total || 0);
          setLabel(statusData.label || t("cve.importing"));
          setWaitingForSSE(true);
          localStorage.setItem("cve_import_status", "running");

          if (!eventSourceRef.current) {
            const eventSource = new EventSource("http://localhost:8000/nvd/cve-import-stream");
            eventSourceRef.current = eventSource;
            setupEventSource(eventSource);
          }
        }
      } catch (err) {
        setWaitingForSSE(false);
      }
    };

    checkImportStatus();
  }, []);

  const handleStartImport = async () => {
    try {
      // ✅ Reinicia por completo el estado visual
      setStatus("idle");
      setLabel(""); // ❗ Evita que se conserve el "Completado"
      setWaitingForSSE(true);
      setPendingImport(false);
      setWarningMessage("");
      setImported(0);
      setTotal(0);
      setShowModal(true);
      setLoading(true);
      localStorage.setItem("cve_import_status", "running");




      // 🧹 Asegúrate de cerrar cualquier SSE anterior
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // 🚀 Iniciar la importación
      await fetch("http://localhost:8000/nvd/cve-import-start", { method: "POST" });

      // 🔁 Conectar al nuevo SSE y esperar eventos
      const eventSource = new EventSource("http://localhost:8000/nvd/cve-import-stream");
      eventSourceRef.current = eventSource;
      setupEventSource(eventSource);
    } catch (err) {
      setWaitingForSSE(false);
      setStatus("error");
      setLoading(false);
      setLabel(t("cve.error_starting"));
      localStorage.removeItem("cve_import_status");
      addNotification(t("cve.error_starting"), "error");
    }
  };


  const handleDeleteAll = () => {
    setLoading(true);
    fetch("http://localhost:8000/nvd/cve-delete-all", { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(() => {
        addNotification(t("cve.delete_success"), "success");
        setStatus("idle");
        setImported(0);
        setTotal(0);
        setLabel("");
        setWarningMessage(""); // También limpiar la advertencia aquí
      })
      .catch((err) => {
        addNotification(t("cve.delete_error", { error: err.message }), "error");
      })
      .finally(() => setLoading(false));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setStatus("idle");
    setLabel("");
    setWarningMessage("");
    setImported(0);
    setTotal(0);
    setLoading(false);
    setPendingImport(false);
    setWaitingForSSE(false); // Resetear también este estado
    localStorage.removeItem("cve_import_status");
    if (eventSourceRef.current) { // Asegurarse de cerrar el eventSource si el modal se cierra
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleStopImport = async () => {
    setStatus("idle");
    setLoading(false);
    setLabel(t("cve.aborted_by_user"));
    setWaitingForSSE(false);
    setPendingImport(true);
    localStorage.removeItem("cve_import_status");

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    fetch("http://localhost:8000/nvd/cve-import-stop", { method: "POST" }).catch((err) => {
      console.error("❌ Error al detener la importación:", err);
    });
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
            {t("cve.title")}
          </h1>
          <p style={{ fontSize: "1.125rem", color: theme.colors.textSecondary || "#94a3b8", marginBottom: "2rem" }}>
            {t("cve.subtitle")}
          </p>

          <div style={{ display: "flex", flexDirection: "row", gap: "40px", flexWrap: "wrap", justifyContent: "center" }}>
            <CVEPanel
              icon={<CloudDownload size={64} />}
              title={t("cve.import_button")}
              subtitle={t("cve.from_api")}
              color="#16a34a"
              onClick={() => {
                setShowModal(true);
                setStatus("idle"); // Asegurarse de que el estado inicial del modal sea 'idle'
                setImported(0);
                setTotal(0);
                setLabel(t("cve.from_api")); // O el label por defecto para iniciar
                setWarningMessage(""); // Limpiar cualquier mensaje de advertencia al abrir el modal
                setPendingImport(true);
                setLoading(false);
                setWaitingForSSE(false);
              }}
            />
            <CVEPanel
              icon={<Trash2 size={64} />}
              title={t("cve.delete_button")}
              subtitle={t("cve.all")}
              color="#dc2626"
              onClick={handleDeleteAll}
            />
          </div>

          {/* *** CAMBIO CLAVE AQUÍ: Solo mostrar la advertencia si el modal NO está abierto *** */}
          {status === "warning" && warningMessage && !showModal && (
            <div
              style={{
                backgroundColor: "#facc15",
                color: "#78350f",
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                fontWeight: 500,
                fontSize: "1rem",
                maxWidth: "600px",
                marginTop: "2rem",
                boxShadow: theme.shadow.medium,
              }}
            >
              ⚠️ {warningMessage}
            </div>
          )}
        </div>

        <ImportProgressModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onStart={handleStartImport}
          onStop={handleStopImport}
          imported={imported}
          total={total}
          label={label}
          status={status}
          waitingForSSE={waitingForSSE}
          pendingImport={pendingImport}
          // Pasa el mensaje de advertencia al modal
          warningMessage={warningMessage}
        />
      </PageWrapper>
    </MainLayout>
  );
}

function CVEPanel({ icon, title, subtitle, color, onClick }) {
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
      <div style={{ textAlign: "center", lineHeight: "1.2", marginTop: "1rem" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{subtitle}</div>
      </div>
    </div>
  );
}