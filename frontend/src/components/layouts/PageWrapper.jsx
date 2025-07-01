import { motion } from 'framer-motion';

// Componente que aplica animaciones de entrada/salida a las páginas
export function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}     // Al entrar: aparece desde abajo con opacidad 0
      animate={{ opacity: 1, y: 0 }}      // Una vez montado: opacidad total y posición normal
      exit={{ opacity: 0, y: -30 }}       // Al salir: se eleva y desvanece
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
