import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { Bug, Trash2 } from "lucide-react";
import ImportProgressModalCWE from "@/components/modals/ImportProgressModalCWE";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { useNotification } from "@/context/NotificationContext";

export default function CWEManagement() {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("idle");
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("");
  const [waitingForSSE, setWaitingForSSE] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [percentage, setPercentage] = useState(0);
  const [count, setCount] = useState(null);
  const [current, setCurrent] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cweCount, setCweCount] = useState(0);

  const eventSourceRef = useRef(null);

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

      const res = await fetch("http://localhost:8000/nvd/cwe-import-start", {
        method: "POST",
      });

      if (!res.ok) throw new Error();

      const eventSource = new EventSource("http://localhost:8000/nvd/cwe-import-stream");
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          let dataStr = event.data;
          if (dataStr.startsWith("data: ")) {
            dataStr = dataStr.replace("data: ", "");
          }
          const data = JSON.parse(dataStr);
          if (data.imported !== undefined) setImported(data.imported);
          if (data.total !== undefined) setTotal(data.total);
          if (data.percentage !== undefined) setPercentage(data.percentage);
          if (data.count !== undefined) setCount(data.count);
          if (data.current !== undefined) setCurrent(data.current);
          if (data.label !== undefined) setLabel(data.label);

          if (data.type === "start") {
            setStatus("running");
            setShowModal(true);
            setWaitingForSSE(false);
          }

          if (data.type === "done") {
            setStatus("completed");
            setWaitingForSSE(false);
            setPercentage(0);
            addNotification(t("cwe.import_success", { count: data.imported }), "success");
            eventSource.close();
          }

          if (data.type === "warning") {
            setStatus("warning");
            setWarningMessage(data.message || t("cwe.too_many_new"));
            setWaitingForSSE(false);
            eventSource.close();
          }
        } catch (err) {
          console.error("[CWE SSE ERROR]", err, event.data);
          setStatus("error");
          setLabel("cwe.connection_error");
          setWaitingForSSE(false);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setStatus("error");
        setLabel("cwe.connection_error");
        setWaitingForSSE(false);
        eventSource.close();
        addNotification(t("cwe.connection_error"), "error");
      };
    } catch (err) {
      setStatus("error");
      setWaitingForSSE(false);
      setLabel("cwe.error_starting");
      addNotification(t("cwe.error_starting"), "error");
    }
  };

  const handleStopImport = async () => {
    setStatus("idle");
    setLabel("cwe.aborted_by_user");
    setWaitingForSSE(false);
    setPendingImport(true);
    setCount(null);
    setCurrent(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    fetch("http://localhost:8000/nvd/cwe-import-stop", { method: "POST" }).catch(() => {});
  };

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
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleDeleteAll = () => setShowDeleteModal(true);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("http://localhost:8000/nvd/cwe-delete-all", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar CWEs.");
      addNotification(t("cwe.delete_success"), "success");
      setStatus("idle");
      setShowDeleteModal(false);
    } catch (err) {
      addNotification(t("cwe.delete_error", { error: err.message }), "error");
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
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            {t("cwe.title")}
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginBottom: "2rem",
            }}
          >
            {t("cwe.description")}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "40px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <CWEPanel
              icon={<Bug size={64} />}
              title={t("cwe.import_button")}
              subtitle={t("cwe.from_xml") || "JSON"}
              color="#0ea5e9"
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
              }}
            />

            <CWEPanel
              icon={<Trash2 size={64} />}
              title={t("cwe.delete_button")}
              subtitle={t("cwe.all") || "ALL"}
              color="#ef4444"
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

        <ImportProgressModalCWE
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
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          onClose={handleCancelDelete}
          deleting={deleting}
          count={cweCount}
        />
      </PageWrapper>
    </MainLayout>
  );
}

function CWEPanel({ icon, title, subtitle, color, onClick }) {
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
