import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav
      style={{
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: theme.font.family,
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Logo / nombre de la app */}
      <Link
        to="/"
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: theme.colors.primary,
          textDecoration: "none",
        }}
      >
        VulnScanner
      </Link>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {!user ? (
          <>
            <Link to={APP_ROUTES.LOGIN} style={{ color: theme.colors.text, textDecoration: "none" }}>
              {t("navbar.login")}
            </Link>
            <Link to={APP_ROUTES.REGISTER} style={{ color: theme.colors.text, textDecoration: "none" }}>
              {t("navbar.register")}
            </Link>
          </>
        ) : (
          <>
            {user.role === "admin" && (
              <Link to={APP_ROUTES.ADMIN_DASHBOARD} style={{ color: theme.colors.text, textDecoration: "none" }}>
                {t("navbar.admin_panel")}
              </Link>
            )}
            {user.role === "user" && (
              <Link to="/dashboard" style={{ color: theme.colors.text, textDecoration: "none" }}>
                {t("navbar.dashboard")}
              </Link>
            )}
            <Button
              onClick={() => {
                logout(); // elimina el token / usuario
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  window.location.href = "/"; // redirección suave a Home
                }, 200); // pequeño delay opcional
              }}
            >
              {t("navbar.logout")}
            </Button>

          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
