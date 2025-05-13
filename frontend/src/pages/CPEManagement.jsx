import { useState } from "react";
import { startCPEImportFromXML } from "@/api/cpes";
import { useNotification } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import { theme } from "@/styles/theme";

export default function CPEManagement() {
    const [status, setStatus] = useState("idle");
    const [imported, setImported] = useState(0);
    const [loading, setLoading] = useState(false);

    const { addNotification } = useNotification();

    const handleStartImport = async () => {
        setStatus("running");
        setLoading(true);

        addNotification("🚀 Importación de CPEs desde XML iniciada", "info");

        try {
            const data = await startCPEImportFromXML();
            setImported(data.imported);
            setStatus("finished");

            addNotification(`✅ Importación completada. ${data.imported} CPEs importados.`, "success");
        } catch (error) {
            setStatus("error");
            addNotification("❌ Error al importar CPEs desde XML", "error");
        } finally {
            setLoading(false);
        }
    };

    const renderStartButtonContent = () => {
        if (loading) {
            return (
                <>
                    <span style={{ marginRight: "8px" }}>⏳</span> Importando...
                </>
            );
        }
        return "Importar CPEs desde XML";
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
                        Gestión de CPEs
                    </h1>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px' }}>
                        <Button 
                            onClick={handleStartImport} 
                            fullWidth 
                            disabled={loading || status === "running"}
                        >
                            {renderStartButtonContent()}
                        </Button>
                    </div>

                    {status === "running" && (
                        <div style={{ marginTop: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>Importando CPEs...</h2>
                            <div style={{ width: '100%', backgroundColor: '#334155', borderRadius: '8px', overflow: 'hidden', height: '24px' }}>
                                <div style={{ width: '100%', backgroundColor: '#22c55e', height: '24px', animation: 'pulse 2s infinite' }}></div>
                            </div>
                            <p style={{ marginTop: '0.75rem', color: '#94a3b8' }}>Procesando XML y añadiendo CPEs...</p>
                        </div>
                    )}

                    {status === "finished" && (
                        <div style={{ marginTop: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px', color: '#22c55e' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>✅ Importación completada</h2>
                            <p style={{ fontSize: '18px' }}>Se han importado {imported} CPEs con éxito.</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div style={{ marginTop: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px', color: '#ef4444' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>❌ Error en la importación</h2>
                            <p>Ha ocurrido un error al importar CPEs desde XML.</p>
                        </div>
                    )}
                </div>
            </PageWrapper>
        </MainLayout>
    );
}
