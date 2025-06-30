import { motion } from 'framer-motion';
import { theme } from '@/styles/theme';

//Componente visual que muestra un spinner animado.
export function Loader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <motion.div
        // Rotación infinita para simular carga
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 1,
        }}
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTop: `4px solid ${theme.colors.primary}`,
          borderRadius: '50%',
        }}
      />
    </div>
  );
}
