import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, x: "-50vw" },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: "50vw" },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4,
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      
      await login({ email: form.email.trim(), password: form.password });

      
      const to = location.state?.from?.pathname || "/";
      navigate(to, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Credenciales incorrectas o error de conexión";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="login-hero"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="form-container">
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Iniciar Sesión</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Tu contraseña…"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="form-control"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-registro">
            {isSubmitting ? "Accediendo..." : "Acceder"}
          </button>
        </form>

        {error && (
          <p style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>{error}</p>
        )}

        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>
        </p>
      </div>
    </motion.div>
  );
}
