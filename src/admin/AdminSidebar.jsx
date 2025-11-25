import { NavLink } from "react-router-dom";
import useLogout from "../hooks/useLogout"; 

const ADMIN_LINKS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "fas fa-home" },
  { label: "Productos", href: "/admin/products", icon: "fas fa-box" },
  { label: "Agregar producto", href: "/admin/add-product", icon: "fas fa-plus" },
  { label: "Usuarios", href: "/admin/users", icon: "fas fa-users" },
];

export default function AdminSidebar() {
  // CORRECCIÓN: Quitamos las llaves { } porque tu hook retorna la función directa.
  const logout = useLogout(); 

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <img src="/TheHub/images/ic_thehub_logo.png" alt="The Hub Admin" />
      </div>

      <nav>
        <ul className="nav flex-column p-0 m-0">
          {ADMIN_LINKS.map((link) => (
            <li key={link.label} className="nav-item">
              <NavLink 
                to={link.href} 
                className={({ isActive }) => 
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <i className={`${link.icon}`} />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 mt-auto">
        <button 
            type="button" 
            onClick={logout} 
            className="logout-btn"
        >
          <i className="fas fa-sign-out-alt me-3" />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}