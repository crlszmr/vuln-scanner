import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { APP_ROUTES } from '@/config/appRoutes';
import { theme } from '@/styles/theme';
import { Button } from '@/components/ui/Button';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: theme.font.family,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', color: theme.colors.primary, textDecoration: 'none' }}>
        VulnScanner
      </Link>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {!user ? (
          <>
            <Link to={APP_ROUTES.LOGIN} style={{ color: theme.colors.text, textDecoration: 'none' }}>
              Login
            </Link>
            <Link to={APP_ROUTES.REGISTER} style={{ color: theme.colors.text, textDecoration: 'none' }}>
              Register
            </Link>
          </>
        ) : (
          <>
            {user.role === 'admin' && (
              <Link to={APP_ROUTES.ADMIN_DASHBOARD} style={{ color: theme.colors.text, textDecoration: 'none' }}>
                Admin Panel
              </Link>
            )}
            {user.role === 'user' && (
              <>
                <Link to="/devices/upload" style={{ color: theme.colors.text, textDecoration: 'none' }}>
                  Subir equipo
                </Link>
                <Link to="/devices/list" style={{ color: theme.colors.text, textDecoration: 'none' }}>
                  Mis equipos
                </Link>
              </>
            )}

            <Button onClick={logout}>
              Logout
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
