import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import { theme } from "@/styles/theme";
import { useTranslation } from "react-i18next";

export default function WeaknessDetails() {
  const { cweId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [weakness, setWeakness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(API_ROUTES.WEAKNESSES.DETAIL(cweId), { withCredentials: true })
      .then((res) => setWeakness(res.data))
      .catch((err) => console.error(t("weaknessDetails.error_loading_weakness"), err))
      .finally(() => setLoading(false));
  }, [cweId, t]);

  const sectionStyle = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.xl,
    padding: "1.5rem",
    boxShadow: theme.shadow.soft,
    marginBottom: "1.5rem",
  };

  const headingStyle = {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: "1rem",
  };

  const renderListSection = (title, list) => (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>{title}</h2>
      {list?.length ? (
        <ul style={{ fontSize: 14, color: theme.colors.muted, paddingLeft: "1rem" }}>
          {list.map((item, i) => (
            <li key={i}>
              {Object.values(item).filter(Boolean).join(" - ") || t("weaknessDetails.empty_entry")}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: 14, color: theme.colors.muted }}>{t("weaknessDetails.not_available")}</p>
      )}
    </section>
  );

  if (loading) {
    return (
      <MainLayout>
        <PageWrapper>
          <p style={{ color: theme.colors.muted }}>{t("weaknessDetails.loading")}</p>
        </PageWrapper>
      </MainLayout>
    );
  }

  if (!weakness) {
    return (
      <MainLayout>
        <PageWrapper>
          <p style={{ color: theme.colors.error }}>
            {t("weaknessDetails.not_found", { cweId })}
          </p>
        </PageWrapper>
      </MainLayout>
    );
  }

  const {
    id,
    name,
    abstraction,
    structure,
    status,
    description,
    extended_description,
    modes_of_introduction,
    applicable_platforms,
    alternate_terms,
    potential_mitigations,
    consequences,
    demonstrative_examples,
    observed_examples,
    taxonomy_mappings,
    relationships,
    background_details,
  } = weakness;

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "2rem 1rem",
            fontFamily: theme.font.family,
            color: theme.colors.text,
          }}
        >
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
              onClick={() => navigate(-1)}
              aria-label={t("weaknessDetails.back_button_aria")}
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
              <h1 style={{ fontSize: 32, fontWeight: "700", margin: 0 }}>
                CWE-{id}
              </h1>
            </div>

            <div style={{ width: 52 }}></div>
          </div>

          <p
            style={{
              fontSize: 18,
              color: theme.colors.textSecondary || "#94a3b8",
              marginTop: "1rem",
              marginBottom: "3rem",
              textAlign: "center",
              maxWidth: 960,
            }}
          >
            {name}
          </p>

          <div style={{ width: "100%", maxWidth: 960 }}>
            <section style={sectionStyle}>
              <h2 style={headingStyle}>{t("weaknessDetails.description")}</h2>
              <p style={{ fontSize: 14, color: theme.colors.muted }}>{description || t("weaknessDetails.not_available")}</p>
            </section>

            <section style={sectionStyle}>
              <h2 style={headingStyle}>{t("weaknessDetails.extended_description")}</h2>
              <p style={{ fontSize: 14, color: theme.colors.muted }}>{extended_description || t("weaknessDetails.not_available")}</p>
            </section>

            {renderListSection(t("weaknessDetails.modes_of_introduction"), modes_of_introduction)}
            {renderListSection(t("weaknessDetails.applicable_platforms"), applicable_platforms)}
            {renderListSection(t("weaknessDetails.alternate_terms"), alternate_terms)}
            {renderListSection(t("weaknessDetails.potential_mitigations"), potential_mitigations)}
            {renderListSection(t("weaknessDetails.consequences"), consequences)}
            {renderListSection(t("weaknessDetails.demonstrative_examples"), demonstrative_examples)}
            {renderListSection(t("weaknessDetails.observed_examples"), observed_examples)}
            {renderListSection(t("weaknessDetails.taxonomy_mappings"), taxonomy_mappings)}
            {renderListSection(t("weaknessDetails.relationships"), relationships)}

            {background_details && (
              <section style={sectionStyle}>
                <h2 style={headingStyle}>{t("weaknessDetails.background_details")}</h2>
                <p style={{ fontSize: 14, color: theme.colors.muted }}>{background_details}</p>
              </section>
            )}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
