import { theme } from '@/styles/theme';

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
      }}
    >
      {/* Solo el contenido */}
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
