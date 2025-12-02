import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../api/http"; 

const ADMIN_STRICT = String(import.meta.env.VITE_ADMIN_STRICT || "false").toLowerCase() === "true";

function isAdminUser(user) {
  if (!user) return false;

  if (user.is_admin === true || user.admin === true) return true;

  const role = (user.role?.name || user.role || user.user_type || user.type || "")
    .toString()
    .toLowerCase();
  if (role === "admin" || role === "administrator") return true;

  const roles = Array.isArray(user.roles) ? user.roles : user.roles?.split?.(",") || [];
  if (roles.map((r) => String(r).toLowerCase()).includes("admin")) return true;

  return false;
}

export default function AdminProtectedRoute() {
  const { status, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return (
      <div className="content-panel">
        <div className="text-center py-5">Verificando sesión…</div>
      </div>
    );
  }

  const token = getToken();
  
  // CASO 1: No hay token y el contexto dice que no estamos autenticados
  // CAMBIO: Redirige al Home (/) en lugar de login
  if (!token && status === "unauthenticated") {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const allowBySession = Boolean(token) || isAuthenticated;

  // CASO 2: Modo estricto activado (verificar rol de admin)
  if (ADMIN_STRICT && allowBySession) {
    // Si ya cargó el usuario y NO es admin
    if (user && !isAdminUser(user)) {
      // CAMBIO: Redirige al Home (/) porque no tiene permisos
      return <Navigate to="/" replace state={{ from: location }} />;
    }
    // Si hay sesión pero el usuario aún no carga (user es null), dejamos pasar al Outlet
    // para que la app intente cargar el perfil, o esperamos (depende de tu lógica),
    // pero tu código original dejaba pasar con <Outlet />, así que lo mantengo.
    if (!user) return <Outlet />;
  }

  // CASO 3: Si tiene sesión válida (y pasó el filtro estricto o no estaba activo)
  if (allowBySession) {
    return <Outlet />;
  }

  // CASO 4: Fallback final (si no cumple nada)
  // CAMBIO: Redirige al Home (/)
  return <Navigate to="/" replace state={{ from: location }} />;
}