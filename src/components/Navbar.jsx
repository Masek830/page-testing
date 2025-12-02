import { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { label: "Inicio", href: "/#home" },
  { label: "Nosotros", href: "/#nosotros" },
  { label: "Productos", href: "/#productos" },
  { label: "Equipo", href: "/#equipo" },
  { label: "Contacto", href: "/#contacto" },
];

const SOCIAL_LINKS = [
  { icon: "fab fa-facebook-f", href: "https://www.facebook.com", label: "Facebook" },
  { icon: "fab fa-instagram", href: "https://www.instagram.com", label: "Instagram" },
  { icon: "fab fa-twitter", href: "https://twitter.com", label: "Twitter" },
  { icon: "fab fa-tiktok", href: "https://www.tiktok.com", label: "TikTok" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const { user, isAdmin, isLoading: authLoading, logout, isAuthenticated } = useAuth();

  const toggleMenu = () => setMenuOpen((p) => !p);
  const closeMenu = () => setMenuOpen(false);
  const displayName = user?.name || user?.email || user?.username || "Tu cuenta";
  const smoothScroll = (el) => el.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    logout();
  }, [logout]);

  
  const adminFlag = useMemo(() => {
    return (
      isAdmin ||
      (user?.user_type && String(user.user_type).toLowerCase() === "admin") ||
      (user?.role && String(user.role).toLowerCase() === "admin") ||
      (user?.type && String(user.type).toLowerCase() === "admin") ||
      (user?.email && user.email.toLowerCase() === "mint@gmail.com")
    );
  }, [isAdmin, user]);

  return (
    <header className="site-header">
      <div className="container">
        <div className="nav-grid">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-secondary d-lg-none"
              type="button"
              onClick={toggleMenu}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuOpen}
            >
              <i className="fas fa-bars"></i>
            </button>
            <Link to="/" className="logo d-flex align-items-center" onClick={closeMenu}>
              <img src="/TheHub/images/Header-logo.png" alt="The Hub" className="img-fluid" />
            </Link>
          </div>

          <div className={`menu-center ${menuOpen ? "d-block" : "d-none d-lg-block"}`}>
            <nav aria-label="Navegación principal">
              <ul className="nav mb-0 justify-content-center gap-4">
                {NAV_LINKS.map((link) => (
                  <li key={link.label} className="nav-item" onClick={closeMenu}>
                    <HashLink to={link.href} className="nav-link" scroll={smoothScroll}>
                      {link.label}
                    </HashLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-3 actions-right">
            {/* SWAP: Cambiamos Explorar por Noticias */}
                <Link to="/noticias" className="btn__search d-none d-sm-inline-block">
                  Noticias
                </Link>

            <div className="SocialMedia d-none d-md-flex align-items-center">
              {SOCIAL_LINKS.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                  <i className={link.icon}></i>
                </a>
              ))}
            </div>

            <button
              className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2 position-relative"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#cartOffcanvas"
              aria-controls="cartOffcanvas"
              onClick={closeMenu}
            >
              <i className="fas fa-shopping-cart"></i>
              <span className="d-none d-lg-inline">Carrito</span>
              {totalItems > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill cart-badge">
                  {totalItems}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-2">
                {adminFlag ? (
                  <Link to="/admin/dashboard" className="btn btn-outline-primary" onClick={closeMenu}>
                    Dashboard
                  </Link>
                ) : (
                  <span className="text-nowrap small fw-semibold d-none d-lg-inline">{displayName}</span>
                )}
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleLogout}
                  disabled={authLoading}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn__text"
                state={{ from: location }}
                onClick={closeMenu}
              >
                Acceder
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
