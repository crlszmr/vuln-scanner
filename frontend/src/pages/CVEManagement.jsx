import { useState } from "react";
import { useNotification } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { CloudDownload, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CVEManagement() {
  const [status, setStatus] = useState("idle");
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const handleImportFromSSE = (url, labelText) => {
    setStatus("running");
    setImported(0);
    setTotal(0);
    setLabel(labelText);
    setLoading(true);
    addNotification(t("cve.import_start", { source: labelText }), "info");

    const eventSource = new EventSource(url);

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
          addNotification(t("cve.import_success", { count: data.imported }), "success");
        } else if (data.type === "error") {
          throw new Error(data.message || "Error inesperado");
        }
      } catch (err) {
        setStatus("error");
        setLoading(false);
        setLabel(t("cve.error_processing"));
        eventSource.close();
        addNotification(t("cve.import_error", { error: err.message }), "error");
      }
    };

    eventSource.onerror = () => {
      setStatus("error");
      setLoading(false);
      setLabel(t("cve.connection_error"));
      eventSource.close();
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

          {status === "running" && (
            <div style={{ marginTop: "2.5rem", width: "100%", maxWidth: "400px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
                {imported} / {total || "?"} {t("cve.imported")}
              </h2>
              <div style={{ width: "100%", backgroundColor: "#334155", borderRadius: "8px", overflow: "hidden", height: "20px" }}>
                <div
                  style={{
                    width: total > 0 ? `${(imported / total) * 100}%` : "0%",
                    backgroundColor: "#22c55e",
                    height: "100%",
                    transition: "width 0.3s ease"
                  }}
                ></div>
              </div>
              <p style={{ marginTop: "0.75rem", color: "#94a3b8" }}>{label}</p>
            </div>
          )}

          {status === "finished" && (
            <div style={{ marginTop: "2.5rem", width: "100%", maxWidth: "400px", color: "#22c55e" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>✅ {t("cve.import_complete")}</h2>
              <p style={{ fontSize: "1.125rem" }}>{imported} {t("cve.items_imported")}</p>
            </div>
          )}

          {status === "error" && (
            <div style={{ marginTop: "2.5rem", width: "100%", maxWidth: "400px", color: "#ef4444" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>❌ {t("cve.import_error_title")}</h2>
              <p>{t("cve.import_error_message")}</p>
            </div>
          )}
        </div>
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
