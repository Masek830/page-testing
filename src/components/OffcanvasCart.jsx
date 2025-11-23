import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { formatCurrency } from "../utils/currency"

export default function OffcanvasCart() {
  const navigate = useNavigate()
  const {
    items,
    totalItems,
    totalPrice,
    incrementItem,
    decrementItem,
    removeItem,
    isLoading,
    isMutating
  } = useCart()

  const handleGoToCart = useCallback(() => {
    if (typeof window !== "undefined" && window.bootstrap) {
      const offcanvasElement = document.getElementById("cartOffcanvas")
      const instance = offcanvasElement
        ? window.bootstrap.Offcanvas.getInstance(offcanvasElement) ||
          new window.bootstrap.Offcanvas(offcanvasElement)
        : null
      instance?.hide()
    }
    navigate("/cart")
  }, [navigate])

  const handleCheckout = () => {}

  const handleIncrement = useCallback(
    (itemId) => {
      incrementItem(itemId).catch((error) => {
        console.error("No se pudo aumentar la cantidad", error)
      })
    },
    [incrementItem]
  )

  const handleDecrement = useCallback(
    (itemId) => {
      decrementItem(itemId).catch((error) => {
        console.error("No se pudo disminuir la cantidad", error)
      })
    },
    [decrementItem]
  )

  const handleRemove = useCallback(
    (itemId) => {
      removeItem(itemId).catch((error) => {
        console.error("No se pudo quitar el producto", error)
      })
    },
    [removeItem]
  )

  const busy = isLoading || isMutating

  return (
    <div
      className="offcanvas offcanvas-end"
      tabIndex="-1"
      id="cartOffcanvas"
      aria-labelledby="cartOffcanvasLabel"
    >
      <div className="offcanvas-header">
        <h5 className="offcanvas-title" id="cartOffcanvasLabel">
          Tu carrito
        </h5>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
      </div>
      <div className="offcanvas-body d-flex flex-column">
        <div className="mb-4">
          {busy ? (
            <div className="text-center py-5 text-muted">Actualizando carrito...</div>
          ) : items.length ? (
            items.map((item) => {
              const product = item.product ?? {}
              const image = product.image || "";
              return (
                <div key={item.id} className="offcanvas-cart-item">
                  {image ? <img src={image} alt={product.name ?? "Producto"} /> : null}
                  <div className="offcanvas-cart-item-details">
                    <h6>{product.name}</h6>
                    <div className="price">{formatCurrency(product.price)}</div>
                    <div className="offcanvas-cart-item-actions">
                      <div className="quantity-selector">
                        <button
                          className="quantity-btn"
                          type="button"
                          aria-label="Disminuir cantidad"
                          onClick={() => handleDecrement(item.id)}
                          disabled={isMutating}
                        >
                          -
                        </button>
                        <input
                          className="quantity-input"
                          type="text"
                          readOnly
                          value={item.quantity}
                          aria-label="Cantidad"
                        />
                        <button
                          className="quantity-btn"
                          type="button"
                          aria-label="Aumentar cantidad"
                          onClick={() => handleIncrement(item.id)}
                          disabled={isMutating}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="remove-btn bg-transparent border-0 p-0"
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={isMutating}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center text-muted py-5">
              Tu carrito está vacío. ¡Descubre nuestros productos!
            </div>
          )}
        </div>
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold">Total ({totalItems} {totalItems === 1 ? "artículo" : "artículos"})</span>
            <span className="fw-bold text-primary">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="d-grid gap-2">
            <button className="btn btn-outline-secondary" type="button" onClick={handleGoToCart}>
              Ir al carro
            </button>
            <button className="btn__text" type="button" onClick={handleCheckout} disabled={!items.length}>
              Iniciar pago
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
