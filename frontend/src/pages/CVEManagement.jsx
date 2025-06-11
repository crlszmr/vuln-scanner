import { useState, useRef, useEffect } from "react";
import { useNotification } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { CloudDownload, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ImportProgressModal from "@/components/modals/ImportProgressModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";


export default function CVEManagement() {
  const [status, setStatus] = useState("idle");
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("");
  const [stage, setStage] = useState("");              // 👈 Nuevo estado
  const [percentage, setPercentage] = useState(0);     // 👈 Nuevo estado
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [waitingForSSE, setWaitingForSSE] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const eventSourceRef = useRef(null);

  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cveCount, setCveCount] = useState(0);

  const setupEventSource = (eventSource) => {
    eventSource.onmessage = (event) => {
      console.log("📥 SSE → raw:", event.data);
      try {
        const cleanData = event.data.startsWith("data: ") ? event.data.slice(6) : event.data;
        const data = JSON.parse(cleanData);
        console.log("📥 Evento SSE recibido:", data);

        if (data.type === "start") {
          console.log("🚀 Evento START: ", data);
          setStatus("running");
          setImported(0);
          setTotal(data.total || 0);
          setLabel(data.label || t("cve.importing"));
          setStage(data.stage || "");
          setPercentage(data.percentage || 0);
          setLoading(true);
          setWaitingForSSE(false);
          setShowModal(true);
          return;
        }

        if (data.type === "progress") {
          console.log("📊 Evento PROGRESS: ", data);
          setStatus("running");
          setImported(data.imported);
          setTotal(data.total);
          setLabel(data.label || t("cve.importing"));
          setStage(data.stage || "");
          setPercentage(data.percentage || 0);
        }

        if (data.type === "done") {
          console.log("✅ Evento DONE: ", data);
          setStatus("completed");
          setImported(data.imported);
          setLoading(false);
          setStage("");
          setPercentage(0);
          setLabel(data.imported === 0 ? t("cve.no_new_cves") : t("cve.completed"));
          if (eventSourceRef.current) eventSourceRef.current.close();
          eventSourceRef.current = null;
          localStorage.removeItem("cve_import_status");
          addNotification(t("cve.import_success", { count: data.imported }), "success");
        }

        if (data.type === "warning") {
          console.log("⚠️ Evento WARNING:", data);
          setStatus("warning");
          setWarningMessage(data.message || t("cve.too_many_new"));
          setImported(0);
          setTotal(0);
          setStage("");
          setPercentage(0);
          setWaitingForSSE(false);

          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }

          localStorage.removeItem("cve_import_status");
          setLoading(false);
          return;
        }

        if (data.type === "label") {
          console.log("🔖 Evento LABEL: ", data);
          setLabel(data.label || "");
          setStatus("running");          // ✅ fuerza el estado activo desde el principio
          setWaitingForSSE(false);       // ✅ detiene el spinner si está activo
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
          setStage(statusData.stage || "");
          setPercentage(statusData.percentage || 0);
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

  const resetImportState = () => {
    setStatus("idle");
    setLabel("");
    setWaitingForSSE(true);
    setPendingImport(false);
    setWarningMessage("");
    setImported(0);
    setTotal(0);
    setStage("");
    setPercentage(0);
    setLoading(true);
    localStorage.setItem("cve_import_status", "running");
  };

  const handleStartImport = async () => {
    try {
      console.log("🟢 handleStartImport → Iniciando importación");

      // Reinicia estado de importación
      setStatus("idle");
      setLabel("");
      setStage("");
      setPercentage(0);
      setImported(0);
      setTotal(0);
      setWaitingForSSE(true);
      setPendingImport(false);
      setWarningMessage("");
      setLoading(true);
      localStorage.setItem("cve_import_status", "running");

      // 🧹 Cerrar stream anterior si existía
      if (eventSourceRef.current) {
        console.log("🔌 Cerrando SSE anterior");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // 🚀 Iniciar en backend
      const res = await fetch("http://localhost:8000/nvd/cve-import-start", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error al lanzar importación");

      console.log("📤 Enviado POST /cve-import-start");

      // 🔁 Conectar nuevo SSE
      const eventSource = new EventSource("http://localhost:8000/nvd/cve-import-stream");
      console.log("📡 Conectado a nuevo SSE");

      eventSourceRef.current = eventSource;
      setupEventSource(eventSource);
    } catch (err) {
      console.error("❌ handleStartImport → Error:", err);
      setWaitingForSSE(false);
      setStatus("error");
      setLoading(false);
      setLabel(t("cve.error_starting"));
      localStorage.removeItem("cve_import_status");
      addNotification(t("cve.error_starting"), "error");
    }
  };



  const handleDeleteAll = async () => {
    try {
      const res = await fetch("http://localhost:8000/nvd/cve-count");
      const data = await res.json();
      setCveCount(data.count || 0);
      setShowDeleteModal(true);
    } catch (err) {
      addNotification(t("cve.delete_error", { error: err.message }), "error");
    }
  };

  const handleConfirmDelete = async () => {
  setDeleting(true);
  try {
    const res = await fetch("http://localhost:8000/nvd/cve-delete-all", { method: "DELETE" });
    if (!res.ok) throw new Error("Server error");
    addNotification(t("cve.delete_success"), "success");
    setStatus("idle");
    setImported(0);
    setTotal(0);
    setLabel("");
    setShowDeleteModal(false);
  } catch (err) {
    addNotification(t("cve.delete_error", { error: err.message }), "error");
  } finally {
    setDeleting(false);
  }
};

const handleCancelDelete = () => {
  setShowDeleteModal(false);
};

  const handleCloseModal = () => {
    setShowModal(false);
    setStatus("idle");
    setLabel("");
    setWarningMessage("");
    setImported(0);
    setTotal(0);
    setStage("");
    setPercentage(0);
    setLoading(false);
    setPendingImport(false);
    setWaitingForSSE(false);
    localStorage.removeItem("cve_import_status");
    if (eventSourceRef.current) {
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
                setStatus("idle");
                setImported(0);
                setTotal(0);
                setLabel(t("cve.from_api"));
                setWarningMessage("");
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
          warningMessage={warningMessage}
          stage={stage}            // 👈 Nuevo prop
          percentage={percentage}  // 👈 Nuevo prop
        />
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          onClose={handleCancelDelete}
          deleting={deleting}
          count={cveCount}
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
