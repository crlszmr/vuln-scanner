import ReactDOM from "react-dom";
import { theme } from "@/styles/theme";

export default function ImportProgressModal({
  isOpen,
  onClose,
  onStop,
  imported,
  total,
  label,
  status,
}) {
  if (!isOpen) return null;

  const canClose = status !== "running";

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
        <h2 style={styles.title}>Importando CVEs</h2>

        {/* Barra */}
        <div style={styles.progressWrapper}>
          <div style={styles.progressText}>
            {imported} / {total || "?"} importados
          </div>
          <div style={styles.barOuter}>
            <div
              style={{
                ...styles.barInner,
                width: total > 0 ? `${(imported / total) * 100}%` : "0%",
              }}
            />
          </div>
          <div style={styles.statusText}>{label}</div>
        </div>

        {/* Botón de parada */}
        {status === "running" && (
          <button onClick={onStop} style={styles.stopButton}>
            Detener
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
    backgroundColor: "rgba(15, 23, 42, 0.8)", // fondo oscuro
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: theme.colors.surface || "#1e293b",
    borderRadius: "16px",
    padding: "2rem",
    minWidth: "400px",
    maxWidth: "90vw",
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
