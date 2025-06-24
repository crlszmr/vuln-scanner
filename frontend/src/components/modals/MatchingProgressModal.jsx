import ReactDOM from "react-dom";
import { useEffect, useState, useRef } from "react";
import { theme } from "@/styles/theme";
import { useTranslation } from "react-i18next";
import { API_ROUTES } from "@/config/apiRoutes";

export default function MatchingProgressModal({ deviceId, onClose }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("idle");
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("");
  const [queue, setQueue] = useState([]);
  const [displayedLabel, setDisplayedLabel] = useState("");
  const queueRef = useRef([]);
  const processingRef = useRef(false);
  const eventSourceRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const canClose = status !== "running";

  const startMatching = () => {
    setStatus("running");
    setImported(0);
    setTotal(0);
    setQueue([]);
    setLabel("");
    setDisplayedLabel("");

    const url = API_ROUTES.DEVICES.MATCH_PROGRESS(deviceId);
    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const message = event.data;

      if (message === "[DONE]") {
        setStatus("completed");
        eventSource.close();
        return;
      }

      const match = message.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        setProgress(current);
        setTotal(total);
        const remaining = message.replace(match[0], "").trim();
        setLabel(remaining);
      } else {
        setLabel(message);
      }
    };

    eventSource.onerror = () => {
      setStatus("error");
      eventSource.close();
    };
  };

  useEffect(() => {
    if (label && (queue.length === 0 || queue[queue.length - 1] !== label)) {
      setQueue((prev) => [...prev, label]);
    }
  }, [label]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    if (!processingRef.current && queueRef.current.length > 0) {
      processingRef.current = true;

      async function processQueue() {
        while (queueRef.current.length > 0) {
          setDisplayedLabel(queueRef.current[0]);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setQueue((q) => {
            const newQ = q.slice(1);
            queueRef.current = newQ;
            return newQ;
          });
        }
        processingRef.current = false;
      }

      processQueue();
    }
  }, [queue]);

  const stopMatching = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setStatus("aborted");
    }
  };

  if (!deviceId) return null;

  const renderFormattedLabel = () => {
    if (!displayedLabel.toLowerCase().includes("procesando:")) return displayedLabel;

    const vendor = displayedLabel.match(/Vendor=([^,]*)/)?.[1];
    const product = displayedLabel.match(/Product=([^,]*)/)?.[1];
    const version = displayedLabel.match(/Version=([^\s]*)/)?.[1];

    return (
      <>
        <div><strong>Procesando plataforma...</strong></div>
        {vendor && <div>- Vendor: {vendor.trim()}</div>}
        {product && <div>- Product: {product.trim()}</div>}
        {version && <div>- Version: {version.trim()}</div>}
      </>
    );
  };


  return ReactDOM.createPortal(
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <button
          onClick={canClose ? onClose : null}
          disabled={!canClose}
          style={{
            ...styles.closeButton,
            opacity: canClose ? 1 : 0.4,
            cursor: canClose ? "pointer" : "not-allowed",
          }}
        >
          ✖
        </button>

        <h2 style={styles.title}>{t("Proceso de Matching")}</h2>

        <div style={styles.progressWrapper}>
          {status === "running" ? (
            <>
              <div style={styles.progressText}>{`${percentage}% completado`}</div>
              <div style={styles.barOuter}>
                <div style={{ ...styles.barInner, width: `${percentage}%` }}></div>
              </div>
              <div style={styles.statusText}>{renderFormattedLabel()}</div>
            </>
          ) : (
            <div style={styles.statusText}>
              {status === "idle"
                ? t("Listo para comenzar el análisis")
                : status === "completed"
                ? t("Análisis completado")
                : status === "aborted"
                ? t("Análisis cancelado")
                : status === "error"
                ? t("Error en el análisis")
                : ""}
            </div>
          )}
        </div>

        {status === "idle" && (
          <button onClick={startMatching} style={styles.startButton}>
            {t("Analizar este equipo")}
          </button>
        )}

        {status === "running" && (
          <button onClick={stopMatching} style={styles.stopButton}>
            {t("Detener")}
          </button>
        )}

        {(status === "completed" || status === "aborted" || status === "error") && (
          <button onClick={onClose} style={styles.startButton}>
            {t("Cerrar")}
          </button>
        )}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    zIndex: 9999,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: theme.colors.surface || "#1e293b",
    borderRadius: "16px",
    padding: "2rem",
    width: "450px",
    minHeight: "300px",
    textAlign: "center",
    position: "relative",
    color: "white",
    fontFamily: theme.font.family,
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    fontSize: "20px",
    background: "none",
    border: "none",
    color: "white",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: "1.5rem",
  },
  progressWrapper: {
    textAlign: "center",
  },
  progressText: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  barOuter: {
    width: "100%",
    backgroundColor: "#334155",
    borderRadius: "8px",
    overflow: "hidden",
    height: "20px",
    marginBottom: "0.75rem",
  },
  barInner: {
    backgroundColor: "#22c55e",
    height: "100%",
    transition: "width 0.3s ease",
  },
  statusText: {
    marginTop: "0.75rem",
    color: "#94a3b8",
    whiteSpace: "pre-line",
  },
  startButton: {
    marginTop: "2rem",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: "8px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  stopButton: {
    marginTop: "2rem",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: "8px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};
