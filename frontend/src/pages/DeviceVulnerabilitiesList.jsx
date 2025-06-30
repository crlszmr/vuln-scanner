import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { APP_ROUTES } from "@/config/appRoutes";
import { API_ROUTES } from "@/config/apiRoutes";
import { theme } from "@/styles/theme";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { useNotification } from "@/context/NotificationContext";

export default function DeviceVulnerabilitiesList() {
  const { deviceId, configId, severity } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notify } = useNotification(); 

  // Estados para vulnerabilidades, filtros, paginación y selección
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

  // Validación rango años
  const isInvalidRange = startYear && endYear && parseInt(startYear) > parseInt(endYear);

  // Función para cargar vulnerabilidades según filtros
  const fetchVulnerabilities = async () => {
    if (isInvalidRange) {
      setVulns([]);
      return;
    }

    const normalizedSeverity = severity?.toUpperCase();

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
        ? API_ROUTES.VULNERABILITIES.BY_CONFIG(deviceId, configId)
        : API_ROUTES.VULNERABILITIES.BY_DEVICE(deviceId);

      const queryParams = [];
      if (normalizedSeverity && normalizedSeverity !== "ALL") queryParams.push(`severity=${normalizedSeverity}`);
      if (year !== null) queryParams.push(`year=${year}`);
      if (queryParams.length > 0) url += `?${queryParams.join("&")}`;

      try {
        const res = await axios.get(url, { withCredentials: true });
        const data = Array.isArray(res.data) ? res.data : [];
        allResults = [...allResults, ...data];
      } catch (err) {
      }
    }

    // Eliminar duplicados por cve_id
    const unique = {};
    allResults.forEach((v) => {
      unique[v.cve_id] = v;
    });

    setVulns(Object.values(unique));
    setCurrentPage(1);
    setSelected([]);
  };

  // Obtener alias del dispositivo
  const fetchDeviceAlias = async () => {
    try {
      const res = await axios.get(API_ROUTES.DEVICES.GET_CONFIG(deviceId), { withCredentials: true });
      setDeviceAlias(res.data.alias || "");
    } catch (err) {
    }
  };

  // Obtener detalles de configuración (cuando aplica)
  const fetchConfigDetails = async () => {
    if (!configId) return;
    try {
      const res = await axios.get(API_ROUTES.DEVICES.GET_CONFIG(deviceId), { withCredentials: true });
      const match = res.data.find((c) => String(c.id) === String(configId));
      if (match) setConfigDetails(match);
    } catch (err) {
    }
  };

  // Recargar datos cuando cambian los filtros o IDs
  useEffect(() => {
    fetchVulnerabilities();
    fetchDeviceAlias();
    fetchConfigDetails();
  }, [deviceId, configId, severity, startYear, endYear]);

  // Generar título dinámico según filtros
  const getTitle = () => {
    if (configId && configDetails) {
      return t("deviceVulnerabilitiesList.title_with_config", {
        vendor: configDetails.vendor,
        product: configDetails.product,
        version: configDetails.version,
        alias: deviceAlias,
      });
    }
    if (severity && deviceAlias) {
      return t("deviceVulnerabilitiesList.title_with_severity", {
        severity: severity.toUpperCase(),
        alias: deviceAlias,
      });
    }
    return t("deviceVulnerabilitiesList.title_default");
  };

  // Maneja selección/deselección de CVEs
  const toggleSelection = (cve_id) => {
    setSelected((prev) =>
      prev.includes(cve_id) ? prev.filter((id) => id !== cve_id) : [...prev, cve_id]
    );
  };

  // Marca CVEs seleccionados como solucionados
  const markAsSolved = () => {
    if (selected.length === 0) return;
    const endpoint = configId
      ? API_ROUTES.VULNERABILITIES.MARK_SOLVED_BY_CONFIG(deviceId, configId)
      : API_ROUTES.VULNERABILITIES.MARK_SOLVED_BY_DEVICE(deviceId);


    axios
      .post(endpoint, { cve_ids: selected }, { withCredentials: true })
      .then(() => fetchVulnerabilities())
      .catch((err) => {
        notify("error", `${t("deviceVulnerabilities.errorFetchingBySeverity")}: ${err.message}`);
      });
  };

  // Paginación
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
      <button
        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        style={paginationButtonStyle(currentPage === 1)}
        aria-label={t("deviceVulnerabilitiesList.pagination_prev")}
      >
        «
      </button>

      {getPageButtons().map((btn, idx) =>
        btn === "..." ? (
          <span key={idx} style={{ padding: "8px 12px", color: "#ccc" }} aria-hidden="true">…</span>
        ) : (
          <button
            key={idx}
            onClick={() => handlePageClick(btn)}
            style={paginationButtonStyle(false, btn === currentPage)}
            aria-current={btn === currentPage ? "page" : undefined}
            aria-label={t("deviceVulnerabilitiesList.pagination_page", { page: btn })}
          >
            {btn}
          </button>
        )
      )}

      <button
        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={paginationButtonStyle(currentPage === totalPages)}
        aria-label={t("deviceVulnerabilitiesList.pagination_next")}
      >
        »
      </button>
    </div>
  );

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

  // Regresa a vista previa o anterior según contexto
  const handleBack = () => {
    if (severity) navigate(`/devices/${deviceId}/vulnerabilities/overview`);
    else navigate(-1);
  };

  return (
    <MainLayout>
      <PageWrapper>
        {/* Header con botón volver y título */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem 2rem 0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleBack}
            aria-label={t("deviceVulnerabilitiesList.back_button_aria")}
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

          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              textAlign: "center",
              flex: 1,
              margin: 0,
              marginBottom: "1rem",
            }}
          >
            {getTitle()}
          </h1>

          <div style={{ width: 52 }}></div>
        </div>

        {/* Filtros por año */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem 2rem 0",
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
          <span style={{ fontWeight: 600, color: theme.colors.text }}>
            {t("deviceVulnerabilitiesList.filter_by_years")}
          </span>

          <select
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            aria-label={t("deviceVulnerabilitiesList.start_year_aria")}
            style={{
              backgroundColor: "#1f2937",
              color: "white",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 14,
              appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="">{t("deviceVulnerabilitiesList.start_year_placeholder")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <span style={{ fontSize: "1.3rem", color: theme.colors.text }}>›</span>

          <select
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            aria-label={t("deviceVulnerabilitiesList.end_year_aria")}
            style={{
              backgroundColor: "#1f2937",
              color: "white",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 14,
              appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="">{t("deviceVulnerabilitiesList.end_year_placeholder")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Mensaje rango inválido */}
          {isInvalidRange && (
            <span style={{ color: theme.colors.error, fontSize: 14 }}>
              {t("deviceVulnerabilitiesList.invalid_range_msg")}
            </span>
          )}
        </div>

        {/* Paginación superior */}
        {totalPages > 1 && <Pagination />}

        {/* Selección y acción */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "4rem",
            marginBottom: "1rem",
            padding: "0 2rem",
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: theme.colors.text,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={selected.length === vulns.length && vulns.length > 0}
              onChange={(e) => setSelected(e.target.checked ? vulns.map((v) => v.cve_id) : [])}
              aria-label={t("deviceVulnerabilitiesList.select_all_aria")}
            />
            {t("deviceVulnerabilitiesList.select_all")}
          </label>

          <Button onClick={markAsSolved} disabled={selected.length === 0 || isInvalidRange}>
            {t("deviceVulnerabilitiesList.mark_solved_button")}
          </Button>
        </div>

        {/* Lista de vulnerabilidades */}
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
                height: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: theme.transition.base,
                boxShadow: theme.shadow.soft,
                cursor: "default",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = theme.shadow.medium)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = theme.shadow.soft)}
            >
              <input
                type="checkbox"
                checked={selected.includes(v.cve_id)}
                onChange={() => toggleSelection(v.cve_id)}
                aria-label={t("deviceVulnerabilitiesList.select_cve_aria", { cve_id: v.cve_id })}
              />
              <Link
                to={APP_ROUTES.VULNERABILITY_DETAILS(v.cve_id)}
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: "#1e88e5",
                  textDecoration: "none",
                }}
              >
                {v.cve_id}
              </Link>
            </li>
          ))}
        </ul>

        {/* Paginación inferior */}
        {totalPages > 1 && <Pagination />}
      </PageWrapper>
    </MainLayout>
  );
}
