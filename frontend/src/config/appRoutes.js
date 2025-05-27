export const APP_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VULNERABILITY_LIST: '/vulnerabilities/list',
  ADMIN_DASHBOARD: '/admin/dashboard',
  NOT_AUTHORIZED: '/not-authorized',
  DEVICE_UPLOAD: '/devices/upload',

  // 📍 NUEVAS rutas para usuarios
  USER_DASHBOARD: '/dashboard',
  DEVICE_LIST: '/devices/list',
  DEVICE_CONFIG: (id) => `/devices/${id}/config`,
};
