import { warning } from "framer-motion";

// src/styles/theme.js
export const theme = {
  colors: {
    background: '#111827',     // gris oscuro profesional
    surface: '#1f2937',        // gris ligeramente más claro para cards
    text: '#f3f4f6',           // blanco suave
    textSecondary: '#9ca3af',  // gris claro
    primary: '#3b82f6',        // azul acción
    success: '#22c55e',        // verde éxito
    error: '#ef4444',          // rojo error
    accent: '#6366f1',         // azul violáceo para elementos especiales
    warning: '#e7971d',        // amarillo para advertencias
    darkGreen: '#006400',        // amarillo para advertencias
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  shadow: {
    soft: '0 2px 10px rgba(0,0,0,0.2)',
    inset: 'inset 0 1px 2px rgba(255,255,255,0.05)',
  },
  font: {
    family: `'Inter', 'Roboto', sans-serif`,
    code: `'Source Code Pro', monospace`
  },
  transition: {
    base: 'all 0.3s ease-out',
  }
};
