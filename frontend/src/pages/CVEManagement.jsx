import { useState, useRef } from "react";
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
  const eventSourceRef = useRef(null);

  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const handleImportFromSSE = (url, labelText) => {
    setStatus("running");
    setImported(0);
    setTotal(0);
    setLabel(labelText);
    setLoading(true);
    setShowModal(true);
    addNotification(t("cve.import_start", { source: labelText }), "info");

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const cleanData = event.data.startsWith("data: ") ? event.data.slice(6) : event.data;
        const data = JSON.parse(cleanData);

        if (data.type === "start") {
          setTotal(data.total || data.files || 0);
          setLabel(t("cve.importing"));
        } else if (data.type === "progress") {
          setImported(data.imported);
          setTotal(data.total || total);
          setLabel(data.file ? `${t("cve.file")}: ${data.file}` : t("cve.importing"));
        } else if (data.type === "done") {
          setImported(data.imported);
          setStatus("finished");
          setLoading(false);
          setLabel(t("cve.completed"));
          eventSource.close();
          eventSourceRef.current = null;
          addNotification(t("cve.import_success", { count: data.imported }), "success");
        } else if (data.type === "error") {
          throw new Error(data.message || "Error inesperado");
        }
      } catch (err) {
        setStatus("error");
        setLoading(false);
        setLabel(t("cve.error_processing"));
        eventSource.close();
        eventSourceRef.current = null;
        addNotification(t("cve.import_error", { error: err.message }), "error");
      }
    };

    eventSource.onerror = () => {
      setStatus("error");
      setLoading(false);
      setLabel(t("cve.connection_error"));
      eventSource.close();
      eventSourceRef.current = null;
      addNotification(t("cve.connection_error"), "error");
    };
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
  };

  const handleStopImport = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("idle");
    setLoading(false);
    setLabel(t("cve.completed"));
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
              onClick={() => handleImportFromSSE("http://localhost:8000/nvd/cve-import-stream", t("cve.from_api"))}
            />

            <CVEPanel
              icon={<Trash2 size={64} />}
              title={t("cve.delete_button")}
              subtitle={t("cve.all")}
              color="#dc2626"
              onClick={handleDeleteAll}
            />
          </div>
        </div>

        <ImportProgressModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onStop={handleStopImport}
          imported={imported}
          total={total}
          label={label}
          status={status}
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
