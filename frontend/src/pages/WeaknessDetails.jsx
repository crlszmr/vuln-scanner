import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import { theme } from "@/styles/theme";

export default function WeaknessDetails() {
  const { cweId } = useParams();
  const navigate = useNavigate();
  const [weakness, setWeakness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(API_ROUTES.WEAKNESSES.DETAIL(cweId), { withCredentials: true })
      .then((res) => setWeakness(res.data))
      .catch((err) => console.error("Error loading Weakness detail:", err))
      .finally(() => setLoading(false));
  }, [cweId]);

  const sectionStyle = {
    backgroundColor: theme.colors.surface,
    border: "1px solid #334155",
    borderRadius: theme.radius.xl,
    padding: "1.5rem",
    boxShadow: theme.shadow.soft,
    marginBottom: "1.5rem",
  };

  const headingStyle = {
    fontSize: "20px",
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: "1rem",
  };

  const renderListSection = (title, list) => (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>{title}</h2>
      {list?.length ? (
        <ul style={{ fontSize: "14px", color: theme.colors.muted, paddingLeft: "1rem" }}>
          {list.map((item, i) => (
            <li key={i}>{Object.values(item).filter(Boolean).join(" - ") || "[Entrada vacía]"}</li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: "14px", color: theme.colors.muted }}>No disponible.</p>
      )}
    </section>
  );

  if (loading) {
    return (
      <MainLayout>
        <PageWrapper>
          <p style={{ color: theme.colors.muted }}>Cargando detalles de la debilidad...</p>
        </PageWrapper>
      </MainLayout>
    );
  }

  if (!weakness) {
    return (
      <MainLayout>
        <PageWrapper>
          <p style={{ color: theme.colors.error }}>No se encontró información para {cweId}</p>
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
              maxWidth: "960px",
            }}
          >
            <button
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: "#334155",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "6px 14px",
                fontSize: "1.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
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
              <h1 style={{ fontSize: "2.5rem", fontWeight: "700", margin: 0 }}>CWE-{id}</h1>
            </div>

            <div style={{ width: "52px" }}></div>
          </div>

          <p
            style={{
              fontSize: "1.125rem",
              color: theme.colors.textSecondary || "#94a3b8",
              marginTop: "1rem",
              marginBottom: "3rem",
              textAlign: "center",
              maxWidth: "960px",
            }}
          >
            {name}
          </p>

          <div style={{ width: "100%", maxWidth: "960px" }}>
            <section style={sectionStyle}>
              <h2 style={headingStyle}>Descripción</h2>
              <p style={{ fontSize: "14px", color: theme.colors.muted }}>{description || "No disponible."}</p>
            </section>

            <section style={sectionStyle}>
              <h2 style={headingStyle}>Descripción extendida</h2>
              <p style={{ fontSize: "14px", color: theme.colors.muted }}>{extended_description || "No disponible."}</p>
            </section>

            {renderListSection("Modos de introducción", modes_of_introduction)}
            {renderListSection("Plataformas aplicables", applicable_platforms)}
            {renderListSection("Términos alternativos", alternate_terms)}
            {renderListSection("Mitigaciones", potential_mitigations)}
            {renderListSection("Consecuencias", consequences)}
            {renderListSection("Ejemplos demostrativos", demonstrative_examples)}
            {renderListSection("Ejemplos observados", observed_examples)}
            {renderListSection("Mapeos de taxonomía", taxonomy_mappings)}
            {renderListSection("Relaciones", relationships)}

            {background_details && (
              <section style={sectionStyle}>
                <h2 style={headingStyle}>Detalles de fondo</h2>
                <p style={{ fontSize: "14px", color: theme.colors.muted }}>{background_details}</p>
              </section>
            )}
          </div>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
