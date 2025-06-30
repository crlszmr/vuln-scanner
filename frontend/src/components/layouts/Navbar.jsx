import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { APP_ROUTES } from "@/config/appRoutes";
import { theme } from "@/styles/theme";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  MonitorSmartphone,
  Settings2,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  ServerCog,
  Bug,
} from "lucide-react";

const Navbar = () => {
  const { user, isLoading, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/");
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const adminMenu = [
    {
      label: t("navbar.admin_panel"),
      action: () => navigate(APP_ROUTES.ADMIN_DASHBOARD),
      icon: <LayoutDashboard size={16} color="#94a3b8" />,
    },
    {
      label: t("navbar.vulnerabilities_management"),
      action: () => navigate("/cves"),
      icon: <ShieldAlert size={16} color="#94a3b8" />,
    },
    {
      label: t("navbar.platforms_management"),
      action: () => navigate("/cpes"),
      icon: <ServerCog size={16} color="#94a3b8" />,
    },
    {
      label: t("navbar.cwes_management"),
      action: () => navigate("/cwes"),
      icon: <Bug size={16} color="#94a3b8" />,
    },
  ];

  const userMenu = [
    {
      label: t("navbar.dashboard"),
      action: () => navigate(APP_ROUTES.USER_DASHBOARD),
      icon: <LayoutDashboard size={16} color="#94a3b8" />,
    },
    {
      label: t("navbar.my_devices"),
      action: () => navigate(APP_ROUTES.DEVICE_LIST),
      icon: <MonitorSmartphone size={16} color="#94a3b8" />,
    },
    {
      label: t("navbar.config_detector"),
      action: () => navigate(APP_ROUTES.DETECTOR),
      icon: <Settings2 size={16} color="#94a3b8" />,
    },
  ];

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

      <div style={{ display: "flex", gap: "20px", alignItems: "center", position: "relative" }}>
        {!isLoading && !user && (
          <>
            <Link to={APP_ROUTES.LOGIN} style={{ textDecoration: "none" }}>
              <Button variant="primary">{t("navbar.login")}</Button>
            </Link>
            <Link to={APP_ROUTES.REGISTER} style={{ textDecoration: "none" }}>
              <Button variant="success">{t("navbar.register")}</Button>
            </Link>
          </>
        )}

        {!isLoading && user && (
          <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
            <Button variant="primary" onClick={() => setMenuOpen(!menuOpen)}>
              {user.username ?? user.email ?? "Usuario"} ▾
            </Button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "-4px",
                  marginTop: "25px",
                  backgroundColor: "#334155",
                  backdropFilter: "blur(8px)",
                  borderRadius: theme.radius.xl,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  fontFamily: theme.font.family,
                  overflow: "hidden",
                  minWidth: "380px",
                  padding: "8px 0",
                  zIndex: 999,
                }}
              >
                {(user.role === "admin" ? adminMenu : userMenu).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      item.action();
                      setMenuOpen(false);
                    }}
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      color: theme.colors.text,
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#475569")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {item.icon && (
                      <span style={{ verticalAlign: "middle", display: "flex", alignItems: "center" }}>
                        {item.icon}
                      </span>
                    )}
                    <span style={{ lineHeight: 1 }}>{item.label}</span>
                  </div>
                ))}

                <div
                  onClick={handleLogout}
                  style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderTop: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(to right, #f87171, #ef4444)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut size={18} color={"#94a3b8"} style={{ flexShrink: 0 }} />
                  <span>{t("navbar.logout")}</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
