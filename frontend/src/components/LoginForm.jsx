import { API_ROUTES } from '@/config/apiRoutes';
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function LoginForm() {
  const { t } = useTranslation();
  const { login, token } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error(t("login.invalidCredentials"));
      }

      const data = await response.json();
      login(data.access_token);
      setError("");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || t("login.error"));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-md shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">{t("login.title")}</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">{t("login.email")}</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">{t("login.password")}</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {t("login.button")}
        </button>
      </form>

      {token && (
        <div className="mt-4 bg-green-100 p-3 rounded text-green-800 text-sm">
          ✅ {t("login.success")}
        </div>
      )}
    </div>
  );
}

export default LoginForm;
