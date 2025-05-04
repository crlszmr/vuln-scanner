import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  description = "",
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
    setPassword("");
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? "visible" : "hidden",
          transition: "opacity 0.3s ease, visibility 0.3s ease",
        }}
      ></div>

      {/* Modal */}
      <MainLayout>
        <PageWrapper>
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: isOpen ? "translate(-50%, -50%)" : "translate(-50%, -40%)",
              opacity: isOpen ? 1 : 0,
              visibility: isOpen ? "visible" : "hidden",
              transition: "opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease",
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
              width: "100%",
              maxWidth: "400px",

              // 👇 SOLUCIÓN para evitar que colapse el tamaño al montar
              minHeight: "200px",
              minWidth: "300px",

              color: "#1e293b",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "1rem" }}>
              {title}
            </h2>

            <p style={{ marginBottom: "1.5rem", color: "#475569" }}>
              {description}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  fontSize: "16px",
                  color: "#334155",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <Button type="button" variant="secondary" onClick={onClose} fullWidth>
                  Cancelar
                </Button>

                <Button type="submit" variant="danger" fullWidth>
                  Confirmar
                </Button>
              </div>
            </form>
          </div>
        </PageWrapper>
      </MainLayout>
    </>
  );
}
