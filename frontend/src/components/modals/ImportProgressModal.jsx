import ReactDOM from "react-dom";
import { theme } from "@/styles/theme";
import { useTranslation } from "react-i18next";

export default function ImportProgressModal({
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
}) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const canClose = status !== "running";

  // Formatear números para mostrar puntos de miles
  const formattedImported = imported.toLocaleString('es-ES');
  const formattedTotal = total.toLocaleString('es-ES');

  return ReactDOM.createPortal(
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Cerrar */}
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

        {/* Título */}
        <h2 style={styles.title}>{t("cve.import_modal_title")}</h2>

        {/* Contenido */}
        <div style={styles.progressWrapper}>
          {status === "warning" ? (
            <div style={styles.warningBox}>
              <div style={styles.warningIcon}>⚠️</div>
              <div style={styles.warningText}>{warningMessage || t("cve.too_many_new")}</div>
              <div style={styles.warningSuggestion}>
                {t("cve.delete_and_reimport_suggestion")}
              </div>
            </div>
          ) : waitingForSSE && status !== "warning" ? (
            <div style={styles.spinnerWrapper}>
              <div style={styles.spinner}></div>
              <div style={styles.statusText}>
                {label || t("cve.loading_status")}
              </div>
            </div>
          ) : status === "idle" || pendingImport ? (
            <div style={styles.statusText}>{t("cve.from_api")}</div>
          ) : status === "completed" && !waitingForSSE ? (
            <div style={styles.statusText}>
              {label || t("cve.no_new_cves")}
            </div>
          ) : (
            <>
              {status === "running" && (
                <>
                  <div style={styles.progressText}>
                    {formattedImported} {t("cve.of")} {formattedTotal} {t("cve.cves_imported")} {/* CAMBIO AQUI */}
                  </div>
                  <div style={styles.barOuter}>
                    <div
                      style={{
                        ...styles.barInner,
                        width: total > 0 ? `${(imported / total) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </>
              )}
              <div style={styles.statusText}>{label}</div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        {(status === "idle" || pendingImport) && !waitingForSSE && status !== "warning" && (
          <button onClick={onStart} style={styles.startButton}>
            {t("cve.start")}
          </button>
        )}

        {status === "running" && (
          <button onClick={onStop} style={styles.stopButton}>
            {t("cve.stop_import")}
          </button>
        )}
        
        {status === "warning" && (
          <button onClick={onClose} style={styles.startButton}>
            {t("cve.close")}
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
    width: "450px", // <-- ANCHO FIJO AQUI (ejemplo de 450px, puedes ajustarlo)
    // minWidth: "400px", // Esto ya no es tan necesario con un width fijo
    // maxWidth: "90vw", // Esto tampoco es tan necesario con un width fijo
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
  },
  barInner: {
    backgroundColor: "#22c55e",
    height: "100%",
    transition: "width 0.3s ease",
  },
  statusText: {
    marginTop: "0.75rem",
    color: "#94a3b8",
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
  warningBox: {
    backgroundColor: "#facc15",
    color: "#78350f",
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    fontWeight: 500,
    fontSize: "1rem",
    // Eliminamos maxWidth aquí, ya que el modal tiene un width fijo
    margin: "0 auto",
    boxShadow: theme.shadow.medium,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  warningIcon: {
    fontSize: '2.5rem',
  },
  warningText: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  warningSuggestion: {
    fontSize: '0.9rem',
    textAlign: 'center',
  }
};