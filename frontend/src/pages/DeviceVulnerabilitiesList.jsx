import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";

export default function DeviceVulnerabilitiesList() {
  const { deviceId, configId, severity } = useParams();
  const navigate = useNavigate();
  const [vulns, setVulns] = useState([]);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deviceAlias, setDeviceAlias] = useState("");
  const [configDetails, setConfigDetails] = useState(null);
  const pageSize = 100;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1998 }, (_, i) => 1999 + i);

  const fetchVulnerabilities = async () => {
    const normalizedSeverity = severity?.toUpperCase();
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    let allResults = [];
    let yearRange = [];

    if (startYear && endYear) {
      yearRange = years.filter((y) => y >= parseInt(startYear) && y <= parseInt(endYear));
    } else if (startYear) {
      yearRange = years.filter((y) => y >= parseInt(startYear));
    } else if (endYear) {
      yearRange = years.filter((y) => y <= parseInt(endYear));
    } else {
      yearRange = [null];
    }

    for (const year of yearRange) {
      let url = configId
        ? `${baseURL}/devices/${deviceId}/config/${configId}/vulnerabilities`
        : `${baseURL}/devices/${deviceId}/vulnerabilities`;

      const queryParams = [];
      if (normalizedSeverity && normalizedSeverity !== "ALL") queryParams.push(`severity=${normalizedSeverity}`);
      if (year !== null) queryParams.push(`year=${year}`);
      if (queryParams.length > 0) url += `?${queryParams.join("&")}`;

      try {
        const res = await axios.get(url, { withCredentials: true });
        const data = Array.isArray(res.data) ? res.data : [];
        allResults = [...allResults, ...data];
      } catch (err) {
        console.error(`❌ Error año ${year}:`, err);
      }
    }

    const unique = {};
    for (const v of allResults) unique[v.cve_id] = v;
    setVulns(Object.values(unique));
    setCurrentPage(1);
    setSelected([]);
  };

  const fetchDeviceAlias = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/devices/${deviceId}/config`, { withCredentials: true });
      setDeviceAlias(res.data.alias || "");
    } catch (err) {
      console.error("❌ Error obteniendo alias del dispositivo:", err);
    }
  };

  const fetchConfigDetails = async () => {
    if (!configId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/devices/${deviceId}/configs`, { withCredentials: true });
      const match = res.data.find(c => String(c.id) === String(configId));
      if (match) setConfigDetails(match);
    } catch (err) {
      console.error("❌ Error obteniendo configuración:", err);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
    fetchDeviceAlias();
    fetchConfigDetails();
  }, [deviceId, configId, severity, startYear, endYear]);

  const getTitle = () => {
    if (configId && configDetails) {
      return (
        <span>
          Vulnerabilidades que afectan a <b>{configDetails.vendor}</b> - <b>{configDetails.product}</b> - <b>{configDetails.version}</b> en equipo <b>{deviceAlias}</b>
        </span>
      );
    } else if (severity && deviceAlias) {
      return (
        <span>
          Vulnerabilidades con criticidad <b>{severity.toUpperCase()}</b> que afectan a <b>{deviceAlias}</b>
        </span>
      );
    }
    return "Vulnerabilidades";
  };

  const toggleSelection = (cve_id) => {
    setSelected((prev) =>
      prev.includes(cve_id)
        ? prev.filter((id) => id !== cve_id)
        : [...prev, cve_id]
    );
  };

  const markAsSolved = () => {
    if (selected.length === 0) return;

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const endpoint = configId
      ? `${baseURL}/devices/${deviceId}/config/${configId}/vulnerabilities/mark-solved`
      : `${baseURL}/devices/${deviceId}/vulnerabilities/mark-solved`;

    axios
      .post(endpoint, { cve_ids: selected }, { withCredentials: true })
      .then(() => fetchVulnerabilities())
      .catch((err) => console.error("❌ Error marcando como solucionadas:", err));
  };

  const totalPages = Math.ceil(vulns.length / pageSize);
  const paginatedVulns = vulns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageClick = (page) => setCurrentPage(page);

  const getPageButtons = () => {
    const buttons = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      if (currentPage <= 3) buttons.push(1, 2, 3, 4, "...", totalPages);
      else if (currentPage >= totalPages - 2) buttons.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else buttons.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return buttons;
  };

  const Pagination = () => (
    <div style={{ margin: "2rem 0", display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1} style={paginationButtonStyle(currentPage === 1)}>«</button>
      {getPageButtons().map((btn, idx) =>
        btn === "..." ? (
          <span key={idx} style={{ padding: "8px 12px", color: "#ccc" }}>…</span>
        ) : (
          <button key={idx} onClick={() => handlePageClick(btn)} style={paginationButtonStyle(false, btn === currentPage)}>{btn}</button>
        )
      )}
      <button onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} style={paginationButtonStyle(currentPage === totalPages)}>»</button>
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem 2rem 0.5rem",
            flexWrap: "wrap"
          }}
        >
          <button
            onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG(deviceId))}
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

          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", textAlign: "center", flex: 1, margin: 0 }}>
            {getTitle()}
          </h1>

          <div style={{ width: "52px" }}></div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center", padding: "1rem 2rem" }}>
          <label>Filtrar por años:</label>
          <select value={startYear} onChange={(e) => setStartYear(e.target.value)}>
            <option value="">Desde</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span>→</span>
          <select value={endYear} onChange={(e) => setEndYear(e.target.value)}>
            <option value="">Hasta</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
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

        {totalPages > 1 && <Pagination />}

        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", padding: "2rem", listStyle: "none" }}>
          {paginatedVulns.map((v) => (
            <li key={v.cve_id} style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.xl, padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", transition: theme.transition.base, boxShadow: theme.shadow.soft }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = theme.shadow.medium} onMouseLeave={(e) => e.currentTarget.style.boxShadow = theme.shadow.soft}>
              <input type="checkbox" checked={selected.includes(v.cve_id)} onChange={() => toggleSelection(v.cve_id)} />
              <Link to={APP_ROUTES.VULNERABILITY_DETAILS(v.cve_id)} style={{ fontWeight: 600, fontSize: "16px", color: "#1e88e5", textDecoration: "none" }}>{v.cve_id}</Link>
            </li>
          ))}
        </ul>

        {totalPages > 1 && <Pagination />}
      </PageWrapper>
    </MainLayout>
  );
}
