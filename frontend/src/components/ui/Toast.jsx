import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export function Toast({ id, message, type = 'success' }) {
  const { removeNotification } = useNotification();

  const getBackground = () => {
    switch (type) {
      case 'success': return '#bbf7d0';
      case 'error': return '#fecaca';
      case 'warning': return '#fef08a';
      default: return '#bfdbfe';
    }
  };

  const getTextColor = () => '#1e293b';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'relative',
          backgroundColor: getBackground(),
          color: getTextColor(),
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontSize: '16px',
          zIndex: 1200,
          fontFamily: 'system-ui, sans-serif',
          minWidth: '260px',
          maxWidth: '400px',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => removeNotification(id)}
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: getTextColor(),
          }}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
        <div>{message}</div>
      </motion.div>
    </AnimatePresence>
  );
}
