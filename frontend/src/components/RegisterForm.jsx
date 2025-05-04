import { useState } from "react";
import { API_ROUTES } from '@/config/apiRoutes';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/theme';
import { useNotification } from '@/context/NotificationContext';

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { addNotification } = useNotification();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      addNotification("❌ Las contraseñas no coinciden.", "error");
      return;
    }

    try {
      const response = await fetch(API_ROUTES.AUTH.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "❌ Error al registrar. Inténtalo más tarde.");
      }

      addNotification("✅ Registro exitoso.", "success");

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      console.error("Registration error:", err);
      addNotification(err.message || "❌ Error desconocido.", "error");
    }
  };

  return (
    <MainLayout>
      <PageWrapper>
        <div
          style={{
            maxWidth: '450px',
            margin: '40px auto',
            padding: '2rem',
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            boxShadow: theme.shadow.soft,
            color: theme.colors.text,
            fontFamily: theme.font.family,
          }}
        >
          <h2 style={{ fontSize: '24px', textAlign: 'center', fontWeight: 600, marginBottom: '1rem' }}>
            Crear cuenta
          </h2>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
            <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />

            <Button type="submit" variant="success" fullWidth>
              Crear cuenta
            </Button>
          </form>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}

const inputStyle = {
  padding: '12px',
  borderRadius: theme.radius.md,
  border: '1px solid #334155',
  backgroundColor: '#0f172a',
  color: theme.colors.text,
  width: '100%',
  fontSize: '16px',
};

export default RegisterForm;
