import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { theme } from "@/styles/theme";
import { API_ROUTES } from "../config/apiRoutes";
import { APP_ROUTES } from "../config/appRoutes";

const TYPE_LABELS = {
  os: "Sistema Operativo",
  hardware: "Hardware",
  software: "Software instalado",
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
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef(null); // Para hacer scroll arriba

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await axios.get(API_ROUTES.DEVICES.GET_CONFIG(deviceId), {
          withCredentials: true,
        });

        setDeviceInfo(res.data);
        const allConfigs = Array.isArray(res.data.config) ? res.data.config : [];
        const filtered = allConfigs
          .filter((c) => c.type === TYPE_INTERNAL[type])
          .sort((a, b) => {
            const vendorComparison = a.vendor.localeCompare(b.vendor, 'es', { sensitivity: 'base' });
            if (vendorComparison !== 0) return vendorComparison;
            return a.product.localeCompare(b.product, 'es', { sensitivity: 'base' });
          });
        setConfigs(filtered);
      } catch (error) {
        console.error("❌ Error al obtener configuraciones:", error);
      }
    };

    fetchConfigs();
  }, [deviceId, type]);


  const totalPages = Math.ceil(configs.length / PAGE_SIZE);
  const paginatedConfigs = configs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const getPageButtons = () => {
    const buttons = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
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

  const Pagination = () => (
    <div style={{ margin: "2rem 0", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      <button
        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        style={paginationButtonStyle(currentPage === 1)}
      >
        «
      </button>

      {getPageButtons().map((btn, idx) =>
        btn === "..." ? (
          <span key={idx} style={{ padding: "8px 12px", color: "#ccc" }}>…</span>
        ) : (
          <button
            key={idx}
            onClick={() => handlePageClick(btn)}
            style={paginationButtonStyle(false, btn === currentPage)}
          >
            {btn}
          </button>
        )
      )}

      <button
        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={paginationButtonStyle(currentPage === totalPages)}
      >
        »
      </button>
    </div>
  );

  const paginationButtonStyle = (disabled, active = false) => ({
    padding: "8px 14px",
    borderRadius: "8px",
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
        >
          {/* Encabezado */}
          <div
            ref={topRef}
            style={{
              width: "100%",
              maxWidth: "960px",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG(deviceId))}
              style={{
                position: "absolute",
                left: 0,
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

            <h1 style={{ fontSize: "2.5rem", fontWeight: "700", margin: 0 }}>
              {TYPE_LABELS[type] || "Detalles"} de {deviceInfo?.alias || "..."}
            </h1>
          </div>

          {totalPages > 1 && <Pagination />}

          {/* Tarjetas */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              width: "100%",
              maxWidth: "960px",
            }}
          >
            {paginatedConfigs.map((conf, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#334155",
                  color: "white",
                  borderRadius: "16px",
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
                  <p style={{ margin: "4px 0" }}><strong>Vendor:</strong> {conf.vendor}</p>
                  <p style={{ margin: "4px 0" }}><strong>Product:</strong> {conf.product}</p>
                  <p style={{ margin: "4px 0" }}><strong>Version:</strong> {conf.version}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0 }}>
                    <strong>{conf.cve_count || 0}</strong> CVEs encontrados
                  </p>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                    Último análisis: {conf.last_analysis ? new Date(conf.last_analysis).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && <Pagination />}
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
