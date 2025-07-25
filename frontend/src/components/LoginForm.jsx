import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import { API_ROUTES } from "@/config/apiRoutes";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";

export default function LoginForm() {
  const { login, user } = useAuth();
  const { addNotification } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirección automática si ya hay sesión iniciada
  useEffect(() => {
    if (user?.role === "admin") navigate(APP_ROUTES.ADMIN_DASHBOARD);
    else if (user?.role === "user") navigate(APP_ROUTES.USER_DASHBOARD);
  }, [user, navigate]);

  // Validación de campos antes de enviar
  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = [];

    if (!email.trim()) errors.push(t("messages.email_required"));
    else if (!emailRegex.test(email)) errors.push(t("messages.email_invalid"));
    else if (email.length > 254) errors.push(t("messages.email_too_long"));

    if (!password.trim()) errors.push(t("messages.password_required"));
    else if (password.length > 128) errors.push(t("messages.password_too_long"));

    if (errors.length > 0) {
      errors.forEach((msg) => addNotification(msg, "error"));
      return false;
    }

    return true;
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      const res = await axios.post(API_ROUTES.AUTH.LOGIN, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true,
      });

      const { access_token, role, email: userEmail, username } = res.data;
      login({ token: access_token, role, email: userEmail, username });
      addNotification(t("messages.login_success"), "success");

      if (role === "admin") navigate(APP_ROUTES.ADMIN_DASHBOARD);
      else if (role === "user") navigate(APP_ROUTES.USER_DASHBOARD);
      else addNotification(t("messages.role_unknown"), "warning");

    } catch (err) {
      if (err.response) {
        if ([400, 401].includes(err.response.status)) {
          addNotification(t("messages.login_failed"), "error");
        } else {
          addNotification(t("messages.error_generic"), "error");
        }
      } else {
        addNotification(t("messages.connection_error"), "error");
      }
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
          {/* Título y subtítulo */}
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: theme.colors.text, marginBottom: "0.5rem" }}>
            {t("login.title")}
          </h1>
          <p style={{
            fontSize: "1.125rem",
            color: theme.colors.textSecondary,
            marginBottom: "2.5rem",
            maxWidth: "600px",
          }}>
            {t("login.subtitle")}
          </p>

          {/* Formulario de login */}
          <div
            style={{
              maxWidth: "700px",
              width: "100%",
              padding: "4rem 8rem 2rem",
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadow.soft,
              fontFamily: theme.font.family,
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                placeholder={t("login.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder={t("login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
                <Button type="submit" style={{ width: "240px" }}>
                  {t("login.button")}
                </Button>
              </div>

              {/* Enlace a registro */}
              <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.95rem", color: "#94a3b8" }}>
                {t("login.no_account")}{" "}
                <a
                  href={APP_ROUTES.REGISTER}
                  style={{
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    textDecoration: "underline",
                  }}
                >
                  {t("login.create_here")}
                </a>
              </p>
            </form>
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}

// Estilo común para los inputs
const inputStyle = {
  padding: "12px",
  borderRadius: theme.radius.md,
  border: "1px solid #334155",
  backgroundColor: "#0f172a",
  color: theme.colors.text,
  width: "100%",
  fontSize: "16px",
};
