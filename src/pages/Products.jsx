import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api/ProductsApi";
import ProductCard from "./ProductCard";

export default function Products({ limit = 6, title = "Nuestros favoritos" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    (async () => {
      try {
        setLoading(true);
        const { items: serverItems = [] } = await fetchProducts({
          limit,
          page: 1,
          sort: "new",
        });
        setItems(serverItems.slice(0, limit));
      } catch (e) {
        console.error("[Products] error:", e);
        setErr(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  // ✅ CORRECCIÓN: Todos los textos ahora usan el mismo color morado
  const styles = {
    eyebrow: {
      color: '#9a00bf', // Color primario morado
      letterSpacing: '3px',
      fontSize: '0.75rem',
      fontWeight: '800',
      marginBottom: '0.5rem',
      display: 'block',
      textTransform: 'uppercase'
    },
    title: {
      color: '#9a00bf', // ✅ CAMBIO: Era '#101e2c', ahora es morado
      fontWeight: '800',
      fontSize: '2.5rem',
      lineHeight: '1.1',
      letterSpacing: '-1px'
    },
    description: {
      color: '#9a00bf', // Color primario morado (igual que antes)
      fontWeight: '600',
      fontSize: '1.1rem',
      lineHeight: '1.5',
      marginTop: '1rem',
      maxWidth: '700px'
    }
  };

  return (
    <section className="py-5 bg-white">
      <div className="container py-4">
        
        {/* === HEADER CON COLORES UNIFICADOS === */}
        <div className="row align-items-end mb-5">
          <div className="col-lg-8">
            {/* 1. Eyebrow: "NUESTROS FAVORITOS" */}
            <span style={styles.eyebrow}>
              NUESTROS FAVORITOS
            </span>
            
            {/* 2. Título Grande - Ahora en MORADO */}
            <h2 style={styles.title}>
              {title}
            </h2>
            
            {/* 3. Descripción en MORADO */}
            <p style={styles.description}>
              Curamos colecciones limitadas de accesorios premium para dispositivos móviles, 
              gamers y creadores. Haz clic en cualquiera para descubrir más detalles.
            </p>
          </div>

          {/* 4. Botón a la derecha */}
          <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
            <Link 
              to="/productos" 
              className="btn rounded-pill px-4 py-2 fw-bold"
              style={{ 
                borderColor: '#9a00bf',  // Borde morado
                color: '#9a00bf',         // Texto morado
                borderWidth: '2px',
                backgroundColor: 'transparent'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#9a00bf';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9a00bf';
              }}
            >
              Ver catálogo completo
            </Link>
          </div>
        </div>

        {/* === GRID DE PRODUCTOS === */}
        {err && (
          <div className="alert alert-danger" role="alert">
            Hubo un error cargando los productos.
          </div>
        )}

        <div className="row g-4">
          {loading
            ? Array.from({ length: limit }).map((_, i) => (
                <div key={`sk-${i}`} className="col-12 col-sm-6 col-lg-4">
                  <div className="card border h-100 p-3 rounded-4 bg-white">
                    <div className="ratio ratio-1x1 mb-3 rounded-3 bg-light placeholder-wave" />
                    <div className="placeholder-glow">
                      <span className="placeholder col-6 mb-2 bg-secondary"></span>
                      <span className="placeholder col-4 bg-secondary"></span>
                    </div>
                  </div>
                </div>
              ))
            : items.map((p) => (
                <div key={p.id} className="col-12 col-sm-6 col-lg-4">
                  <div className="h-100">
                    <ProductCard p={p} />
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}