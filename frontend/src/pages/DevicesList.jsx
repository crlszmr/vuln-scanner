import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { APP_ROUTES } from "@/config/appRoutes";
import { API_ROUTES } from "@/config/apiRoutes";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import { theme } from "@/styles/theme";

export default function DevicesList() {
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(API_ROUTES.DEVICES.MY_DEVICES, { withCredentials: true })
      .then((res) => {
        console.log("📦 Devices:", res.data);
        setDevices(res.data);
      })
      .catch((err) => console.error("Error loading devices:", err));
  }, []);

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 160px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "2rem",
            fontFamily: theme.font.family,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Mis equipos</h1>
            <Button onClick={() => navigate(APP_ROUTES.DEVICE_UPLOAD)}>
              Crear nuevo equipo
            </Button>
          </div>

          {devices.length === 0 ? (
            <p style={{ color: theme.colors.muted }}>
              Aún no tienes ningún equipo registrado.
            </p>
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: "800px",
                display: "grid",
                gap: "20px",
              }}
            >
              {devices.map((device) => (
                <motion.div
                  key={device.id}
                  onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG(device.id))}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: "1px solid #334155",
                    borderRadius: theme.radius.xl,
                    padding: "1.5rem",
                    boxShadow: theme.shadow.soft,
                    cursor: "pointer",
                    transition: theme.transition.base,
                  }}
                >
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      marginBottom: "1.25rem",
                      color: theme.colors.primary,
                    }}
                  >
                    {device.alias}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#4b5563", // gris Tailwind slate-600
                        color: "#f9fafb",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      Tipo: {device.type}
                    </span>

                    <span
                      style={{
                        backgroundColor: "#1e40af",
                        color: "#f8fafc",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      SO: {device.os_name}
                    </span>

                    <span
                      style={{
                        backgroundColor: "#064e3b",
                        color: "#d1fae5",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      Apps: {device.config?.filter((c) => c.type === "a").length ?? 0}
                    </span>
                  </div>
                </motion.div>

              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
