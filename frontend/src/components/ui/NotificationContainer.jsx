import { useNotification } from "@/context/NotificationContext";
import { CheckCircle, Info, XCircle } from "lucide-react";

export default function NotificationContainer() {
    const { notifications } = useNotification();

    const typeStyles = {
        success: {
            bg: "bg-green-600",
            icon: <CheckCircle className="w-5 h-5" />,
        },
        error: {
            bg: "bg-red-600",
            icon: <XCircle className="w-5 h-5" />,
        },
        info: {
            bg: "bg-blue-600",
            icon: <Info className="w-5 h-5" />,
        },
    };

    return (
        <div className="fixed top-4 right-4 space-y-2 z-50">
            {notifications.map((n) => {
                const { bg, icon } = typeStyles[n.type] || typeStyles.info;

                return (
                    <div
                        key={n.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded shadow text-white ${bg} animate-fade-in`}
                        style={{ minWidth: "250px", maxWidth: "350px" }}
                    >
                        <div>{icon}</div>
                        <div className="flex-1">{n.message}</div>
                    </div>
                );
            })}
        </div>
    );
}
