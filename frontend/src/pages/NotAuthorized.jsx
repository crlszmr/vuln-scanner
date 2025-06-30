import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { theme } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

const NotAuthorized = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            minHeight: 'calc(100vh - 160px)', // altura consistente con otras pantallas
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
          {/* Título principal con estilo de error */}
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: theme.colors.error, // color de error del tema
            }}
          >
            {t('notAuthorized.title')}
          </h1>

          {/* Mensaje informativo */}
          <p style={{ fontSize: '18px', color: theme.colors.textSecondary }}>
            {t('notAuthorized.message')}
          </p>
        </div>
      </PageWrapper>
    </MainLayout>
  );
};

export default NotAuthorized;
