import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { API_ROUTES } from "@/config/apiRoutes";
import { APP_ROUTES } from "@/config/appRoutes";
import { useTranslation } from "react-i18next";

const TYPE_LABELS = {
  os: "deviceConfig.os_label",
  hardware: "deviceConfig.hardware_label",
  software: "deviceConfig.software_label",
};

const TYPE_INTERNAL = {
  os: "o",
  hardware: "h",
  software: "a",
};

const PAGE_SIZE = 10;

export default function DeviceConfigDetail() {
  const { deviceId, type } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [deviceInfo, setDeviceInfo] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef(null);

  useEffect(() => {
    // Obtener configuraciones enriquecidas y filtrar por tipo
    const fetchConfigs = async () => {
      try {
        const res = await axios.get(API_ROUTES.DEVICES.GET_ENRICHED_CONFIG(deviceId), {
          withCredentials: true,
        });

        const allConfigs = Array.isArray(res.data) ? res.data : [];
        const typeKey = TYPE_INTERNAL[type];
        if (!typeKey) {
          return;
        }

        // Filtra por tipo y elimina CVEs resueltos
        const filtered = allConfigs
          .filter((c) => c.type === typeKey)
          .map((c) => ({
            ...c,
            cves: (c.cves || []).filter((cve) => !cve.solved),
          }))
          // Ordenar por vendor y producto (sin distinción de mayúsculas)
          .sort((a, b) => {
            const vendorComp = a.vendor.localeCompare(b.vendor, "es", { sensitivity: "base" });
            if (vendorComp !== 0) return vendorComp;
            return a.product.localeCompare(b.product, "es", { sensitivity: "base" });
          });

        setConfigs(filtered);
        setCurrentPage(1); // Reinicia paginación al cambiar tipo o dispositivo
      } catch (error) {
      }
    };

    // Obtener información básica del dispositivo (alias)
    const fetchDeviceInfo = async () => {
      try {
        const res = await axios.get(API_ROUTES.DEVICES.GET_CONFIG(deviceId), {
          withCredentials: true,
        });
        setDeviceInfo(res.data);
      } catch (error) {
        setDeviceInfo({ alias: t("deviceConfig.default_alias") });
      }
    };

    fetchConfigs();
    fetchDeviceInfo();
  }, [deviceId, type, t]);

  const totalPages = Math.ceil(configs.length / PAGE_SIZE);
  const paginatedConfigs = configs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Manejo del cambio de página
  const handlePageClick = (page) => {
    setCurrentPage(page);
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Genera botones para paginación con puntos suspensivos si es necesario
  const getPageButtons = () => {
    const buttons = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      if (currentPage <= 3) {
        buttons.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        buttons.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        buttons.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return buttons;
  };

  // Componente para paginación
  const Pagination = () => (
    <div style={{ margin: "2rem 0", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      <button
        onClick={() => currentPage > 1 && handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        style={paginationButtonStyle(currentPage === 1)}
        aria-label={t("deviceConfig.previous_page") || t("deviceConfig.default_previous")}
      >
        «
      </button>

      {getPageButtons().map((btn, idx) =>
        btn === "..." ? (
          <span key={idx} style={{ padding: "8px 12px", color: "#ccc" }} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={idx}
            onClick={() => handlePageClick(btn)}
            style={paginationButtonStyle(false, btn === currentPage)}
            aria-current={btn === currentPage ? "page" : undefined}
            aria-label={t("deviceConfig.pagination_page", { page: btn })}
          >
            {btn}
          </button>
        )
      )}

      <button
        onClick={() => currentPage < totalPages && handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={paginationButtonStyle(currentPage === totalPages)}
        aria-label={t("deviceConfig.next_page") || t("deviceConfig.default_next")}
      >
        »
      </button>
    </div>
  );

  // Estilo para botones de paginación
  const paginationButtonStyle = (disabled, active = false) => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    backgroundColor: active ? "#0ea5e9" : disabled ? "#64748b" : "#334155",
    color: "white",
    fontWeight: active ? "bold" : "normal",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "transform 0.2s ease",
  });

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "2rem 1rem",
            fontFamily: theme.font.family,
            color: theme.colors.text,
            textAlign: "center",
          }}
          ref={topRef}
        >
          {/* Header con botón volver y título */}
          <div
            style={{
              width: "100%",
              maxWidth: 960,
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG(deviceId))}
              aria-label={t("deviceConfig.back_button_aria") || t("deviceConfig.default_back_label")}
              style={{
                position: "absolute",
                left: 0,
                backgroundColor: "#334155",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "6px 14px",
                fontSize: "1.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
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

            <h1 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0 }}>
              {t(TYPE_LABELS[type]) || t("deviceConfig.details")} {t("deviceConfig.of")} {deviceInfo?.alias ?? t("deviceConfig.default_alias")}
            </h1>
          </div>

          {/* Mostrar paginación arriba si hay más de una página */}
          {totalPages > 1 && <Pagination />}

          {/* Listado de configuraciones paginadas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: "100%",
              maxWidth: 960,
            }}
          >
            {paginatedConfigs.map((conf, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#334155",
                  color: "white",
                  borderRadius: 16,
                  padding: "1.5rem 2rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.01)";
                  e.currentTarget.style.boxShadow = theme.shadow.medium;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ margin: "4px 0" }}>
                    <strong>{t("deviceConfig.vendor")}:</strong> {conf.vendor}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>{t("deviceConfig.product")}:</strong> {conf.product}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>{t("deviceConfig.version")}:</strong> {conf.version}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  {conf.cves?.length > 0 ? (
                    <p
                      onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG_CVES(deviceId, conf.id))}
                      style={{
                        margin: 0,
                        fontWeight: "bold",
                        textDecoration: "underline",
                        cursor: "pointer",
                        color: "#38bdf8",
                      }}
                    >
                      {Number(conf.cves.length).toLocaleString("es-ES")} {t("deviceConfig.cves_found")}
                    </p>
                  ) : (
                    <p style={{ margin: 0 }}>
                      0 {t("deviceConfig.cves_found")}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                    {t("deviceConfig.last_analysis")}:{" "}
                    {conf.last_analysis
                      ? new Date(conf.last_analysis).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }).replace(",", " a las")
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mostrar paginación abajo si hay más de una página */}
          {totalPages > 1 && <Pagination />}
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
