export const APP_ROUTES = {
  // -----------------------------
  // Autenticación
  // -----------------------------
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  // -----------------------------
  // Navegación general
  // -----------------------------
  HOME: '/',
  NOT_AUTHORIZED: '/not-authorized',

  // -----------------------------
  // Dashboards
  // -----------------------------
  ADMIN_DASHBOARD: '/admin/dashboard',
  USER_DASHBOARD: '/dashboard',

  // -----------------------------
  // Dispositivos: subida y gestión
  // -----------------------------
  DEVICE_UPLOAD: '/devices/upload',
  DEVICE_LIST: '/devices/list',

  DEVICE_CONFIG: (deviceId) => `/devices/${deviceId}/config`,
  DEVICE_CONFIG_BY_TYPE: (deviceId, type) => `/devices/${deviceId}/config/${type}`,
  DEVICE_CONFIG_CVES: (deviceId, configId) => `/devices/${deviceId}/config/${configId}/vulnerabilities`,

  ALL_CONFIGS: (deviceId) => `/devices/${deviceId}/configs`, // Todas las configuraciones de un dispositivo

  // -----------------------------
  // Matching (correlación con CPEs)
  // -----------------------------
  DEVICE_MATCHING: (deviceId) => `/devices/${deviceId}/matching`,

  // -----------------------------
  // Vulnerabilidades por dispositivo
  // -----------------------------
  DEVICE_VULNERABILITIES: (deviceId) => `/devices/${deviceId}/vulnerabilities`,
  DEVICE_VULNERABILITIES_BY_SEVERITY: (deviceId, severity) =>
    `/devices/${deviceId}/vulnerabilities/${severity.toLowerCase()}`,
  DEVICE_VULNERABILITIES_OVERVIEW: (deviceId) =>
    `/devices/${deviceId}/vulnerabilities/overview`,

  // -----------------------------
  // Detalles individuales
  // -----------------------------
  VULNERABILITY_DETAILS: (cveId) => `/vulnerabilities/${cveId}`,
  WEAKNESS_DETAILS: (cweId) => `/weaknesses/${cweId}`,

  // -----------------------------
  // Gestión administrativa de CVE, CPE y CWE
  // -----------------------------
  CVE_MANAGEMENT: '/cves',
  CPE_MANAGEMENT: '/cpes',
  CWE_MANAGEMENT: '/cwes',

  // -----------------------------
  // Detector de configuración (descarga)
  // -----------------------------
  DETECTOR: '/detector',
  DETECTOR_DOWNLOAD: '/ConfigDetector.exe',

  // -----------------------------
  // Página por defecto (listado de vulnerabilidades)
  // -----------------------------
  VULNERABILITY_LIST: '/vulnerabilities/list',
};
