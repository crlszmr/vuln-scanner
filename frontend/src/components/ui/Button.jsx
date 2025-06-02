// src/components/ui/Button.jsx
import { theme } from '@/styles/theme';
import { motion } from 'framer-motion';

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  hoverEffect = 'scale',
  width, // NUEVA PROP
}) {
  const getBackground = () => {
    if (disabled) return '#374151';
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'text':
        return theme.colors.text;
      case 'textSecondary':
        return theme.colors.textSecondary;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'darkgreen':
        return theme.colors.darkGreen;
      default:
        return theme.colors.primary;
    }
  };

  const getHoverStyle = () => {
    if (disabled) return {};
    switch (hoverEffect) {
      case 'brightness':
        return { filter: 'brightness(1.18)' };
      case 'shadow':
        return { boxShadow: '0 0 8px rgba(255,255,255,0.2)' };
      case 'none':
        return {};
      default: // 'scale'
        return { scale: 1.03 };
    }
  };

  return (
    <motion.button
      whileHover={getHoverStyle()}
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
        width: width || (fullWidth ? '100%' : 'auto'),
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
