import { theme } from '@/styles/theme';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function MainLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: theme.font.family,
        transition: theme.transition.base,
        position: 'relative', // necesario para posicionar el botón
      }}
    >
      <LanguageSwitcher /> {/* 🔁 Botón de idioma */}
      
      <main
        style={{
          flex: 1,
          padding: '32px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  );
}
