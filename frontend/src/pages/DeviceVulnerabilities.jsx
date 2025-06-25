import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import RiskCard from "@/components/RiskCard";
import { API_ROUTES } from "@/config/apiRoutes";
import { theme } from "@/styles/theme";

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE", "ALL"];

export default function DeviceVulnerabilities() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [alias, setAlias] = useState("...");

  useEffect(() => {
    axios
      .get(API_ROUTES.VULNERABILITIES.STATS(deviceId), { withCredentials: true })
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error loading stats:", err));

    axios
      .get(API_ROUTES.DEVICES.GET_CONFIG(deviceId), { withCredentials: true })
      .then((res) => {
        if (res.data?.alias) setAlias(res.data.alias);
      })
      .catch((err) => console.error("Error loading alias:", err));
  }, [deviceId]);

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
          {/* Header con botón y título */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "1090px",
            }}
          >
            <button
              onClick={() => navigate(-1)}
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
              <h1 style={{ fontSize: "2.5rem", fontWeight: "700", margin: 0 }}>
                Vulnerabilidades de {alias} por criticidad
              </h1>
            </div>

            <div style={{ width: "52px" }}></div>
          </div>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginTop: "1rem",
              marginBottom: "5rem",
              textAlign: "center",
            }}
          >
            Explora las vulnerabilidades de tu equipo clasificadas por criticidad.
          </p>

          {/* Tarjetas de criticidad */}
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              padding: "0 1rem 2rem",
              maxWidth: "1200px",
            }}
          >
            {SEVERITY_ORDER.map((level) => (
              <RiskCard
                key={level}
                level={level}
                count={stats[level] || 0}
                deviceId={deviceId}
              />
            ))}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
