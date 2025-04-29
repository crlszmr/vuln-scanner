// src/components/ui/Button.jsx
import { theme } from '@/styles/theme';
import { motion } from 'framer-motion';

export function Button({ children, onClick, variant = 'primary', disabled = false, fullWidth = false }) {
  const getBackground = () => {
    if (disabled) return '#374151'; // gris oscuro neutro
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: getBackground(),
        color: '#ffffff',
        border: 'none',
        borderRadius: theme.radius.md,
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: 600,
        width: fullWidth ? '100%' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: theme.transition.base,
        opacity: disabled ? 0.6 : 1,
        boxShadow: theme.shadow.soft,
      }}
    >
      {children}
    </motion.button>
  );
}
