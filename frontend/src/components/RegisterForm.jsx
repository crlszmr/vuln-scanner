import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_ROUTES } from "@/config/apiRoutes";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import { useNotification } from "@/context/NotificationContext";
import { theme } from "@/styles/theme";

function RegisterForm() {
  // Estados locales para los campos del formulario
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Validación de entradas antes de enviar el formulario
  const validateInputs = () => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordValid = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password),
    };

    const usernameErrors = [];
    const emailErrors = [];
    const passwordErrors = [];

    // Validaciones individuales
    if (!username.trim()) {
      usernameErrors.push(t("messages.username_required"));
    } else if (!usernameRegex.test(username)) {
      usernameErrors.push(t("messages.username_invalid"));
    }

    if (!email.trim()) {
      emailErrors.push(t("messages.email_required"));
    } else if (!emailRegex.test(email)) {
      emailErrors.push(t("messages.email_invalid"));
    }

    if (!password) {
      passwordErrors.push(t("messages.password_required"));
    } else {
      const failed = Object.entries(passwordValid).filter(([_, valid]) => !valid);
      if (failed.length > 0) {
        passwordErrors.push(
          `${t("messages.password_invalid")}\n- ${t("messages.password_rules_list", { returnObjects: true }).join("\n- ")}`
        );
      }
    }

    if (!confirm || password !== confirm) {
      passwordErrors.push(t("messages.password_mismatch"));
    }

    // Mostrar errores si los hay
    if (usernameErrors.length > 0) addNotification(usernameErrors.join("\n"), "error");
    if (emailErrors.length > 0) addNotification(emailErrors.join("\n"), "error");
    if (passwordErrors.length > 0) addNotification(passwordErrors.join("\n"), "error");

    return usernameErrors.length === 0 && emailErrors.length === 0 && passwordErrors.length === 0;
  };

  // Manejo del envío del formulario
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const response = await fetch(API_ROUTES.AUTH.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const detail = data?.detail;

        // Mapeo de errores del backend al sistema de notificaciones
        if (typeof detail === "string") {
          const cleanKey = detail.toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, "");
          addNotification(t(`messages.${cleanKey}`) || detail, "error");
        } else if (Array.isArray(detail)) {
          detail.forEach((d) => {
            addNotification(t(`messages.${d.msg || d}`) || d.msg || d, "error");
          });
        } else if (typeof detail === "object") {
          Object.entries(detail).forEach(([field, msgs]) => {
            const text = Array.isArray(msgs) ? msgs.join(", ") : msgs;
            addNotification(`${field}: ${t(`messages.${text}`) || text}`, "error");
          });
        } else {
          addNotification(t("messages.error_generic"), "error");
        }

        return;
      }

      // Éxito: notificación + limpieza de formulario + redirección al login
      addNotification(t("messages.user_created"), "success");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirm("");

      setTimeout(() => navigate("/auth/login"), 800);
    } catch (err) {
      console.error("Registration error:", err);
      addNotification(t("messages.error_generic"), "error");
    }
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "48px",
            paddingBottom: "32px",
            textAlign: "center",
          }}
        >
          {/* Título */}
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: theme.colors.text,
              marginBottom: "0.5rem",
            }}
          >
            {t("register.title")}
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginBottom: "2.5rem",
              maxWidth: "600px",
            }}
          >
            {t("register.subtitle")}
          </p>

          {/* Tarjeta del formulario */}
          <div
            style={{
              maxWidth: "700px",
              width: "100%",
              padding: "4rem 8rem",
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadow.soft,
              fontFamily: theme.font.family,
            }}
          >
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                placeholder={t("register.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder={t("register.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder={t("register.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder={t("register.confirm_password")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
              />
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
                <Button type="submit" variant="success" style={{ width: "240px" }}>
                  {t("register.button")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}

// Estilos comunes para inputs del formulario
const inputStyle = {
  padding: "12px",
  borderRadius: theme.radius.md,
  border: "1px solid #334155",
  backgroundColor: "#0f172a",
  color: theme.colors.text,
  width: "100%",
  fontSize: "16px",
};

export default RegisterForm;
