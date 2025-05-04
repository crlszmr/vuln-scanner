import { useEffect, useState } from "react";
import { getCPEImportStatus } from "@/api/cpes";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

function GlobalImportStatus() {
    const [progress, setProgress] = useState(null);
    const [status, setStatus] = useState("idle");
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            getCPEImportStatus()
                .then(data => {
                    setStatus(data.status);
                    setProgress(data);
                })
                .catch(() => {
                    setStatus("idle");
                    setProgress(null);
                });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    if (!progress || status === "idle" || status === "finished") return null;

    const statusColors = {
        running: "bg-blue-600",
        cancelled: "bg-red-600",
    };

    const statusColor = statusColors[status] || "bg-blue-600";

    return createPortal(
        <div
            className={`fixed bottom-4 right-4 ${statusColor} text-white px-6 py-4 rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-all z-50`}
            onClick={() => navigate("/cpes")}
        >
            <p className="font-semibold">Importación de CPE en curso...</p>
            <p className="text-sm">{progress.imported} / {progress.total || "?"} importados ({progress.progress}%)</p>
            <p className="text-xs italic">Haz clic para ver detalles</p>
        </div>,
        document.getElementById("global-status")
    );
}

export default GlobalImportStatus;
