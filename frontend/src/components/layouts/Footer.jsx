import React from 'react';
import { theme } from '@/styles/theme';

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: theme.colors.surface,
        color: theme.colors.textSecondary,
        padding: '24px',
        textAlign: 'center',
        fontSize: '14px',
        fontFamily: theme.font.family,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <p>© {new Date().getFullYear()} VulnScanner. All rights reserved.</p>
      <p style={{ marginTop: '4px' }}>Designed for Security Professionals</p>
    </footer>
  );
};

export default Footer;
