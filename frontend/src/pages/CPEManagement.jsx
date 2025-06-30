import { useState, useRef, useEffect } from "react";
import { useNotification } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { CloudDownload, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ImportProgressModalCPE from "@/components/modals/ImportProgressModalCPE";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";

const MIN_MSG_DELAY = 2000;

export default function CPEManagement() {
  const [status, setStatus] = useState("idle");
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("");
  const [percentage, setPercentage] = useState(0);
  const [count, setCount] = useState(null);
  const [current, setCurrent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [waitingForSSE, setWaitingForSSE] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const eventSourceRef = useRef(null);
  const [totalPlatforms, setTotalPlatforms] = useState(0);
  const [totalTitles, setTotalTitles] = useState(0);
  const [totalRefs, setTotalRefs] = useState(0);
  const [totalDeprecated, setTotalDeprecated] = useState(0);

  const [messageQueue, setMessageQueue] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const lastMessageTimestamp = useRef(Date.now());
  const timerRef = useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [platformCount, setPlatformCount] = useState(0);

  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const DELAYED_KEYS = [
    "cpe.connecting_nvd",
    "cpe.xml_checked",
    "cpe.downloading_xml",
    "cpe.parsing_xml",
    "cpe.getting_existing",
    "cpe.parsing_completed",
    "cpe.existing_count",
  ];

  // Controla la cola de mensajes para el modal de progreso
  useEffect(() => {
    if (messageQueue.length === 0 || currentMessage) return;

    const nextMsg = messageQueue[0];
    const isProcessing = nextMsg?.label === "cpe.processing_new_items";
    const needsDelay = DELAYED_KEYS.includes(nextMsg?.label);

    const showNextMessage = () => {
      setCurrentMessage(nextMsg);
      setMessageQueue((q) => q.slice(1));
      lastMessageTimestamp.current = Date.now();
    };

    const now = Date.now();
    const elapsed = now - lastMessageTimestamp.current;

    if (isProcessing || !needsDelay || elapsed >= MIN_MSG_DELAY) {
      showNextMessage();
    } else {
      timerRef.current = setTimeout(showNextMessage, MIN_MSG_DELAY - elapsed);
    }

    return () => clearTimeout(timerRef.current);
  }, [messageQueue, currentMessage]);

  // Comprueba si ya hay una importación activa al montar
  useEffect(() => {
    fetch("/nvd/cpe-import-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.running) {
          setShowModal(true);
          setStatus("running");
          setLabel(data.label);
          setImported(data.imported);
          setTotal(data.total);
          setPercentage(data.percentage);
          setCount(data.imported);
          setCurrent(data.imported);
          setWaitingForSSE(false);
        }
      });
  }, []);

  // Configura y gestiona los mensajes recibidos desde el backend vía Server-Sent Events (SSE)
  const setupEventSource = (eventSource) => {
    eventSource.onmessage = (event) => {
      setWaitingForSSE(false);
      try {
        const cleanData = event.data.startsWith("data: ") ? event.data.slice(6) : event.data;
        const data = JSON.parse(cleanData);

        // Añadir a la cola de mensajes si es de tipo válido
        if (["label", "start", "progress", "done", "start_inserting"].includes(data.type)) {
          setMessageQueue((queue) => [...queue, data]);
        }

        // Actualizar contadores
        if (data.imported !== undefined) setImported(Number(String(data.imported).replace(/\./g, "")));
        if (data.total !== undefined) setTotal(Number(String(data.total).replace(/\./g, "")));
        if (data.total_to_insert !== undefined) setTotal(Number(String(data.total_to_insert).replace(/\./g, "")));
        if (data.count !== undefined) setCount(Number(String(data.count).replace(/\./g, "")));

        if (data.percentage !== undefined) setPercentage(data.percentage);
        if (data.current !== undefined) setCurrent(data.current);
        if (data.label !== undefined) setLabel(data.label);

        if (data.type === "start") {
          setStatus("running");
          setShowModal(true);
          setWaitingForSSE(false);
        } else if (data.type === "progress") {
          setStatus("running");
        } else if (data.type === "done") {
          setStatus("completed");
          setWaitingForSSE(false);
          setPercentage(0);
          if (eventSourceRef.current) eventSourceRef.current.close();
          eventSourceRef.current = null;
          localStorage.removeItem("cpe_import_status");
          addNotification(t("cpe.import_finished"), "success");
        } else if (data.type === "warning") {
          setStatus("warning");
          setWarningMessage(data.message || t("cpe.too_many_new_warning"));
          setImported(0);
          setTotal(0);
          setPercentage(0);
          setWaitingForSSE(false);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          localStorage.removeItem("cpe_import_status");
        } else if (data.type) {
          setStatus("running");
        }
      } catch (err) {
        setWaitingForSSE(false);
        setStatus("error");
        setLabel("cpe.connection_error");
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        localStorage.removeItem("cpe_import_status");
        addNotification(t("cpe.connection_error"), "error");
        console.error("[SSE] Error procesando evento:", err, event.data);
      }
    };

    eventSource.onerror = (err) => {
      setWaitingForSSE(false);
      setStatus("error");
      setLabel("cpe.connection_error");
      if (eventSourceRef.current) eventSourceRef.current.close();
      eventSourceRef.current = null;
      localStorage.removeItem("cpe_import_status");
      addNotification(t("cpe.connection_error"), "error");
      console.error("[SSE] Error de conexión", err);
    };
  };

  // Comprueba si hay una importación activa (usando localStorage y backend)
  useEffect(() => {
    const checkImportStatus = async () => {
      const runningFlag = localStorage.getItem("cpe_import_status");
      if (runningFlag === "running") {
        setShowModal(true);
        setStatus("running");
        setWaitingForSSE(true);
        setLabel("cpe.importing_from_nvd");
        if (!eventSourceRef.current) {
          const eventSource = new EventSource("http://localhost:8000/nvd/cpe-import-stream");
          eventSourceRef.current = eventSource;
          setupEventSource(eventSource);
        }
      }

      try {
        const res = await fetch("http://localhost:8000/nvd/cpe-import-status");
        const statusData = await res.json();

        if (statusData.running) {
          setShowModal(true);
          setStatus("running");
          setImported(statusData.imported || 0);
          setTotal(statusData.total || 0);
          setLabel(statusData.label || "");
          setPercentage(statusData.percentage || 0);
          setWaitingForSSE(true);
          setCount(statusData.count ?? null);
          setCurrent(statusData.current ?? null);
          setTotalPlatforms(statusData.total_platforms || 0);
          setTotalTitles(statusData.total_titles || 0);
          setTotalRefs(statusData.total_refs || 0);
          setTotalDeprecated(statusData.total_deprecated || 0);

          localStorage.setItem("cpe_import_status", "running");

          if (!eventSourceRef.current) {
            const eventSource = new EventSource("http://localhost:8000/nvd/cpe-import-stream");
            eventSourceRef.current = eventSource;
            setupEventSource(eventSource);
          }
        }
      } catch (err) {
        setWaitingForSSE(false);
        setStatus("error");
        setLabel("cpe.connection_error");
        console.error("[STATUS CHECK] Error consultando estado:", err);
      }
    };

    checkImportStatus();
  }, []);

  // Inicia el proceso de importación de CPEs
  const handleStartImport = async () => {
    try {
      setStatus("idle");
      setLabel("");
      setPercentage(0);
      setImported(0);
      setTotal(0);
      setCount(null);
      setCurrent(null);
      setWaitingForSSE(true);
      setPendingImport(false);
      setWarningMessage("");
      setMessageQueue([]);
      setCurrentMessage(null);
      localStorage.setItem("cpe_import_status", "running");

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const res = await fetch("http://localhost:8000/nvd/cpe-import-start", { method: "POST" });
      if (!res.ok) throw new Error();

      const eventSource = new EventSource("http://localhost:8000/nvd/cpe-import-stream");
      eventSourceRef.current = eventSource;
      setupEventSource(eventSource);
    } catch (err) {
      setWaitingForSSE(false);
      setStatus("error");
      setLabel("cpe.error_starting");
      localStorage.removeItem("cpe_import_status");
      addNotification(t("cpe.error_starting"), "error");
      console.error("[handleStartImport] Error iniciando importación:", err);
    }
  };

  // Detiene el proceso de importación de CPEs
  const handleStopImport = async () => {
    setStatus("idle");
    setLabel("cpe.aborted_by_user");
    setWaitingForSSE(false);
    setPendingImport(true);
    setCount(null);
    setCurrent(null);
    setMessageQueue([]);
    setCurrentMessage(null);
    localStorage.removeItem("cpe_import_status");
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    try {
      await fetch("http://localhost:8000/nvd/cpe-import-stop", { method: "POST" });
    } catch {
      // no-op
    }
  };

  // Cierra el modal de progreso y limpia estados
  const handleCloseModal = () => {
    setShowModal(false);
    setStatus("idle");
    setLabel("");
    setWarningMessage("");
    setImported(0);
    setTotal(0);
    setPercentage(0);
    setPendingImport(false);
    setWaitingForSSE(false);
    setCount(null);
    setCurrent(null);
    setMessageQueue([]);
    setCurrentMessage(null);
    localStorage.removeItem("cpe_import_status");
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // Eliminar todos los CPEs
  const handleDeleteAll = () => setShowDeleteModal(true);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("http://localhost:8000/nvd/cpe-delete-all", { method: "DELETE" });
      if (!res.ok) throw new Error("Server error");
      addNotification(t("cpe.delete_success"), "success");
      setStatus("idle");
      setImported(0);
      setTotal(0);
      setLabel("");
      setShowDeleteModal(false);
    } catch (err) {
      addNotification(t("cpe.delete_error", { error: err.message }), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => setShowDeleteModal(false);

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
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>{t("cpe.import_modal_title")}</h1>
          <p style={{ fontSize: "1.125rem", color: theme.colors.textSecondary || "#94a3b8", marginBottom: "2rem" }}>{t("cpe.ready")}</p>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "40px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <CPEPanel
              icon={<CloudDownload size={64} />}
              title={t("cpe.import_button")}
              subtitle={t("cpe.from_xml")}
              color="#16a34a"
              onClick={() => {
                setShowModal(true);
                setStatus("idle");
                setImported(0);
                setTotal(0);
                setLabel("");
                setWarningMessage("");
                setPendingImport(true);
                setWaitingForSSE(false);
                setCount(null);
                setCurrent(null);
                setMessageQueue([]);
                setCurrentMessage(null);
              }}
            />
            <CPEPanel
              icon={<Trash2 size={64} />}
              title={t("cpe.delete_button")}
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

        <ImportProgressModalCPE
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
          percentage={percentage}
          count={count}
          current={current}
          total_platforms={totalPlatforms}
          total_titles={totalTitles}
          total_refs={totalRefs}
          total_deprecated={totalDeprecated}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          onClose={handleCancelDelete}
          deleting={deleting}
          count={platformCount}
        />
      </PageWrapper>
    </MainLayout>
  );
}

// Panel reutilizable con efecto visual al pasar el ratón
function CPEPanel({ icon, title, subtitle, color, onClick }) {
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