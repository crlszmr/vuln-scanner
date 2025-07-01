import { theme } from '@/styles/theme';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

// Componente de layout principal que envuelve todas las páginas
export function MainLayout({ children }) {
  return (
    <div style={layoutStyle}>
      {/* Selector de idioma flotante */}
      <LanguageSwitcher />

      {/* Contenido principal de la página */}
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}

// Estilo general del layout (fondo, texto, fuente, altura completa)
const layoutStyle = {
  minHeight: '100vh',
  backgroundColor: theme.colors.background,
  color: theme.colors.text,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: theme.font.family,
  transition: theme.transition.base,
  position: 'relative',
};

// Estilo para el contenedor principal del contenido de cada página
const mainStyle = {
  flex: 1,
  padding: '32px 24px',
  maxWidth: '1200px',
  margin: '0 auto',
  width: '100%',
};
