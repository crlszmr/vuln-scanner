import { useState } from "react";
import { API_ROUTES } from '@/config/apiRoutes';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageWrapper } from '@/components/layouts/PageWrapper';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/theme';

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("❌ Las contraseñas no coinciden.");
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

      setMessage("✅ Registro exitoso.");
      setError("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "❌ Error desconocido.");
      setMessage("");
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
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Nombre de usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  padding: '12px',
                  borderRadius: theme.radius.md,
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: theme.colors.text,
                  width: '100%',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '12px',
                  borderRadius: theme.radius.md,
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: theme.colors.text,
                  width: '100%',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  padding: '12px',
                  borderRadius: theme.radius.md,
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: theme.colors.text,
                  width: '100%',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={{
                  padding: '12px',
                  borderRadius: theme.radius.md,
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: theme.colors.text,
                  width: '100%',
                  fontSize: '16px',
                }}
              />
            </div>

            {error && (
              <p
                style={{
                  backgroundColor: theme.colors.error,
                  color: '#fff',
                  padding: '10px',
                  borderRadius: theme.radius.md,
                  textAlign: 'center',
                  fontWeight: '500',
                }}
              >
                {error}
              </p>
            )}

            {message && (
              <p
                style={{
                  backgroundColor: theme.colors.success,
                  color: '#fff',
                  padding: '10px',
                  borderRadius: theme.radius.md,
                  textAlign: 'center',
                  fontWeight: '500',
                }}
              >
                {message}
              </p>
            )}

            <Button type="submit" variant="success" fullWidth>
              Crear cuenta
            </Button>
          </form>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}

export default RegisterForm;
