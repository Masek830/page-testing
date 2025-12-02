import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CartApi } from "../api/coreApi";

export const CartContext = createContext(null);

function normalizeCart(raw) {
  let items = [];

  if (Array.isArray(raw?.items)) {
    items = raw.items;
  } else if (Array.isArray(raw?.cart_items)) {
    items = raw.cart_items;
  } else if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === "object") {
    const firstArray = Object.values(raw).find((v) => Array.isArray(v));
    if (Array.isArray(firstArray)) {
      items = firstArray;
    }
  }

  const total = items.reduce((acc, it) => {
    const price = Number(it?.product?.price ?? it?.price ?? 0);
    const qty = Number(it?.quantity ?? 0);
    return acc + price * qty;
  }, 0);

  return { items, total };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState(null);

  const inFlightRef = useRef(null);

  async function loadCart(options = { initial: false }) {
    if (inFlightRef.current) return inFlightRef.current;

    if (options.initial) setInitialLoading(true);
    setError(null);

    const promise = (async () => {
      try {
        let data = await CartApi.getCart();

        if (!data) {
          await CartApi.ensureCart();
          data = await CartApi.getCart();
        }

        console.log("[CartContext] Carrito bruto recibido:", data);
        const normalized = normalizeCart(data);
        setCart(normalized);
        return normalized;
      } catch (err) {
        console.error("[CartContext] Error al cargar carrito", err);
        setError("No se pudo cargar el carrito");
        setCart({ items: [], total: 0 });
        throw err;
      } finally {
        inFlightRef.current = null;
        setInitialLoading(false);
      }
    })();

    inFlightRef.current = promise;
    return promise;
  }

  useEffect(() => {
    loadCart({ initial: true });
  }, []);

  async function refresh() {
    return loadCart();
  }

  async function addItem(product, quantity = 1) {
    if (!product?.id) return;
    setLoading(true);
    setError(null);
    try {
      await CartApi.ensureCart();
      console.log(
        "[CartContext] Agregando producto al carrito",
        product.id,
        "qty:",
        quantity
      );
      await CartApi.addItem({
        product_id: product.id,
        quantity,
      });
      await refresh();
    } catch (err) {
      console.error("[CartContext] Error al agregar item", err);
      setError("No se pudo agregar el producto al carrito");
    } finally {
      setLoading(false);
    }
  }

  async function updateItemQuantity(cartItemId, quantity) {
    if (!cartItemId) return;
    setLoading(true);
    setError(null);
    try {
      await CartApi.updateQty({ cart_item_id: cartItemId, quantity });
      await refresh();
    } catch (err) {
      console.error("[CartContext] Error al actualizar item", err);
      setError("No se pudo actualizar el carrito");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(cartItemId) {
    if (!cartItemId) return;
    setLoading(true);
    setError(null);
    try {
      await CartApi.removeItem(cartItemId);
      await refresh();
    } catch (err) {
      console.error("[CartContext] Error al eliminar item", err);
      setError("No se pudo eliminar el producto");
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    setLoading(true);
    setError(null);
    try {
      await CartApi.clearCart();
      await refresh();
    } catch (err) {
      console.error("[CartContext] Error al limpiar carrito", err);
      setError("No se pudo limpiar el carrito");
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      items: cart.items,
      total: cart.total,
      loading,
      initialLoading,
      error,
      refresh,
      addItem,
      updateItemQuantity,
      removeItem,
      clear,
    }),
    [cart, loading, initialLoading, error]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
