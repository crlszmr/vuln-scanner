import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/styles/theme';

// Componente Modal reutilizable. Muestra una ventana emergente con fondo oscuro y animación de entrada/salida.
export function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          // Fondo oscuro translúcido
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClose}
        >
          <motion.div
            // Animación del modal al entrar/salir
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              padding: '32px',
              borderRadius: theme.radius.lg,
              boxShadow: theme.shadow.soft,
              zIndex: 1100,
              fontFamily: theme.font.family,
              width: '100%',
              maxWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()} // Evita cierre al hacer click dentro
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
