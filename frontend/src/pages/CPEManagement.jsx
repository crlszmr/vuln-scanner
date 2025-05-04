import { useEffect, useState } from "react";
import { getCPEImportStatus, startCPEImport, cancelCPEImport, deleteAllCPEs, listCPEs } from "@/api/cpes";
import { useNotification } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { theme } from "@/styles/theme";

export default function CPEManagement() {
    const [status, setStatus] = useState("idle");
    const [imported, setImported] = useState(0);
    const [total, setTotal] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [cpeList, setCpeList] = useState([]);

    const { addNotification } = useNotification();

    useEffect(() => {
        const interval = setInterval(() => {
            getCPEImportStatus().then(data => {
                setStatus(data.status);
                setImported(data.imported);
                setTotal(data.total);
                setProgress(data.progress);
            }).catch(() => {});
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const handleStartImport = () => {
        startCPEImport();
        addNotification("🚀 Importación de CPEs iniciada", "info");
    };

    const handleCancelImport = () => {
        cancelCPEImport();
        addNotification("⛔ Importación cancelada", "info");
    };

    const handleDeleteAll = async (password) => {
        await deleteAllCPEs(password);
        setShowDeleteModal(false);
        addNotification("🗑️ Todos los CPEs fueron eliminados", "success");
    };

    const handleListCPEs = async () => {
        const data = await listCPEs();
        setCpeList(data);
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
                        <Button onClick={handleStartImport} fullWidth>
                            Iniciar Importación
                        </Button>

                        <Button variant="secondary" fullWidth>
                            Pausar
                        </Button>

                        <Button variant="danger" onClick={handleCancelImport} fullWidth>
                            Cancelar Importación
                        </Button>

                        <Button variant="danger" onClick={() => setShowDeleteModal(true)} fullWidth>
                            Eliminar Todos los CPEs
                        </Button>

                        <Button variant="secondary" onClick={handleListCPEs} fullWidth>
                            Listar Existentes
                        </Button>
                    </div>

                    {(status !== "idle" && status !== "finished") && (
                        <div style={{ marginTop: '3rem', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>Progreso de Importación</h2>
                            <div style={{ width: '100%', backgroundColor: '#334155', borderRadius: '8px', overflow: 'hidden', height: '24px' }}>
                                <div style={{ width: `${progress}%`, backgroundColor: '#3b82f6', height: '24px', transition: 'width 0.3s' }}></div>
                            </div>
                            <p style={{ marginTop: '0.75rem' }}>{imported} / {total || "?"} CPEs importados.</p>
                            <p style={{ color: '#94a3b8' }}>Estado: {status}</p>
                        </div>
                    )}

                    {cpeList.length > 0 && (
                        <div style={{ marginTop: '3rem', width: '100%', maxWidth: '700px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1rem' }}>CPEs Existentes</h2>
                            <pre style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
                                {JSON.stringify(cpeList, null, 2)}
                            </pre>
                        </div>
                    )}

                    <ConfirmModal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={handleDeleteAll}
                        title="Eliminar todos los CPEs"
                        description="Esta acción eliminará todos los CPEs. Ingresa tu contraseña para confirmar."
                    />
                </div>
            </PageWrapper>
        </MainLayout>
    );
}
