import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const addNotification = useCallback((message, type = "info", duration = 6000, customId = null) => {
        const id = customId || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        setNotifications((prev) => {
            const filtered = prev.filter((n) => n.id !== id && (n.message !== message || n.type !== type));
            return [...filtered, { id, message, type }];
        });

        if (duration > 0) {
            setTimeout(() => removeNotification(id), duration);
        }
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

function useNotification() {
    return useContext(NotificationContext);
}

export { NotificationProvider, useNotification };
