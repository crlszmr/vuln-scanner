import React from 'react';
import { useTranslation } from 'react-i18next';
import { theme } from '@/styles/theme';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer style={footerStyle}>
      <p>© {new Date().getFullYear()} VulnScanner. {t('footer.rights')}</p>
      <p style={subtitleStyle}>{t('footer.tagline')}</p>
    </footer>
  );
};

// Estilos aplicados al pie de página
const footerStyle = {
  backgroundColor: theme.colors.surface,
  color: theme.colors.textSecondary,
  padding: '24px',
  textAlign: 'center',
  fontSize: '14px',
  fontFamily: theme.font.family,
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
};

// Estilo para el subtítulo debajo del copyright
const subtitleStyle = {
  marginTop: '4px',
};

export default Footer;
