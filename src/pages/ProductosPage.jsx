import { useEffect, useRef, useState, useMemo } from "react";
import ProductCard from "../components/ProductCard";
import ProductQuickView from "../components/ProductQuickView";
import { loadProductsOnce } from "../services/productsStore";

export default function ProductosPage() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [sort, setSort] = useState("new");

  // Estado del Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    (async () => {
      setLoading(true);
      try {
        const data = await loadProductsOnce();
        setAll(data || []);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(all.map(p => (p.category || "").trim()).filter(Boolean));
    return ["Todas", ...Array.from(set)];
  }, [all]);

  const items = useMemo(() => {
    let list = [...all];

    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(p =>
        String(p.name || "").toLowerCase().includes(t) ||
        String(p.description || "").toLowerCase().includes(t)
      );
    }

    if (cat !== "Todas") {
      list = list.filter(p => (p.category || "").toLowerCase() === cat.toLowerCase());
    }

    switch (sort) {
      case "price_asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "new":
      default:
        list.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    }
    return list;
  }, [all, q, cat, sort]);

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <main className="products-page-container" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      
      <div className="page-header-glow"></div>

      <div className="container py-5 products-header-content">
        
        <section className="mb-5">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-end gap-4">
            <div className="col-lg-7">
              <span className="eyebrow-text">
                Nuestros Favoritos
              </span>
              <h1 className="display-title-m3 mb-3" style={{ fontWeight: 700 }}>
                Catálogo de Colección
              </h1>
              <p className="text-muted fs-5 mb-0" style={{ maxWidth: "600px", lineHeight: "1.6" }}>
                Explora accesorios premium con diseño e innovación. Encuentra el complemento perfecto para tu ritmo de vida.
              </p>
            </div>
          </div>
        </section>

        <section className="clean-filter-bar sticky-top" style={{ top: "85px", zIndex: 90 }}>
          <div className="row g-3 align-items-center">
            
            <div className="col-12 col-md-5">
              <div className="position-relative">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                    <i className="bi bi-search"></i> 
                </span>
                <input
                  className="form-control input-m3-pill ps-5"
                  placeholder="Buscar (ej. Cargador, Case)..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <button 
                    className="btn-clear-search position-absolute top-50 end-0 translate-middle-y pe-3"
                    onClick={() => setQ("")}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select className="form-select input-m3-pill" value={cat} onChange={e => setCat(e.target.value)}>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="col-6 col-md-4">
              <select className="form-select input-m3-pill" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="new">✨ Más nuevos</option>
                <option value="price_asc">💲 Precio: Bajo a Alto</option>
                <option value="price_desc">💰 Precio: Alto a Bajo</option>
              </select>
            </div>
          </div>
        </section>

        <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-lg-3 justify-content-center">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col">
                <div className="card border-0 h-100 shadow-sm rounded-4 overflow-hidden bg-white" aria-hidden="true">
                  <div className="ratio ratio-1x1 bg-light placeholder-wave" />
                  <div className="card-body text-center p-4">
                    <h5 className="card-title placeholder-glow justify-content-center d-flex">
                      <span className="placeholder col-8 rounded-pill"></span>
                    </h5>
                    <p className="card-text placeholder-glow justify-content-center d-flex gap-2 mt-3">
                      <span className="placeholder col-4 rounded-pill py-2"></span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {items.map(p => (
                <div key={p.id} className="col">
                  <div className="h-100" onClick={() => handleOpenModal(p)} style={{ cursor: "pointer" }}>
                    <ProductCard p={p} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        
        {!loading && !items.length && (
            <div className="text-center py-5 mt-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3" style={{ width: '100px', height: '100px', fontSize: '3rem' }}>
                  🕵️‍♀️
              </div>
              <h3 className="h4 fw-bold mt-3">Ups, no encontramos nada</h3>
              <p className="text-muted mb-4">No hay productos que coincidan con esos filtros.</p>
              <button 
                  className="btn rounded-pill px-4 py-2 fw-medium" 
                  style={{ background: 'var(--main_color-primary)', color:'white' }}
                  onClick={() => {
                    setQ("");
                    setCat("Todas");
                  }}
              >
                  Limpiar todos los filtros
              </button>
            </div>
        )}
      </div>

      <ProductQuickView 
        open={showModal}
        onClose={handleCloseModal}
        product={selectedProduct}
        allProducts={all} 
      />
    </main>
  );
}