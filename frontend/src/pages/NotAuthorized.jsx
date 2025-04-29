import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { theme } from '@/styles/theme';

const NotAuthorized = () => {
  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: 'calc(100vh - 160px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            fontFamily: theme.font.family,
            color: theme.colors.text,
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: theme.colors.error, // Rojo de error configurado en el theme
            }}
          >
            No Autorizado
          </h1>
          <p style={{ fontSize: '18px', color: theme.colors.textSecondary }}>
            No tienes permisos para acceder a esta página.
          </p>
        </div>
      </PageWrapper>
    </MainLayout>
  );
};

export default NotAuthorized;
