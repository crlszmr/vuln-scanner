import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "es" ? "en" : "es";
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      style={{
        position: "absolute",
        top: "16px",
        right: "24px",
        background: "transparent",
        border: "1px solid #64748b",
        color: "#cbd5e1",
        padding: "6px 12px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.875rem",
      }}
      aria-label={t("language_switcher.aria_label")}
      title={t("language_switcher.tooltip")}
    >
      {i18n.language === "es" ? "EN" : "ES"}
    </button>
  );
}
