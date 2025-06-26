import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { APP_ROUTES } from "@/config/appRoutes";
import { API_ROUTES } from "@/config/apiRoutes";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import DeviceUploadForm from "@/components/forms/DeviceUploadForm";
import { theme } from "@/styles/theme";

export default function DevicesList() {
  const [devices, setDevices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchDevices = () => {
    axios
      .get(API_ROUTES.DEVICES.MY_DEVICES, { withCredentials: true })
      .then((res) => setDevices(res.data))
      .catch((err) => console.error("Error loading devices:", err));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <MainLayout>
      <PageWrapper>
        <motion.div
          layout
          style={{
            minHeight: "calc(100vh - 160px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "24px",
            fontFamily: theme.font.family,
          }}
        >
         <div
  style={{
    width: "100%",
    maxWidth: "100%",
    marginBottom: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    }}
  >
    <button
      onClick={() => navigate(APP_ROUTES.USER_DASHBOARD)}
      style={{
        backgroundColor: "#334155",
        color: "white",
        border: "none",
        borderRadius: "12px",
        padding: "6px 14px",
        fontSize: "1.5rem",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = theme.shadow.medium;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      &lt;
    </button>

    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: "bold", margin: 0 }}>
        Mis equipos
      </h1>
    </div>

    <div style={{ width: "52px" }}></div>
  </div>

  {/* Subtítulo */}
  <p
    style={{
      fontSize: "1.125rem",
      color: theme.colors.textSecondary || "#94a3b8",
      marginTop: "0rem",
      marginBottom: "5rem",
      textAlign: "center",
    }}
  >
    Gestiona tus equipos y analiza sus vulnerabilidades
  </p>

  <AnimatePresence mode="wait">
    {!showForm && (
      <motion.div
        key="crear-btn"
        layout
        initial={{ scale: 1 }}
        animate={{ scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div layoutId="crear-formulario" style={{ width: "auto" }}>
          <Button onClick={() => setShowForm(true)} variant="success">
            Crear nuevo equipo
          </Button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  <AnimatePresence>
    {showForm && (
      <motion.div
        key="upload-form"
        layout
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <DeviceUploadForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchDevices();
          }}
        />
      </motion.div>
    )}
  </AnimatePresence>
</div>

          {devices.length === 0 ? (
            <p style={{ color: theme.colors.muted }}>
              Aún no tienes ningún equipo registrado.
            </p>
          ) : (
            <motion.div
              layout
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: "20px",
              }}
            >
              {devices.map((device) => (
                <motion.div
                  layout
                  key={device.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.xl,
                    padding: "1.25rem",
                    boxShadow: theme.shadow.soft,
                    transition: theme.transition.base,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      alignItems: "center",
                      justifyItems: "center",
                      textAlign: "center",
                      gap: "1rem",
                      minHeight: "160px",
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>
                        {device.alias}
                      </h2>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      <p style={{ fontSize: "15px", margin: 0, color: theme.colors.textSecondary }}>
                        <span style={{ fontWeight: 700 }}>Tipo:</span> {device.type}
                      </p>
                      <p style={{ fontSize: "15px", margin: 0, color: theme.colors.textSecondary }}>
                        <span style={{ fontWeight: 700 }}>SO:</span> {device.os_name}
                      </p>
                      <p style={{ fontSize: "15px", margin: 0, color: theme.colors.textSecondary }}>
                        <span style={{ fontWeight: 700 }}>Nº Apps:</span>{" "}
                        {device.config?.filter((c) => c.type === "a").length ?? 0}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Button
                        width="120px"
                        onClick={() => navigate(APP_ROUTES.DEVICE_MATCHING(device.id))}
                        hoverEffect="brightness"
                        style={{ padding: "6px 10px", fontSize: "13px" }}
                      >
                        Matching
                      </Button>
                      <Button
                        width="120px"
                        onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG(device.id))}
                        hoverEffect="brightness"
                        variant="textSecondary"
                        style={{ padding: "6px 10px", fontSize: "13px" }}
                      >
                        Config
                      </Button>
                      <Button
                        width="120px"
                        onClick={() => navigate(`/devices/${device.id}/vulnerabilities/overview`)}
                        hoverEffect="brightness"
                        variant="warning"
                        style={{ padding: "6px 10px", fontSize: "13px" }}
                      >
                        Vulns
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </PageWrapper>
    </MainLayout>
  );
}
