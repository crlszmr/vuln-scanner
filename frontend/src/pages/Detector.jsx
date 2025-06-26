import React from "react";
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
            paddingTop: "24px",
            paddingBottom: "32px",
            textAlign: "center",
            fontFamily: theme.font.family,
          }}
        >
          {/* Encabezado con botón y título */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "960px"            }}
          >
            <button
              onClick={() => navigate(APP_ROUTES.USER_DASHBOARD)}
              style={{
                backgroundColor: "#334155",
                color: "white",
                border: "none",
                borderRadius: "12px",
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
              <h1 style={{ fontSize: "3rem", fontWeight: "700", color: theme.colors.text, margin: 0 }}>
                {t("detector.title")}
              </h1>
            </div>

            <div style={{ width: "52px" }}></div>
          </div>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              maxWidth: "640px",
              marginTop: "0.5rem",
              marginBottom: "5rem",
            }}
          >
            {t("detector.subtitle")}
          </p>

          {/* Botón de descarga */}
          <a
            href="/ConfigDetector.exe"
            download
            style={{
              marginBottom: "3rem",
              fontSize: "1.25rem",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "16px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
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
            <DownloadCloud size={24} />
            {t("detector.download_button")}
          </a>

          {/* Instrucciones */}
          <div
            style={{
              marginTop: "3rem",
              maxWidth: "900px",
              width: "100%",
              padding: "2rem 2.5rem",
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadow.soft,
              fontFamily: theme.font.family,
              color: theme.colors.text,
              textAlign: "left",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "1rem" }}>{t("detector.instructions_title")}</p>
            <ol style={{ paddingLeft: "1.5rem", marginBottom: 0 }}>
              <li>{t("detector.step1")}</li>
              <li>{t("detector.step2")}</li>
              <li>
                {t("detector.step3_prefix")}
                <a href="/devices/list" style={{ color: "#3b82f6", textDecoration: "underline" }}>
                  {t("detector.step3_link")}
                </a>
              </li>
            </ol>
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
};

export default Detector;
