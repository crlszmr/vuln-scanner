const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  VULNERABILITIES: {
    LIST: `${API_BASE_URL}/vulnerabilities/list`,
  },
  NVD: {
    IMPORT_VULNERABILITIES: `${API_BASE_URL}/nvd/cve-import-all`,
    IMPORT_PLATFORMS: `${API_BASE_URL}/nvd/cpe-import-all`,
    IMPORT_WEAKNESSES: `${API_BASE_URL}/nvd/cwe-import-all`,
    CPE_IMPORT_STATUS: `${API_BASE_URL}/nvd/cpe-import-status`,
    CPE_IMPORT_CANCEL: `${API_BASE_URL}/nvd/cpe-import-cancel`,
    CPE_DELETE_ALL: `${API_BASE_URL}/nvd/cpe-delete-all`,
    CPE_LIST: `${API_BASE_URL}/nvd/cpe-list`,
  },
  DEVICES: {
    UPLOAD: `${API_BASE_URL}/devices/`,
  },
};
