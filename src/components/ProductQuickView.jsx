import { useCallback, useEffect, useMemo, useState } from "react"
import { useCart } from "../context/CartContext"
import { formatCurrency } from "../utils/currency"

export function pickRelated(all, current, n = 3) {
  if (!all || !Array.isArray(all) || !current) return []
  return all
    .filter((x) => x.id !== current.id && x.category === current.category)
    .slice(0, n)
}

export default function ProductQuickView({ open, onClose, product, allProducts = [] }) {
  const [selectedProduct, setSelectedProduct] = useState(product || null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loadedKey, setLoadedKey] = useState("")
  const [manualActive, setManualActive] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const { addItem, isMutating } = useCart()

  useEffect(() => {
    if (open) {
      setSelectedProduct(product)
      setActiveImageIndex(0)
      setQuantity(1)
      setLoadedKey("")
      setIsAdded(false)
    }
  }, [product, open])

  useEffect(() => {
    if (open && !manualActive) {
      setManualActive(true)
    } else if (!open && manualActive) {
      setManualActive(false)
    }
  }, [open, manualActive])

  const images = useMemo(() => {
    const p = selectedProduct
    if (!p) return []
    const raw = p.images || p.image_url || p.image
    
    let list = []

    if (Array.isArray(raw)) {
       list = raw.map((it) => (typeof it === "string" ? it : it?.url || it?.path || it?.src || ""))
    } else if (typeof raw === "string") {
       list = [raw]
    }

    if (list.length === 0 && (p.image || p.image_url)) {
        list = [p.image || p.image_url]
    }
    
    return list.filter(Boolean)
  }, [selectedProduct])

  const cover = images[activeImageIndex] || images[0] || ""

  const relatedProducts = useMemo(
    () => (selectedProduct ? pickRelated(allProducts, selectedProduct, 3) : []),
    [allProducts, selectedProduct]
  )

  const maxStock =
    typeof selectedProduct?.stock_quantity === "number" && selectedProduct.stock_quantity > 0
      ? selectedProduct.stock_quantity
      : 99

  const handleClose = useCallback(() => {
    setManualActive(false)
    setTimeout(() => {
        setActiveImageIndex(0) 
    }, 200)
    if (onClose) onClose()
  }, [onClose])

  const handleSelectRelated = useCallback((related) => {
    setSelectedProduct(related)
    setActiveImageIndex(0)
    setQuantity(1)
    setLoadedKey("")
    setIsAdded(false)
  }, [])

  const decrementQty = () => setQuantity((n) => Math.max(1, n - 1))
  const incrementQty = () => setQuantity((n) => Math.min(maxStock, n + 1))
  
  const handleAddToCart = useCallback(async () => {
    if (!selectedProduct) return
    try {
      await addItem(selectedProduct, quantity)
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 2000)
    } catch (error) {
      console.error(error)
    }
  }, [selectedProduct, quantity, addItem])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && manualActive) handleClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [manualActive, handleClose])

  if (!manualActive) return null

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 1055 }}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content product-hero-modal border-0 bg-transparent">
            
            <div className="modal-header d-flex flex-column align-items-start pb-0 border-0">
              <button
                type="button"
                className="btn-close position-absolute top-0 end-0 m-3 z-3"
                onClick={handleClose}
                aria-label="Cerrar"
              />
              
              <nav aria-label="breadcrumb" className="w-100 mt-2">
                <ol className="breadcrumb m-0 glass-breadcrumbs">
                  <li className="breadcrumb-item">
                    <span className="text-muted">Inicio</span>
                  </li>
                  <li className="breadcrumb-item">
                    <span className="text-muted">{selectedProduct?.category || 'Catálogo'}</span>
                  </li>
                  <li className="breadcrumb-item active text-truncate" style={{ maxWidth: '200px' }}>
                    {selectedProduct?.name}
                  </li>
                </ol>
              </nav>
            </div>

            {selectedProduct ? (
              <div className="modal-body pt-3">
                <div className="row align-items-start">
                  
                  <div className="col-md-6 mb-4 mb-md-0">
                    <div className="product-image-container">
                      <img 
                        src={cover} 
                        alt={selectedProduct.name} 
                        className={`img-fluid ${loadedKey === cover ? "is-loaded" : ""}`}
                        onLoad={() => setLoadedKey(cover)}
                        style={{ maxHeight: '350px', objectFit: 'contain' }}
                      />
                    </div>

                    {images.length > 1 && (
                      <div className="thumbnails-container">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`thumb-btn-fix ${i === activeImageIndex ? 'active' : ''}`}
                            onClick={() => setActiveImageIndex(i)}
                            aria-label={`Ver imagen ${i + 1}`}
                          >
                            <img src={img} alt={`Miniatura ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <span className="product-category">
                      {selectedProduct.category || "General"}
                    </span>
                    
                    <h2 className="product-title">{selectedProduct.name}</h2>

                    <div className="product-price">
                      {formatCurrency(selectedProduct.price)}
                      {selectedProduct.stock_quantity > 0 && (
                        <span className="stock-badge ms-2">
                          <i className="bi bi-box-seam me-1"></i>
                          {selectedProduct.stock_quantity}
                        </span>
                      )}
                    </div>

                    <p className="text-muted mb-4" style={{ lineHeight: '1.6' }}>
                      {selectedProduct.description || "Sin descripción disponible."}
                    </p>

                    <div className="control-group">
                      <div className="quantity-selector-pill">
                        <button 
                          className="quantity-btn" 
                          onClick={decrementQty}
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <input 
                          className="quantity-input" 
                          value={quantity} 
                          readOnly 
                        />
                        <button 
                          className="quantity-btn" 
                          onClick={incrementQty}
                          disabled={quantity >= maxStock}
                        >
                          +
                        </button>
                      </div>

                      <button 
                        className={`add-to-cart-btn ${isAdded ? 'is-added' : ''}`}
                        onClick={handleAddToCart}
                        disabled={isMutating || quantity < 1 || quantity > maxStock}
                      >
                        <i className={`bi ${isAdded ? 'bi-check-lg' : 'bi-bag-plus-fill'}`}></i>
                        {isMutating ? "..." : (isAdded ? "¡Listo!" : "Añadir")}
                      </button>
                    </div>
                  </div>
                </div>

                {relatedProducts.length > 0 && (
                  <div className="related-products-section mt-5">
                    <h5 className="section-title mb-3">
                      <i className="bi bi-stars me-2 text-primary"></i>
                      También te podría gustar
                    </h5>
                    
                    <div className="row g-3">
                      {relatedProducts.map((rel) => (
                        <div key={rel.id} className="col-4">
                          <div 
                            className="related-card h-100" 
                            onClick={() => handleSelectRelated(rel)}
                          >
                            <div className="related-img-wrapper">
                              <img 
                                src={rel.image || (rel.images && rel.images[0]) || ""} 
                                alt={rel.name} 
                              />
                            </div>
                            <div className="related-info">
                              <h6 className="text-truncate">{rel.name}</h6>
                              <span className="price">{formatCurrency(rel.price)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="modal-body py-5 text-center text-muted">
                Cargando detalles...
              </div>
            )}
          </div>
        </div>
      </div>
      {manualActive && <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>}
    </>
  )
}