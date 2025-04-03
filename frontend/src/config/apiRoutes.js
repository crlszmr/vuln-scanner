const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  VULNERABILITIES: {
    LIST: `${API_BASE_URL}/vulnerabilities/list`,
  },
};
