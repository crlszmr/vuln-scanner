import ReactDOM from "react-dom";
import { theme } from "@/styles/theme";
import { useTranslation } from "react-i18next";

// Modal de confirmación para eliminar CVEs
export default function DeleteConfirmationModal({
  isOpen,
  onCancel,
  onConfirm,
  onClose,
  deleting,
  count,
}) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Botón de cierre */}
        <button
          onClick={deleting ? null : onClose}
          disabled={deleting}
          style={{
            ...styles.closeButton,
            opacity: deleting ? 0.4 : 1,
            cursor: deleting ? "not-allowed" : "pointer",
          }}
        >
          ✖
        </button>

        <h2 style={styles.title}>{t("cve.delete_title")}</h2>

        {deleting ? (
          <div style={styles.spinnerWrapper}>
            <div style={styles.spinner}></div>
            <div style={styles.statusText}>{t("cve.deleting_status")}</div>
          </div>
        ) : count === 0 ? (
          <>
            <p style={styles.confirmText}>{t("cve.nothing_to_delete")}</p>
            <div style={styles.buttonGroup}>
              <button onClick={onCancel} style={styles.startButton}>
                {t("cve.accept")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={styles.confirmText}>
              {t("cve.delete_confirmation", { count: count.toLocaleString("es-ES") })}
            </p>
            <div style={styles.buttonGroup}>
              <button onClick={onCancel} style={styles.cancelButton}>
                {t("cve.cancel")}
              </button>
              <button onClick={onConfirm} style={styles.deleteButton}>
                {t("cve.confirm_delete")}
              </button>
            </div>
          </>
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
  confirmText: {
    fontSize: "1rem",
    marginBottom: "1.5rem",
    color: "#e2e8f0",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    color: "white",
    fontWeight: 600,
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#475569",
    color: "white",
    fontWeight: 600,
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
  startButton: {
    marginTop: "1rem",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: "8px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  spinnerWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
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
  statusText: {
    marginTop: "0.5rem",
    color: "#94a3b8",
  },
};
