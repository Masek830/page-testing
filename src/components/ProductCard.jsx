import { useMemo, useState } from "react";
import { useCart } from "../context/CartContext"; // <--- ESTO ES VITAL

export default function ProductCard({ p, onOpen }) {
  // 1. TRAEMOS LA FUNCIÓN addItem DEL CONTEXTO
  const { addItem, isMutating } = useCart(); 
  
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [loadedKey, setLoadedKey] = useState("");
  const [adding, setAdding] = useState(false);

  // Lógica de imágenes
  const images = useMemo(() => {
    const raw = p?.image_url;
    if (!raw) return [];
    if (typeof raw === "string") return [raw];
    if (Array.isArray(raw)) {
      return raw.map((it) => (typeof it === "string" ? it : it?.url || it?.path || it?.src || "")).filter(Boolean);
    }
    if (Array.isArray(p?.images)) {
      return p.images.map((it) => it?.url || it?.path || it?.src || "").filter(Boolean);
    }
    return [];
  }, [p]);
  
  const cover = images[active] || images[0] || "";
  const maxStock = typeof p?.stock_quantity === "number" && p.stock_quantity > 0 ? p.stock_quantity : 99;

  const handleOpen = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (onOpen) return onOpen(p);
    setShow(true);
  };
  
  const handleClose = () => setShow(false);
  const dec = () => setQty((n) => Math.max(1, n - 1));
  const inc = () => setQty((n) => Math.min(maxStock, n + 1));
  
  const onQtyChange = (e) => {
    const v = Number(e.target.value || 1);
    if (!Number.isNaN(v)) setQty(Math.min(maxStock, Math.max(1, v)));
  };

  // 2. ESTA ES LA NUEVA FUNCIÓN QUE SÍ GUARDA
  const handleAddToCart = async () => {
    if (!p?.id) return;
    setAdding(true);
    try {
      console.log("Intentando agregar:", p.name); // Esto te confirmará que es el código nuevo
      await addItem(p, qty); 
      handleClose(); 
      setQty(1);
    } catch (error) {
      console.error("Error agregando al carro:", error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {/* Card clickeable */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-100 text-start border-0 bg-transparent p-0"
        style={{ cursor: "pointer" }}
      >
        <article className="rounded-3 border bg-white p-3 h-100 d-flex flex-column">
          <div className="ratio ratio-1x1 mb-3 rounded-2 overflow-hidden bg-light pc-zoom-wrap">
            {cover ? (
              <img
                key={cover}
                src={cover}
                alt={p?.name || "Producto"}
                className={`w-100 h-100 object-fit-cover pc-fade-img ${loadedKey === cover ? "is-loaded" : ""}`}
                onLoad={() => setLoadedKey(cover)}
                loading="lazy"
              />
            ) : (
              <div className="w-100 h-100" />
            )}
          </div>

          <div className="small text-muted text-uppercase">{p?.category}</div>
          <h3 className="h6 m-0">{p?.name}</h3>
          <div className="fw-semibold mt-2">
            {typeof p?.price === "number" ? `$${p.price.toLocaleString("es-CL")}` : ""}
          </div>
        </article>
      </button>

      {/* Modal */}
      {show && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,.5)" }}
          onClick={handleClose}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{p?.name}</h5>
                <button type="button" className="btn-close" onClick={handleClose} />
              </div>

              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <div className="ratio ratio-1x1 rounded-3 overflow-hidden bg-light pc-zoom-wrap">
                      {cover ? (
                        <img
                          key={cover}
                          src={cover}
                          alt={p?.name || "Producto"}
                          className={`w-100 h-100 object-fit-cover pc-fade-img ${loadedKey === cover ? "is-loaded" : ""}`}
                          onLoad={() => setLoadedKey(cover)}
                        />
                      ) : null}
                    </div>
                    {images.length > 1 && (
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        {images.map((u, i) => (
                          <button
                            key={u + i}
                            type="button"
                            onClick={() => { setLoadedKey(""); setActive(i); }}
                            className="p-0 border-0 bg-transparent"
                            aria-label={`Miniatura ${i + 1}`}
                          >
                            <img
                              src={u}
                              alt={`miniatura ${i + 1}`}
                              className="pc-thumb"
                              style={{ outline: i === active ? "2px solid #7c3aed" : "1px solid #e5e7eb" }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted text-uppercase small">{p?.category}</div>
                    <h2 className="h3">{p?.name}</h2>
                    <div className="h5 fw-bold mb-3">
                      {typeof p?.price === "number" ? `$${p.price.toLocaleString("es-CL")}` : ""}
                    </div>
                    {p?.description ? <p className="mb-4">{p.description}</p> : null}
                    {typeof p?.stock_quantity === "number" && (
                      <p className="text-muted small mb-2">Stock disponible: {p.stock_quantity}</p>
                    )}

                    <label className="form-label d-block">Cantidad</label>
                    <div className="input-group" style={{ maxWidth: 220 }}>
                      <button type="button" className="btn btn-outline-secondary" onClick={dec}>–</button>
                      <input
                        type="number"
                        className="form-control text-center"
                        value={qty}
                        onChange={onQtyChange}
                        min={1}
                        max={maxStock}
                        inputMode="numeric"
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={inc}>+</button>
                    </div>

                    <div className="d-flex align-items-center gap-2 mt-4">
                      {/* 3. EL BOTÓN AHORA LLAMA A handleAddToCart */}
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddToCart} 
                        disabled={qty < 1 || qty > maxStock || isMutating || adding}
                      >
                        {adding || isMutating ? "Agregando..." : "Añadir al carrito"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={handleClose}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}