import { useNotification } from "@/context/NotificationContext";
import { Toast } from "./Toast";

// Contenedor de notificaciones. Muestra una lista de toasts activos en la esquina superior derecha.
export default function NotificationContainer() {
  const { notifications } = useNotification();

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1200 }}>
      {notifications.map((n) => (
        <div key={n.id} style={{ marginBottom: '12px' }}>
          <Toast id={n.id} message={n.message} type={n.type} />
        </div>
      ))}
    </div>
  );
}
