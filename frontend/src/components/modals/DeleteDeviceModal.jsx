// DeleteDeviceModal.jsx
import ReactDOM from "react-dom";
import { useState } from "react";
import { theme } from "@/styles/theme";
import { useTranslation } from "react-i18next";
import { API_ROUTES } from "@/config/apiRoutes";
import { Button } from "@/components/ui/Button";

export default function DeleteDeviceModal({ deviceId, onClose, onDeleted }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("idle");

  const handleDelete = async () => {
    setStatus("deleting");
    try {
      const res = await fetch(API_ROUTES.DEVICES.DELETE_DEVICE(deviceId), {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.status === "deleted") {
        setStatus("deleted");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("[❌] Error eliminando dispositivo:", err);
      setStatus("error");
    }
  };

  const handleAccept = () => {
    onDeleted();
    onClose();
  };

  return ReactDOM.createPortal(
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>✖</button>
        <h2 style={styles.title}>{t("Eliminar equipo")}</h2>

        {status === "idle" && (
          <>
            <p style={styles.message}>{t("¿Está seguro que desea eliminar este equipo?")}</p>
            <div style={styles.buttonRow}>
              <button onClick={onClose} style={styles.cancelButton}>{t("Cancelar")}</button>
              <button onClick={handleDelete} style={styles.deleteButton}>{t("Eliminar")}</button>
            </div>
          </>
        )}

        {status === "deleting" && <p style={styles.message}>{t("Eliminando equipo...")}</p>}

        {status === "deleted" && (
          <>
            <p style={styles.message}>{t("Equipo eliminado correctamente")}</p>
            <div style={{ marginTop: "2rem" }}>
              <Button onClick={handleAccept} variant="primary">{t("Aceptar")}</Button>
            </div>
          </>
        )}

        {status === "error" && (
          <p style={{ ...styles.message, color: "red" }}>{t("Error al eliminar equipo")}</p>
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
    width: "500px",
    textAlign: "center",
    color: "white",
    fontFamily: theme.font.family,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    fontSize: "20px",
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
  },
  message: {
    fontSize: "1.125rem",
    marginBottom: "2rem",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  cancelButton: {
    padding: "0.75rem 2rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: "10px",
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "0.75rem 2rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: "10px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};
