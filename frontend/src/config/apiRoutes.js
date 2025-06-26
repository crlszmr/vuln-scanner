const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  VULNERABILITIES: {
    LIST: `${API_BASE_URL}/vulnerabilities/list`,
    DETAIL: (cveId) => `${API_BASE_URL}/vulnerabilities/${cveId}`,  // ✅ Añadido
    STATS: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/vulnerability-stats`,
  },
  NVD: {
    IMPORT_VULNERABILITIES: `${API_BASE_URL}/nvd/cve-import-all`,
    IMPORT_VULNERABILITIES_FROM_JSON: `${API_BASE_URL}/nvd/cve-import-all-from-json`, // ← clave actualizada
    IMPORT_PLATFORMS: `${API_BASE_URL}/nvd/cpe-import-all`,
    IMPORT_WEAKNESSES: `${API_BASE_URL}/nvd/cwe-import-all`,
    CPE_IMPORT_CANCEL: `${API_BASE_URL}/nvd/cpe-import-cancel`,
    CPE_DELETE_ALL: `${API_BASE_URL}/nvd/cpe-delete-all`,
    CPE_LIST: `${API_BASE_URL}/nvd/cpe-list`,
  },
  DEVICES: {
    UPLOAD: `${API_BASE_URL}/devices/`,
    MY_DEVICES: `${API_BASE_URL}/devices/me`,
    DEVICE_CONFIG: (id) => `${API_BASE_URL}/devices/${id}/config`,
    DEVICE_MATCHES: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/matches`,
    MATCH_REFRESH: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/match-platforms/refresh`,
    MATCH_PROGRESS: (id) => `${API_BASE_URL}/devices/${id}/match-platforms/progress`,
    MATCH_STATUS: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/match-status`, // ✅
    MATCH_START: (id) => `${API_BASE_URL}/devices/${id}/match-start`,               // ✅
    GET_LAST_MATCHING: (id) => `${API_BASE_URL}/devices/${id}/last-matching`,      // ✅
    GET_CONFIG: (id) => `${API_BASE_URL}/devices/${id}/config`,                    // ✅
    DEVICE_CONFIG_BY_TYPE: (id, type) => `${API_BASE_URL}/devices/${id}/config/${type}`,
    GET_ENRICHED_CONFIG: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/config/with-cves`,
    MATCH_DELETE: (deviceId) => `${API_BASE_URL}/devices/${deviceId}/match-platforms`,
  },
};
