import { useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { signup } from "../api/authApi";
import { REGIONES, COMUNAS_POR_REGION } from "../data/cl-geo";

const pageVariants = {
  initial: { opacity: 0, y: 20 }, // Un pequeño slide hacia arriba es más "Material"
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};
const pageTransition = { type: "tween", ease: "easeOut", duration: 0.3 };

const initialForm = {
  email: "",
  password: "",
  confirm: "",
  nombre: "",
  telefono: "",
  direccion: "",
  region: "",
  comuna: "",
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/login";

  const comunas = useMemo(
    () => (form.region ? COMUNAS_POR_REGION[form.region] || [] : []),
    [form.region]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) =>
      name === "region"
        ? { ...f, region: value, comuna: "" }
        : { ...f, [name]: value }
    );
  };

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const canSubmit =
    isEmail(form.email) &&
    form.password.length >= 6 &&
    form.password === form.confirm &&
    form.nombre.trim() &&
    form.direccion.trim() &&
    !!form.region &&
    !!form.comuna;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setErr("");
    setLoading(true);
    try {
      await signup({
        name: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/login", { replace: true, state: { from } });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo completar el registro.";
      setErr(msg);
    } finally {
      setLoading(false);
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
        <h2>Crea tu Cuenta</h2>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="nombre">Nombre y Apellido</label>
            <input
              className="form-control" /* CLASE IMPORTANTE AGREGADA */
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={form.nombre}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <input
              className="form-control"
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
            />
          </div>

          {/* GRID DE 2 COLUMNAS */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <input
                className="form-control"
                id="password"
                name="password"
                type="password"
                placeholder="Mín. 6 carac."
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm">Confirmar</label>
              <input
                className="form-control"
                id="confirm"
                name="confirm"
                type="password"
                placeholder="Repetir clave"
                value={form.confirm}
                onChange={onChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="direccion">Dirección</label>
            <input
              className="form-control"
              id="direccion"
              name="direccion"
              type="text"
              placeholder="Calle, número, depto"
              value={form.direccion}
              onChange={onChange}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="region">Región</label>
              <select
                className="form-control"
                id="region"
                name="region"
                value={form.region}
                onChange={onChange}
                required
              >
                <option value="">Elegir...</option>
                {REGIONES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="comuna">Comuna</label>
              <select
                className="form-control"
                id="comuna"
                name="comuna"
                value={form.comuna}
                onChange={onChange}
                required
                disabled={!form.region}
              >
                <option value="">
                  {form.region ? "Elegir..." : "..."}
                </option>
                {comunas.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="telefono">Teléfono <span style={{fontWeight:'normal', fontSize:'0.8em'}}>(Opcional)</span></label>
            <input
              className="form-control"
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="+56 9 1234 5678"
              value={form.telefono}
              onChange={onChange}
            />
          </div>

          {err && <div className="auth-error">{err}</div>}

          <button 
            className="btn-registro" 
            disabled={!canSubmit || loading}
            style={{ opacity: !canSubmit || loading ? 0.7 : 1 }} // Feedback visual
          >
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        <p className="auth-hint">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </motion.div>
  );
}