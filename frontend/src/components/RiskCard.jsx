import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";

const severityColors = {
  CRITICAL: "#e53935", // rojo fuerte
  HIGH: "#fb8c00",     // naranja
  MEDIUM: "#fdd835",   // amarillo
  LOW: "#43a047",      // verde
  NONE: "#9e9e9e",     // gris
  ALL: "#1e88e5",      // azul
};

export default function RiskCard({ level, count, deviceId }) {
  const navigate = useNavigate();
  const color = severityColors[level] || theme.colors.surface;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        console.log("👀 Navegando desde RiskCard con:", { deviceId, level });
        if (level === "ALL") {
          navigate(APP_ROUTES.DEVICE_VULNERABILITIES(deviceId));
        } else {
          navigate(APP_ROUTES.DEVICE_VULNERABILITIES_BY_SEVERITY(deviceId, level));
        }
      }}
      style={{
        backgroundColor: color,
        color: "white",
        borderRadius: theme.radius.xl,
        padding: "1.5rem",
        boxShadow: theme.shadow.soft,
        cursor: "pointer",
        textAlign: "center",
        transition: theme.transition.base,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "160px",
      }}
    >
      <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "0.5rem" }}>{level}</h3>
      <p style={{ fontSize: "40px", fontWeight: "800", margin: "0" }}>{count}</p>
      <p style={{ fontSize: "14px", marginTop: "0.5rem" }}>
        vulnerabilidades detectadas
      </p>
    </motion.div>
  );
}
