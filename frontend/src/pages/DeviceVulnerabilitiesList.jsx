import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import { APP_ROUTES } from "@/config/appRoutes";

export default function DeviceVulnerabilitiesList() {
  const { deviceId, severity } = useParams();
  const [vulns, setVulns] = useState([]);

  useEffect(() => {
    const normalizedSeverity = severity?.toUpperCase();
    const url = normalizedSeverity && normalizedSeverity !== "ALL"
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/devices/${deviceId}/vulnerabilities?severity=${normalizedSeverity}`
      : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/devices/${deviceId}/vulnerabilities`;

    console.log("🧪 Params:", { deviceId, severity });
    console.log("🧪 URL construida:", url);

    axios
      .get(url, { withCredentials: true })
      .then((res) => {
        console.log("✅ Response:", res.data);
        setVulns(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("❌ Axios error:", err));
  }, [deviceId, severity]);

  return (
    <MainLayout>
      <PageWrapper title={`Vulnerabilidades: ${severity}`}>
        <ul style={{ padding: "2rem", listStyle: "none" }}>
          {vulns.map((v) => (
            <li key={v.cve_id} style={{ marginBottom: "1rem" }}>
              <Link
                to={APP_ROUTES.VULNERABILITY_DETAILS(v.cve_id)}
                style={{ fontWeight: 600, color: "#1e88e5" }}
              >
                {v.cve_id}
              </Link>
              <div style={{ fontSize: "14px", color: "#ccc" }}>
                {v.description || "Sin descripción"}
              </div>
            </li>
          ))}
        </ul>
      </PageWrapper>
    </MainLayout>
  );
}
