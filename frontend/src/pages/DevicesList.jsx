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
import DeleteDeviceModal from "@/components/modals/DeleteDeviceModal";
import { theme } from "@/styles/theme";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotification } from "@/context/NotificationContext";

export default function DevicesList() {
  const [devices, setDevices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { notify } = useNotification();

  // Función para cargar los dispositivos del usuario
  const fetchDevices = () => {
    axios
      .get(API_ROUTES.DEVICES.MY_DEVICES, { withCredentials: true })
      .then((res) => setDevices(res.data))
      .catch((err) => {
        notify("error", `${t("devicesList.errorLoadingDevices")}: ${err.message}`);
      });
  };

  // Carga inicial de dispositivos
  useEffect(() => {
    fetchDevices();
  }, []);

  // Función para traducir el tipo de dispositivo según idioma
  const translateDeviceType = (type) => {
    const lang = i18n.language || "es";
    const mapping = {
      laptop: {
        es: "Portátil",
        en: "Laptop",
      },
      desktop: {
        es: "Sobremesa",
        en: "Desktop",
      },
      server: {
        es: "Servidor",
        en: "Server",
      },
    };
    // Retorna traducción si existe, sino el mismo valor
    return mapping[type]?.[lang] ?? type;
  };

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
            padding: 24,
            fontFamily: theme.font.family,
          }}
        >
          {/* Encabezado y botón para crear nuevo equipo */}
          <div
            style={{
              width: "100%",
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
                aria-label={t("devicesList.back_button_aria") || "Volver al dashboard"}
                style={{
                  backgroundColor: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
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
                <h1 style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>
                  {t("devicesList.title")}
                </h1>
              </div>
              <div style={{ width: 52 }}></div>
            </div>

            <p
              style={{
                fontSize: "1.125rem",
                color: theme.colors.textSecondary || "#94a3b8",
                marginTop: 0,
                marginBottom: "5rem",
                textAlign: "center",
              }}
            >
              {t("devicesList.subtitle")}
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
                      {t("devicesList.create_new_device")}
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

          {/* Lista de dispositivos */}
          {devices.length === 0 ? (
            <p style={{ color: theme.colors.muted }}>{t("devicesList.no_devices")}</p>
          ) : (
            <motion.div
              layout
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: 20,
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
                    position: "relative",
                  }}
                >
                  {/* Botón eliminar */}
                  <button
                    onClick={() => setDeviceToDelete(device.id)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                    }}
                    title={t("devicesList.delete_device_button_title")}
                    aria-label={t("devicesList.delete_device_button_aria")}
                  >
                    <Trash2 size={20} />
                  </button>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      alignItems: "center",
                      justifyItems: "center",
                      textAlign: "center",
                      gap: "1rem",
                      minHeight: 160,
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: "700", margin: 0 }}>{device.alias}</h2>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        alignItems: "center",
                      }}
                    >
                      <p style={{ fontSize: 15, margin: 0, color: theme.colors.textSecondary }}>
                        <strong>{t("devicesList.type_label")}:</strong> {translateDeviceType(device.type)}
                      </p>
                      <p style={{ fontSize: 15, margin: 0, color: theme.colors.textSecondary }}>
                        <strong>{t("devicesList.os_label")}:</strong> {device.os_name}
                      </p>
                      <p style={{ fontSize: 15, margin: 0, color: theme.colors.textSecondary }}>
                        <strong>{t("devicesList.apps_label")}:</strong>{" "}
                        {device.config?.filter((c) => c.type === "a").length ?? 0}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <Button
                        width="120px"
                        onClick={() => navigate(APP_ROUTES.DEVICE_MATCHING(device.id))}
                        hoverEffect="brightness"
                        style={{ padding: "6px 10px", fontSize: 13 }}
                      >
                        {t("devicesList.matching_button")}
                      </Button>
                      <Button
                        width="120px"
                        onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG(device.id))}
                        hoverEffect="brightness"
                        variant="textSecondary"
                        style={{ padding: "6px 10px", fontSize: 13 }}
                      >
                        {t("devicesList.config_button")}
                      </Button>
                      <Button
                        width="120px"
                        onClick={() => navigate(APP_ROUTES.DEVICE_VULNERABILITIES_OVERVIEW(device.id))}
                        hoverEffect="brightness"
                        variant="warning"
                        style={{ padding: "6px 10px", fontSize: 13 }}
                      >
                        {t("devicesList.vulns_button")}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </PageWrapper>

      {/* Modal eliminar dispositivo */}
      {deviceToDelete && (
        <DeleteDeviceModal
          deviceId={deviceToDelete}
          onClose={() => setDeviceToDelete(null)}
          onDeleted={() => {
            setDeviceToDelete(null);
            fetchDevices();
          }}
        />
      )}
    </MainLayout>
  );
}
