import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";

export default function ImportProgressModalCPE({
  isOpen,
  onClose,
  onStart,
  onStop,
  imported,
  total,
  label,
  status,
  waitingForSSE,
  pendingImport,
  warningMessage,
  percentage,
  count,
  current,
  total_platforms,
  total_titles,
  total_refs,
  total_deprecated,
}) {
  const { t } = useTranslation();
  const [queue, setQueue] = useState([]);
  const [displayedLabel, setDisplayedLabel] = useState(label);
  const queueRef = useRef(queue);
  const processingRef = useRef(false);

  const isInsertPhase =
    status === "running" &&
    percentage != null &&
    total > 0 &&
    (displayedLabel === "cpe.inserting_items" || label === "cpe.inserting_items");

  // Actualizar cola en referencia
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Restaurar el label tras recarga si está en fase de inserción
  useEffect(() => {
    if (isOpen && label === "cpe.inserting_items") {
      setDisplayedLabel("cpe.inserting_items");
    }
  }, [label, isOpen]);

  // Registro para depuración
  useEffect(() => {
    console.log("🧪 isInsertPhase", {
      displayedLabel,
      label,
      percentage,
      total,
      isInsertPhase,
    });
  }, [displayedLabel, label, percentage, total]);

  // Añadir label nuevo a la cola (evita duplicados consecutivos)
  useEffect(() => {
    if (!isOpen || !label) return;
    setQueue((q) => {
      if ((q.length === 0 && displayedLabel === label) || q[q.length - 1] === label) return q;
      return [...q, label];
    });
  }, [label, isOpen]);

  // Procesar secuencialmente la cola de labels
  useEffect(() => {
    if (!isOpen || processingRef.current || queueRef.current.length === 0) return;

    processingRef.current = true;

    async function processQueue() {
      while (queueRef.current.length > 0) {
        setDisplayedLabel(queueRef.current[0]);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setQueue((q) => {
          const newQ = q.slice(1);
          queueRef.current = newQ;
          return newQ;
        });
      }
      processingRef.current = false;
    }

    processQueue();

    return () => {
      processingRef.current = false;
    };
  }, [isOpen, queue]);

  // Reset al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setQueue([]);
      setDisplayedLabel(label);
      processingRef.current = false;
    }
  }, [isOpen]);

  function getImportLabel() {
    if (displayedLabel)
      return t(displayedLabel, {
        imported,
        total,
        count,
        current,
        total_platforms,
        total_titles,
        total_refs,
        total_deprecated,
      });
    if (waitingForSSE) return t("cpe.waiting_sse");
    if (pendingImport) return t("cpe.from_xml");
    if (status === "error") return t("cpe.connection_error");
    return t("cpe.ready");
  }

  if (!isOpen) return null;

  const canClose = status !== "running";
  const isWarning = status === "warning";

  const localTheme = {
    colors: {
      surface: "#1e293b",
      text: "white",
      textSecondary: "#94a3b8",
    },
    font: {
      family: "Inter, sans-serif",
    },
    shadow: {
      medium: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
  };
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
      backgroundColor: localTheme.colors.surface,
      borderRadius: "16px",
      padding: "2rem",
      width: "450px",
      textAlign: "center",
      position: "relative",
      color: localTheme.colors.text,
      fontFamily: localTheme.font.family,
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
      color: localTheme.colors.textSecondary,
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
    spinnerWrapper: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginTop: "1.5rem",
      gap: "1rem",
    },
    spinner: {
      width: "36px",
      height: "36px",
      border: "4px solid #94a3b8",
      borderTop: "4px solid #22c55e",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
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
        <h2 style={styles.title}>{t("cpe.import_modal_title")}</h2>
        {!isInsertPhase && !waitingForSSE && status !== "running" && (
          <div style={styles.statusText}>{getImportLabel()}</div>
        )}

        <div style={styles.progressWrapper}>
          {isInsertPhase ? (
            <>
              <div style={styles.progressText}>
                {t("cpe.completion_percentage", { percentage: Math.round(percentage || 0) })}
              </div>
              <div style={styles.barOuter}>
                <div
                  style={{
                    ...styles.barInner,
                    width: `${percentage || 0}%`,
                  }}
                ></div>
              </div>
              <div style={styles.statusText}>{t("cpe.importing_from_nvd")}</div>
            </>
          ) : (
            (status === "running" || waitingForSSE) && (
              <div style={styles.spinnerWrapper}>
                <div style={styles.spinner}></div>
                <div style={styles.statusText}>{getImportLabel()}</div>
              </div>
            )
          )}
        </div>

        {(status === "idle" || pendingImport) &&
          !waitingForSSE &&
          status !== "warning" && (
            <button onClick={onStart} style={styles.startButton}>
              {t("cpe.start")}
            </button>
          )}

        {status === "running" && (
          <button onClick={onStop} style={styles.stopButton}>
            {t("cpe.stop_import")}
          </button>
        )}

        {isWarning && (
          <button onClick={onClose} style={styles.startButton}>
            {t("cpe.accept")}
          </button>
        )}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}
