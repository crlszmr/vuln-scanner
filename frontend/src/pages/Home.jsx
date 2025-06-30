import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Redirige según el estado y rol del usuario
  const handleGetStarted = () => {
    if (!user) {
      navigate(APP_ROUTES.LOGIN);
    } else if (user.role === "admin") {
      navigate(APP_ROUTES.ADMIN_DASHBOARD);
    } else if (user.role === "user") {
      navigate(APP_ROUTES.USER_DASHBOARD);
    } else {
      navigate(APP_ROUTES.LOGIN); // fallback por seguridad
    }
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "calc(100vh - 160px)", // consistente con otras pantallas
            padding: "2rem",
            transition: theme.transition.base,
          }}
        >
          {/* Título principal */}
          <h1
            style={{
              fontSize: 40,
              fontWeight: "bold",
              color: theme.colors.text,
              marginBottom: "1.5rem",
              fontFamily: theme.font.family,
            }}
          >
            {t("home.title")}
          </h1>

          {/* Descripción o subtítulo */}
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: 18,
              marginBottom: "2rem",
              maxWidth: 600,
              fontFamily: theme.font.family,
            }}
          >
            {t("home.description")}
          </p>

          {/* Botón principal para empezar */}
          <Button variant="primary" onClick={handleGetStarted}>
            {t("home.get_started")}
          </Button>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
