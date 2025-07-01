import { theme } from '@/styles/theme';
import { motion } from 'framer-motion';

// Componente de botón reutilizable con variantes visuales y efectos al pasar el ratón
export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  hoverEffect = 'scale',
  width,
}) {
  // Define el color de fondo según la variante
  const getBackground = () => {
    if (disabled) return '#374151';
    return theme.colors[variant] || theme.colors.primary;
  };

  // Define el estilo de hover en función del tipo de efecto
  const getHoverStyle = () => {
    if (disabled) return {};
    switch (hoverEffect) {
      case 'brightness':
        return { filter: 'brightness(1.18)' };
      case 'shadow':
        return { boxShadow: '0 0 8px rgba(255,255,255,0.2)' };
      case 'none':
        return {};
      default:
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
