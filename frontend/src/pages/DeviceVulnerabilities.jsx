import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import RiskCard from "@/components/RiskCard";
import { API_ROUTES } from "@/config/apiRoutes";

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE", "ALL"];

export default function DeviceVulnerabilities() {
  const { deviceId } = useParams();
  const [stats, setStats] = useState({});

  useEffect(() => {
    axios
      .get(API_ROUTES.VULNERABILITIES.STATS(deviceId), { withCredentials: true })
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error loading stats:", err));
  }, [deviceId]);

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            padding: "2rem",
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
      </PageWrapper>
    </MainLayout>
  );
}
