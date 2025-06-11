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
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [selected, setSelected] = useState([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1998 }, (_, i) => 1999 + i);

  const fetchVulnerabilities = async () => {
    const normalizedSeverity = severity?.toUpperCase();
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    let allResults = [];

    const yearRange =
      startYear && endYear
        ? years.filter((y) => y >= parseInt(startYear) && y <= parseInt(endYear))
        : [""];

    for (const year of yearRange) {
      let url = `${baseURL}/devices/${deviceId}/vulnerabilities`;
      const queryParams = [];

      if (normalizedSeverity && normalizedSeverity !== "ALL") {
        queryParams.push(`severity=${normalizedSeverity}`);
      }
      if (year) {
        queryParams.push(`year=${year}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      try {
        const res = await axios.get(url, { withCredentials: true });
        const data = Array.isArray(res.data) ? res.data : [];
        allResults = [...allResults, ...data];
      } catch (err) {
        console.error(`❌ Error año ${year}:`, err);
      }
    }

    // Eliminar duplicados por cve_id
    const unique = {};
    for (const v of allResults) {
      unique[v.cve_id] = v;
    }

    setVulns(Object.values(unique));
    setSelected([]);
  };

  useEffect(() => {
    fetchVulnerabilities();
  }, [deviceId, severity, startYear, endYear]);

  const toggleSelection = (cve_id) => {
    setSelected((prev) =>
      prev.includes(cve_id)
        ? prev.filter((id) => id !== cve_id)
        : [...prev, cve_id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === vulns.length) {
      setSelected([]);
    } else {
      setSelected(vulns.map((v) => v.cve_id));
    }
  };

  const markAsSolved = () => {
    if (selected.length === 0) return;

    axios
      .post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/devices/${deviceId}/vulnerabilities/mark-solved`,
        { cve_ids: selected },
        { withCredentials: true }
      )
      .then(() => {
        fetchVulnerabilities();
      })
      .catch((err) => {
        console.error("❌ Error marcando como solucionadas:", err);
      });
  };

  return (
    <MainLayout>
      <PageWrapper title={`Vulnerabilidades: ${severity}`}>
        <div style={{ padding: "1rem 2rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <label>Filtrar por años:</label>
          <select value={startYear} onChange={(e) => setStartYear(e.target.value)}>
            <option value="">Desde</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span>→</span>
          <select value={endYear} onChange={(e) => setEndYear(e.target.value)}>
            <option value="">Hasta</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={markAsSolved}
            disabled={selected.length === 0}
            style={{
              padding: "6px 12px",
              backgroundColor: selected.length > 0 ? "#1e88e5" : "#999",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: selected.length > 0 ? "pointer" : "not-allowed"
            }}
          >
            Marcar como solucionadas
          </button>
        </div>

        <ul style={{ padding: "2rem", listStyle: "none" }}>
          {vulns.length > 0 && (
            <li style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="checkbox"
                checked={selected.length === vulns.length}
                onChange={toggleSelectAll}
              />
              <strong>Seleccionar/Deseleccionar todo</strong>
            </li>
          )}

          {vulns.map((v) => (
            <li key={v.cve_id} style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="checkbox"
                checked={selected.includes(v.cve_id)}
                onChange={() => toggleSelection(v.cve_id)}
              />
              <div>
                <Link
                  to={APP_ROUTES.VULNERABILITY_DETAILS(v.cve_id)}
                  style={{ fontWeight: 600, color: "#1e88e5" }}
                >
                  {v.cve_id}
                </Link>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  {v.description || "Sin descripción"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </PageWrapper>
    </MainLayout>
  );
}
