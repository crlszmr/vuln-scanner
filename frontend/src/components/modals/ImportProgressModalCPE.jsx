import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";

/**
 * Modal que muestra el progreso de importación de CPEs con soporte para
 * estados de advertencia, carga y progreso visual e internacionalización real.
 */
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

  // Identifica si está en la fase de procesamiento masivo (no mostrar barra/progreso)
  const isProcessingItems = label === "cpe.processing_new_items";

  // Mensaje final a mostrar (siempre usa label y variables, sin switch)
  function getImportLabel() {
    console.log("LABEL:", label);
    return t(label, {
      imported,
      total,
      count,
      current,
      total_platforms,
      total_titles,
      total_refs,
      total_deprecated,
    });
  }

  if (!isOpen) return null;

  const canClose = status !== "running";
  const formattedImported = imported?.toLocaleString("es-ES") ?? "0";
  const formattedTotal = total?.toLocaleString("es-ES") ?? "0";
  const isWarning = status === "warning";

  // Estilos y tema definidos localmente para que el componente sea autocontenido
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
        {/* Botón para cerrar el modal */}
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

        {/* Título del modal */}
        <h2 style={styles.title}>{t("cpe.import_modal_title")}</h2>

        {/* Contenido dinámico del modal según estado */}
        <div style={styles.progressWrapper}>
          {isWarning ? (
            <div style={styles.statusText}>
              {t("cpe.too_many_new_warning")}
            </div>
          ) : (status === "running" || waitingForSSE) ? (
            <div style={styles.spinnerWrapper}>
              <div style={styles.spinner}></div>
              <div style={styles.statusText}>
                {getImportLabel()}
              </div>
              {/* SOLO muestra el progreso si no es procesamiento masivo */}
              {!isProcessingItems && total > 0 && (
                <div style={styles.progressText}>
                  {formattedImported} / {formattedTotal}
                </div>
              )}
              {!isProcessingItems && (percentage > 0 && percentage < 100) && (
                <div style={styles.barOuter}>
                  <div style={{
                    ...styles.barInner,
                    width: `${percentage}%`,
                  }}></div>
                </div>
              )}
            </div>
          ) : status === "completed" ? (
            <div style={styles.statusText}>
              {t("cpe.completed")}
            </div>
          ) : (status === "idle" || pendingImport) ? (
            <div style={styles.statusText}>{t("cpe.from_xml")}</div>
          ) : null}
        </div>

        {/* Botones de acción */}
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
