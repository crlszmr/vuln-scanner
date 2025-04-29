import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/styles/theme';

export function Toast({ message, type = 'success', isVisible }) {
  const getBackground = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.accent;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: getBackground(),
            color: '#fff',
            padding: '14px 24px',
            borderRadius: theme.radius.md,
            boxShadow: theme.shadow.soft,
            fontSize: '16px',
            zIndex: 1200,
            fontFamily: theme.font.family,
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
