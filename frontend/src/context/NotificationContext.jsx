import { createContext, useContext, useState, useCallback } from "react";

// Creamos el contexto de notificaciones
const NotificationContext = createContext();

// Proveedor del contexto que gestiona las notificaciones globales
function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Elimina una notificación del array por su ID
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /**
   * Añade una notificación al sistema
   * @param {string} message - Texto a mostrar
   * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
   * @param {number} duration - Duración en milisegundos antes de eliminarla (0 = persistente)
   * @param {string|null} customId - ID opcional para evitar duplicados
   */
  const addNotification = useCallback((message, type = "info", duration = 6000, customId = null) => {
    const id = customId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Evita duplicados exactos y añade la nueva notificación
    setNotifications((prev) => {
      const filtered = prev.filter(
        (n) => n.id !== id && (n.message !== message || n.type !== type)
      );
      return [...filtered, { id, message, type }];
    });

    // Elimina automáticamente la notificación tras el tiempo definido
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
  }, []);

  // Proporcionamos las notificaciones y funciones a los hijos
  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook para consumir el contexto desde cualquier componente
function useNotification() {
  return useContext(NotificationContext);
}

export { NotificationProvider, useNotification };
