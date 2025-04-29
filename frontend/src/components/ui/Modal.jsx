import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/styles/theme';

export function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscuro translúcido */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: '#000',
              zIndex: 1000,
            }}
            onClick={onClose}
          />

          {/* Caja modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              padding: '32px',
              borderRadius: theme.radius.lg,
              boxShadow: theme.shadow.soft,
              zIndex: 1100,
              minWidth: '300px',
              maxWidth: '90vw',
              fontFamily: theme.font.family,
              transition: theme.transition.base,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
