import { useState } from "react";
import { useNotification } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import { theme } from "@/styles/theme";

export default function CVEManagement() {
    const [status, setStatus] = useState("idle");
    const [imported, setImported] = useState(0);
    const [total, setTotal] = useState(0);
    const [label, setLabel] = useState("Procesando...");
    const [loading, setLoading] = useState(false);

    const { addNotification } = useNotification();

    const handleImportFromSSE = (url, labelText) => {
        setStatus("running");
        setImported(0);
        setTotal(0);
        setLabel(labelText);
        setLoading(true);
        addNotification(`🚀 Iniciando importación desde ${labelText}`, "info");

        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                console.log("🟡 Event recibido crudo:", event.data);
                console.log("🔍 Tipo:", typeof event.data);

                // Elimina "data: " si está presente
                const cleanData = event.data.startsWith("data: ")
                    ? event.data.slice(6)
                    : event.data;

                const data = JSON.parse(cleanData);

                if (data.type === "start") {
                    setTotal(data.total || data.files || 0);
                    setLabel("Importando...");
                } else if (data.type === "progress") {
                    setImported(data.imported);
                    setTotal(data.total || total);
                    setLabel(data.file ? `Archivo: ${data.file}` : "Importando...");
                } else if (data.type === "done") {
                    setImported(data.imported);
                    setStatus("finished");
                    setLoading(false);
                    setLabel("Completado.");
                    eventSource.close();
                    addNotification(`✅ ${data.imported} elementos importados correctamente.`, "success");
                } else if (data.type === "error") {
                    throw new Error(data.message || "Error inesperado");
                }
            } catch (err) {
                setStatus("error");
                setLoading(false);
                setLabel("Error al procesar datos");
                eventSource.close();
                addNotification("❌ Error en la importación: " + err.message, "error");
            }
        };

        eventSource.onerror = () => {
            setStatus("error");
            setLoading(false);
            setLabel("Error de conexión");
            eventSource.close();
            addNotification("❌ Error de conexión con el servidor", "error");
        };
    };

    return (
        <MainLayout>
            <PageWrapper>
                <div
                    style={{
                        minHeight: 'calc(100vh - 160px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        fontFamily: theme.font.family,
                        color: theme.colors.text,
                    }}
                >
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
                        Gestión de CVEs
                    </h1>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px' }}>
                        <Button
                            onClick={() => handleImportFromSSE("http://localhost:8000/nvd/cve-import-stream", "la NVD API")}
                            fullWidth
                            disabled={loading || status === "running"}
                        >
                            Importar CVEs desde NVD API
                        </Button>

                        <Button
                            onClick={() => handleImportFromSSE("http://localhost:8000/nvd/cve-import-from-json-stream", "archivos JSON locales")}
                            fullWidth
                            disabled={loading || status === "running"}
                            variant="secondary"
                        >
                            Importar CVEs desde JSON local
                        </Button>
                    </div>

                    {status === "running" && (
                        <div style={{ marginTop: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>
                                {imported} de {total || "?"} elementos importados
                            </h2>
                            <div style={{ width: '100%', backgroundColor: '#334155', borderRadius: '8px', overflow: 'hidden', height: '24px' }}>
                                <div
                                    style={{
                                        width: total > 0 ? `${(imported / total) * 100}%` : '0%',
                                        backgroundColor: '#22c55e',
                                        height: '24px',
                                        transition: 'width 0.3s ease'
                                    }}
                                ></div>
                            </div>
                            <p style={{ marginTop: '0.75rem', color: '#94a3b8' }}>{label}</p>
                        </div>
                    )}

                    {status === "finished" && (
                        <div style={{ marginTop: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px', color: '#22c55e' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>✅ Importación completada</h2>
                            <p style={{ fontSize: '18px' }}>{imported} elementos importados con éxito.</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div style={{ marginTop: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px', color: '#ef4444' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>❌ Error en la importación</h2>
                            <p>Ha ocurrido un error durante la importación.</p>
                        </div>
                    )}
                </div>
            </PageWrapper>
        </MainLayout>
    );
}
