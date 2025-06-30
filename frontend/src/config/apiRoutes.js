// URL base de la API (puede ser cambiada por variable de entorno)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ROUTES = {
  // -----------------------------
  // Autenticación
  // -----------------------------
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    SESSION: `${API_BASE_URL}/auth/session`,
  },

  // -----------------------------
  // Vulnerabilidades (CVE)
  // -----------------------------
  VULNERABILITIES: {
    LIST: `${API_BASE_URL}/vulnerabilities/list`,
    DETAIL: (cveId) => `${API_BASE_URL}/vulnerabilities/${cveId}`,
    CPES: (cveId) => `${API_BASE_URL}/vulnerabilities/${cveId}/cpes`,
    STATS: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/vulnerability-stats`,
    BY_DEVICE: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/vulnerabilities`,
    BY_CONFIG: (deviceId, configId) =>
      `${API_BASE_URL}/devices/${deviceId}/config/${configId}/vulnerabilities`,
    MARK_SOLVED_BY_DEVICE: (deviceId) =>
      `${API_BASE_URL}/devices/${deviceId}/vulnerabilities/mark-solved`,
    MARK_SOLVED_BY_CONFIG: (deviceId, configId) =>
      `${API_BASE_URL}/devices/${deviceId}/config/${configId}/vulnerabilities/mark-solved`,
  },

  // -----------------------------
  // Dispositivos (hardware/software)
  // -----------------------------
  DEVICES: {
    UPLOAD: `${API_BASE_URL}/devices/`,
    MY_DEVICES: `${API_BASE_URL}/devices/me`,
    DEVICE_CONFIG: (id) => `${API_BASE_URL}/devices/${id}/config`,
    DEVICE_CONFIG_BY_TYPE: (id, type) => `${API_BASE_URL}/devices/${id}/config/${type}`,
    ALL_CONFIGS: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/configs`,
    GET_ENRICHED_CONFIG: (deviceId) =>
      `${API_BASE_URL}/devices/${deviceId}/config/with-cves`,

    DELETE_DEVICE: (id) => `${API_BASE_URL}/devices/${id}`,

    // Matching
    DEVICE_MATCHES: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/matches`,
    MATCH_REFRESH: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/match-platforms/refresh`,
    MATCH_PROGRESS: (id) => `${API_BASE_URL}/devices/${id}/match-platforms/progress`,
    MATCH_STATUS: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/match-status`,
    MATCH_START: (id) => `${API_BASE_URL}/devices/${id}/match-start`,
    GET_LAST_MATCHING: (id) => `${API_BASE_URL}/devices/${id}/last-matching`,
    MATCH_DELETE: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/match-platforms`,
  },

  // -----------------------------
  // Gestión de CVEs, CPEs y CWEs (NVD)
  // -----------------------------
  NVD: {
    // CVE
    IMPORT_VULNERABILITIES: `${API_BASE_URL}/nvd/cve-import-all`,
    IMPORT_VULNERABILITIES_FROM_JSON: `${API_BASE_URL}/nvd/cve-import-all-from-json`,
    CVE_IMPORT_START: `${API_BASE_URL}/nvd/cve-import-start`,
    CVE_IMPORT_STREAM: `${API_BASE_URL}/nvd/cve-import-stream`,
    CVE_IMPORT_STATUS: `${API_BASE_URL}/nvd/cve-import-status`,
    CVE_IMPORT_STOP: `${API_BASE_URL}/nvd/cve-import-stop`,
    CVE_COUNT: `${API_BASE_URL}/nvd/cve-count`,
    CVE_DELETE_ALL: `${API_BASE_URL}/nvd/cve-delete-all`,

    // CPE
    IMPORT_PLATFORMS: `${API_BASE_URL}/nvd/cpe-import-all`,
    CPE_IMPORT_FROM_XML: `${API_BASE_URL}/nvd/cpe-import-all-from-xml`,
    CPE_IMPORT_START: `${API_BASE_URL}/nvd/cpe-import-start`,
    CPE_IMPORT_STREAM: `${API_BASE_URL}/nvd/cpe-import-stream`,
    CPE_IMPORT_STATUS: `${API_BASE_URL}/nvd/cpe-import-status`,
    CPE_IMPORT_STOP: `${API_BASE_URL}/nvd/cpe-import-stop`,
    CPE_LIST: `${API_BASE_URL}/nvd/cpe-list`,
    CPE_DELETE_ALL: `${API_BASE_URL}/nvd/cpe-delete-all`,

    // CWE
    IMPORT_WEAKNESSES: `${API_BASE_URL}/nvd/cwe-import-all`,
    CWE_IMPORT_START: `${API_BASE_URL}/nvd/cwe-import-start`,
    CWE_IMPORT_STREAM: `${API_BASE_URL}/nvd/cwe-import-stream`,
    CWE_IMPORT_STOP: `${API_BASE_URL}/nvd/cwe-import-stop`,
    CWE_DELETE_ALL: `${API_BASE_URL}/nvd/cwe-delete-all`,
  },

  // -----------------------------
  // Debilidades (CWE)
  // -----------------------------
  WEAKNESSES: {
    DETAIL: (cweId) => `${API_BASE_URL}/weaknesses/${cweId}`,
  },
};
