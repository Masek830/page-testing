import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";

export default function OffcanvasCart() {
  const navigate = useNavigate();
  const {
    items,
    total,
    loading,
    initialLoading,
    updateItemQuantity,
    removeItem,
  } = useCart();

  const busy = loading || initialLoading;

  const totalItems = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.quantity ?? 0), 0),
    [items]
  );

  /**
   * Cierra el Offcanvas usando la instancia de Bootstrap (asumido).
   */
  const closeOffcanvas = useCallback(() => {
    if (typeof window !== "undefined" && window.bootstrap) {
      const offcanvasElement = document.getElementById("cartOffcanvas");
      const instance =
        offcanvasElement &&
        (window.bootstrap.Offcanvas.getInstance(offcanvasElement) ||
          new window.bootstrap.Offcanvas(offcanvasElement));
      instance?.hide();
    }
  }, []);

  const handleGoToCart = useCallback(() => {
    closeOffcanvas();
    navigate("/cart");
  }, [navigate, closeOffcanvas]);

  /**
   * 🛒 Nuevo: Redirige al proceso de pago.
   * Cierra el offcanvas antes de navegar.
   */
  const handleCheckout = () => {
    closeOffcanvas();
    navigate("/checkout/payment");
  };

  const handleIncrement = useCallback(
    (item) => {
      const current = Number(item.quantity ?? 0);
      const next = current + 1;
      updateItemQuantity(item.id, next).catch((error) => {
        console.error("No se pudo aumentar la cantidad", error);
      });
    },
    [updateItemQuantity]
  );

  const handleDecrement = useCallback(
    (item) => {
      const current = Number(item.quantity ?? 0);
      if (current <= 1) {
        removeItem(item.id).catch((error) => {
          console.error("No se pudo quitar el producto", error);
        });
        return;
      }
      const next = current - 1;
      updateItemQuantity(item.id, next).catch((error) => {
        console.error("No se pudo disminuir la cantidad", error);
      });
    },
    [updateItemQuantity, removeItem]
  );

  const handleRemove = useCallback(
    (itemId) => {
      removeItem(itemId).catch((error) => {
        console.error("No se pudo quitar el producto", error);
      });
    },
    [removeItem]
  );

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
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Cerrar"
        ></button>
      </div>

      <div className="offcanvas-body d-flex flex-column">
        <div className="mb-4">
          {busy ? (
            <div className="text-center py-5 text-muted">
              Actualizando carrito...
            </div>
          ) : items.length ? (
            items.map((item) => {
              const product = item.product ?? {};
              const image = product.image || product.image_url || "";
              const unitPrice = product.price ?? item.price ?? 0;

              return (
                <div key={item.id} className="offcanvas-cart-item">
                  {image ? (
                    <img src={image} alt={product.name ?? "Producto"} />
                  ) : null}

                  <div className="offcanvas-cart-item-details">
                    <h6>{product.name || "Producto"}</h6>
                    <div className="price">
                      {formatCurrency(unitPrice)} c/u
                    </div>

                    <div className="offcanvas-cart-item-actions">
                      <div className="quantity-selector">
                        <button
                          className="quantity-btn"
                          type="button"
                          aria-label="Disminuir cantidad"
                          onClick={() => handleDecrement(item)}
                          disabled={busy}
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
                          onClick={() => handleIncrement(item)}
                          disabled={busy}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="remove-btn bg-transparent border-0 p-0"
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={busy}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted py-5">
              Tu carrito está vacío. ¡Descubre nuestros productos!
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-semibold">
              Total ({totalItems} {totalItems === 1 ? "artículo" : "artículos"})
            </span>
            <span className="fw-bold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="d-grid gap-2">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleGoToCart}
            >
              Ir al carro
            </button>
            {/* 🎯 Se conecta al nuevo manejador handleCheckout */}
            <button
              className="btn__text"
              type="button"
              onClick={handleCheckout} 
              disabled={!items.length || busy}
            >
              Iniciar pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
