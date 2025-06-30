import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { useNavigate } from "react-router-dom";
import { DownloadCloud } from "lucide-react";
import { theme } from "@/styles/theme";
import { APP_ROUTES } from "@/config/appRoutes";

const Detector = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 24,
            paddingBottom: 32,
            textAlign: "center",
            fontFamily: theme.font.family,
          }}
        >
          {/* Encabezado con botón para volver y título centrado */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: 960,
            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.USER_DASHBOARD)}
              aria-label={t("detector.back_button_aria") || "Volver"}
              style={{
                backgroundColor: "#334155",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "6px 14px",
                fontSize: "1.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = theme.shadow.medium;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              &lt;
            </button>

            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <h1 style={{ fontSize: "3rem", fontWeight: 700, color: theme.colors.text, margin: 0 }}>
                {t("detector.title")}
              </h1>
            </div>

            {/* Espacio para balancear layout */}
            <div style={{ width: 52 }}></div>
          </div>

          {/* Subtítulo descriptivo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              maxWidth: 640,
              marginTop: 8,
              marginBottom: 80,
            }}
          >
            {t("detector.subtitle")}
          </p>

          {/* Botón de descarga */}
          <a
            href={APP_ROUTES.DETECTOR_DOWNLOAD}
            download
            style={{
              marginBottom: 48,
              fontSize: "1.25rem",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "16px 32px",
              borderRadius: 12,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              boxShadow: theme.shadow.medium,
              transition: "all 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = theme.shadow.soft;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = theme.shadow.medium;
            }}
          >
            <DownloadCloud size={24} aria-hidden="true" />
            {t("detector.download_button")}
          </a>

          {/* Instrucciones para el usuario */}
          <section
            style={{
              marginTop: 48,
              maxWidth: 900,
              width: "100%",
              padding: "2rem 2.5rem",
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadow.soft,
              fontFamily: theme.font.family,
              color: theme.colors.text,
              textAlign: "left",
            }}
            aria-label={t("detector.instructions_title")}
          >
            <p style={{ fontWeight: 600, marginBottom: 16 }}>{t("detector.instructions_title")}</p>
            <ol style={{ paddingLeft: 24, marginBottom: 0 }}>
              <li>{t("detector.step1")}</li>
              <li>{t("detector.step2")}</li>
              <li>
                {t("detector.step3_prefix")}
                <a href={APP_ROUTES.DEVICE_LIST} style={{ color: "#3b82f6", textDecoration: "underline" }}>
                  {t("detector.step3_link")}
                </a>
              </li>
            </ol>
          </section>
        </div>
      </PageWrapper>
    </MainLayout>
  );
};

export default Detector;
