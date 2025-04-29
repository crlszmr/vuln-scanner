import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/config/appRoutes';
import { theme } from '@/styles/theme';

export default function Home() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: 'calc(100vh - 160px)',
            padding: '2rem',
            transition: theme.transition.base,
          }}
        >
          <h1
            style={{
              fontSize: '40px',
              fontWeight: 'bold',
              color: theme.colors.text,
              marginBottom: '1.5rem',
              fontFamily: theme.font.family,
            }}
          >
            Welcome to VulnScanner
          </h1>

          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: '18px',
              marginBottom: '2rem',
              maxWidth: '600px',
              fontFamily: theme.font.family,
            }}
          >
            Easily manage, import, and analyze software vulnerabilities. A professional platform for IT administrators and cybersecurity experts.
          </p>

          <Button variant="primary" onClick={() => navigate(APP_ROUTES.LOGIN)}>
            Get Started
          </Button>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
