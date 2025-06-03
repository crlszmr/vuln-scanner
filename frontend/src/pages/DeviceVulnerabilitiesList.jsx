import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";

export default function DeviceVulnerabilitiesList() {
  const { deviceId, severity } = useParams();
  const [vulns, setVulns] = useState([]);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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
      yearRange = [""];
    }

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

    const unique = {};
    for (const v of allResults) {
      unique[v.cve_id] = v;
    }

    setVulns(Object.values(unique));
    setCurrentPage(1);
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
    const pageCves = paginatedVulns.map((v) => v.cve_id);
    const allSelected = pageCves.every((id) => selected.includes(id));
    setSelected((prev) =>
      allSelected
        ? prev.filter((id) => !pageCves.includes(id))
        : [...new Set([...prev, ...pageCves])]
    );
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

  const totalPages = Math.ceil(vulns.length / pageSize);
  const paginatedVulns = vulns.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, vulns.length);

  const renderPaginationControls = () => {
    const visiblePages = [];
    const range = 2;

    for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
      visiblePages.push(i);
    }

    return (
      <div style={{ textAlign: "center", padding: "1rem", flexWrap: "wrap" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          Mostrando {startItem}–{endItem} de {vulns.length} vulnerabilidades
        </div>

        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={{ marginRight: "0.5rem" }}
        >
          ◀
        </button>

        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            disabled={page === currentPage}
            style={{
              margin: "0 0.25rem",
              fontWeight: page === currentPage ? "bold" : "normal",
              backgroundColor: page === currentPage ? "#1e88e5" : "#eee",
              color: page === currentPage ? "#fff" : "#333",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "none",
              cursor: page === currentPage ? "default" : "pointer"
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={{ marginLeft: "0.5rem" }}
        >
          ▶
        </button>
      </div>
    );
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

        {totalPages > 1 && renderPaginationControls()}

        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            padding: "2rem",
            listStyle: "none",
          }}
        >
          {paginatedVulns.map((v) => (
            <li
              key={v.cve_id}
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.xl,
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                transition: theme.transition.base,
                boxShadow: theme.shadow.soft,
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = theme.shadow.medium}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = theme.shadow.soft}
            >
              <input
                type="checkbox"
                checked={selected.includes(v.cve_id)}
                onChange={() => toggleSelection(v.cve_id)}
              />
              <Link
                to={APP_ROUTES.VULNERABILITY_DETAILS(v.cve_id)}
                style={{
                  fontWeight: 600,
                  fontSize: "16px",
                  color: "#1e88e5",
                  textDecoration: "none"
                }}
              >
                {v.cve_id}
              </Link>
            </li>
          ))}
        </ul>

        {totalPages > 1 && renderPaginationControls()}
      </PageWrapper>
    </MainLayout>
  );
}
