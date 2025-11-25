import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CartApi } from "../api/coreApi";
import { onUnauthorized } from "../api/http";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

function sanitizeQuantity(quantity) {
  const parsed = Number.parseInt(quantity, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pickImagesArray(product) {
  const raw =
    (Array.isArray(product?.image_url) && product.image_url) ||
    (Array.isArray(product?.images) && product.images) ||
    [];

  const images = raw
    .map((x) =>
      typeof x === "string" ? x : x?.url || x?.path || x?.src || ""
    )
    .filter(Boolean);

  const image = product?.image || images[0] || "";
  return { images, image };
}

function normalizeCartItem(item) {
  if (!item) return null;

  const product = item.product ?? {};
  const { images, image } = pickImagesArray(product);

  const quantity = sanitizeQuantity(item.quantity ?? 0);
  const price =
    toNumber(product.price) ||
    toNumber(product.price_value) ||
    toNumber(product.priceNumber) ||
    toNumber(item.price);

  const productId = item.product_id ?? product.id ?? null;

  return {
    id: item.id ?? `${productId ?? "item"}`,
    cartId: item.cart_id ?? null,
    productId,
    quantity,
    product: {
      id: productId,
      name: product.name ?? "",
      description: product.description ?? "",
      category: product.category ?? "",
      price,
      stock: product.stock ?? product.stock_quantity ?? null,
      images,
      image,
    },
    subtotal: price * quantity,
  };
}

function normalizeCart(cart) {
  // DEBUG: Mantenemos este log para confirmar que seguimos leyendo bien
  console.log("📦 [DEBUG] Estructura recibida del Backend:", cart);

  if (!cart) {
    return { cartId: null, userId: null, items: [] };
  }

  const rawItems =
    (Array.isArray(cart._cart_item_of_cart_of_product) && cart._cart_item_of_cart_of_product) ||
    (Array.isArray(cart.items) && cart.items) ||
    (Array.isArray(cart.cart_items) && cart.cart_items) ||
    (Array.isArray(cart._cart_items) && cart._cart_items) ||
    (Array.isArray(cart.items_list) && cart.items_list) ||
    (Array.isArray(cart) ? cart : []) ||
    [];

  console.log(`🔍 [DEBUG] Items crudos encontrados: ${rawItems.length}`, rawItems);

  const items = rawItems
    .map((ci) => normalizeCartItem(ci))
    .filter((x) => x && x.productId);

  return {
    cartId: cart.id ?? null,
    userId: cart.user_id ?? null,
    items,
  };
}

export function CartProvider({ children }) {
  const { status: authStatus } = useAuth();
  const [cartId, setCartId] = useState(() => CartApi.getStoredCartId());
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const bootOnce = useRef(false);
  const lastAuthStatus = useRef(authStatus);
  const authThrottleRef = useRef(0);
  const inflightRefresh = useRef(null);
  const inflightEnsure = useRef(null);

  const applyCartState = useCallback((cartData) => {
    const normalized = normalizeCart(cartData);
    if (normalized.cartId) CartApi.setStoredCartId(normalized.cartId);
    setCartId(normalized.cartId);
    setUserId(normalized.userId);
    setItems(normalized.items);
    setError(null);
  }, []);

  const resetLocalCart = useCallback(() => {
    CartApi.clearStoredCartId();
    setCartId(null);
    setUserId(null);
    setItems([]);
  }, []);

  const handleCartError = useCallback(
    (err) => {
      console.error("🚨 [ERROR CRÍTICO CARRITO]:", err); // Log visible en consola
      if (err?.response?.status === 404) {
        resetLocalCart();
      }
      setError(err);
    },
    [resetLocalCart]
  );

  useEffect(() => {
    const unsub = onUnauthorized(() => {
      resetLocalCart();
    });
    return unsub;
  }, [resetLocalCart]);

  const refreshCart = useCallback(
    async (targetCartId) => {
      const effectiveCartId =
        targetCartId ?? cartId ?? CartApi.getStoredCartId();

      if (!effectiveCartId) return null;
      if (inflightRefresh.current) return inflightRefresh.current;

      setIsLoading(true);
      inflightRefresh.current = (async () => {
        try {
          const cart = await CartApi.getCart(effectiveCartId);
          if (cart) applyCartState(cart);
          return cart;
        } catch (err) {
          handleCartError(err);
          throw err;
        } finally {
          inflightRefresh.current = null;
          setIsLoading(false);
        }
      })();

      return inflightRefresh.current;
    },
    [applyCartState, cartId, handleCartError]
  );

  const ensureCartId = useCallback(async () => {
    if (cartId) return cartId;
    if (inflightEnsure.current) return inflightEnsure.current;
    
    setIsLoading(true);
    inflightEnsure.current = (async () => {
      try {
        const cart = await CartApi.ensureCart();
        if (cart) {
          applyCartState(cart);
          return cart.id ?? null;
        }
        return null;
      } catch (err) {
        handleCartError(err);
        throw err;
      } finally {
        inflightEnsure.current = null;
        setIsLoading(false);
      }
    })();

    return inflightEnsure.current;
  }, [applyCartState, cartId, handleCartError]);

  useEffect(() => {
    if (bootOnce.current) return;
    bootOnce.current = true;

    let cancelled = false;
    (async () => {
      try {
        const existing = CartApi.getStoredCartId();
        if (existing) {
          if (!cancelled) await refreshCart(existing);
          return;
        }
        const ensuredId = await ensureCartId();
        if (!cancelled && ensuredId) await refreshCart(ensuredId);
      } catch (err) {
        if (!cancelled) console.error("Error inicializando el carrito", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureCartId, refreshCart]);

  useEffect(() => {
    if (
      authStatus !== "authenticated" &&
      authStatus !== "unauthenticated"
    ) {
      lastAuthStatus.current = authStatus;
      return;
    }

    if (authStatus === lastAuthStatus.current) return;
    lastAuthStatus.current = authStatus;

    const now = Date.now();
    if (now - authThrottleRef.current < 800) return;
    authThrottleRef.current = now;

    (async () => {
      try {
        resetLocalCart();
        const id = await ensureCartId();
        if (id) await refreshCart(id);
      } catch (err) {
        console.error("Error actualizando carrito al cambiar autenticación", err);
      }
    })();
  }, [authStatus, ensureCartId, refreshCart, resetLocalCart]);

  // --- NUEVA VERSIÓN DE ADDITEM CON LOGS DE DEPURACIÓN ---
  const addItem = useCallback(
    async (productOrId, quantity = 1) => {
      // Intentamos extraer el ID numérico
      const productId =
        typeof productOrId === "object" && productOrId !== null
          ? productOrId.id ??
            productOrId.product_id ??
            productOrId.productId
          : productOrId;

      const safeQuantity = sanitizeQuantity(quantity);

      console.log(`🛒 [DEBUG] Iniciando addItem. ID Producto: ${productId}, Cantidad: ${safeQuantity}`);
      console.log("🛒 [DEBUG] Objeto producto completo recibido:", productOrId);

      if (!productId || safeQuantity <= 0) {
        console.error("❌ [ERROR] ID de producto inválido o cantidad 0");
        throw new Error("Producto o cantidad inválida");
      }

      setIsMutating(true);
      try {
        let targetCartId = cartId;
        if (!targetCartId) {
             console.log("🛒 [DEBUG] No hay ID local, llamando a ensureCartId...");
             targetCartId = await ensureCartId();
        }

        if (!targetCartId) throw new Error("No fue posible obtener un carrito activo");
        
        console.log(`🛒 [DEBUG] Enviando POST a /cart_item. CartID: ${targetCartId}`);

        // Llamada a la API guardando la respuesta
        const response = await CartApi.addItem({
          cart_id: targetCartId,
          product_id: productId,
          quantity: safeQuantity,
        });

        console.log("⚡ [DEBUG] Respuesta del servidor al AGREGAR item:", response);

        await refreshCart(targetCartId);
      } catch (err) {
        console.error("❌ [ERROR] Falló addItem:", err);
        handleCartError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [cartId, ensureCartId, handleCartError, refreshCart]
  );
  // -------------------------------------------------------

  const updateQuantity = useCallback(
    async (cartItemId, quantity) => {
      const safeQuantity = sanitizeQuantity(quantity);
      if (!cartItemId || safeQuantity <= 0)
        throw new Error("Cantidad inválida");

      setIsMutating(true);
      try {
        await CartApi.updateQty({ cart_item_id: cartItemId, quantity: safeQuantity });
        await refreshCart();
      } catch (err) {
        handleCartError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [handleCartError, refreshCart]
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      if (!cartItemId) return;
      setIsMutating(true);
      try {
        await CartApi.removeItem(cartItemId);
        await refreshCart();
      } catch (err) {
        handleCartError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [handleCartError, refreshCart]
  );

  const incrementItem = useCallback(
    async (cartItemId) => {
      const target = items.find((i) => i.id === cartItemId);
      if (!target) return;
      await updateQuantity(cartItemId, target.quantity + 1);
    },
    [items, updateQuantity]
  );

  const decrementItem = useCallback(
    async (cartItemId) => {
      const target = items.find((i) => i.id === cartItemId);
      if (!target) return;
      const next = target.quantity - 1;
      if (next <= 0) {
        await removeItem(cartItemId);
      } else {
        await updateQuantity(cartItemId, next);
      }
    },
    [items, removeItem, updateQuantity]
  );

  const clearCart = useCallback(async () => {
    const ensuredId = cartId ?? (await ensureCartId());
    if (!ensuredId) return;
    setIsMutating(true);
    try {
      await CartApi.clearCart(ensuredId);
      await refreshCart(ensuredId);
    } catch (err) {
      handleCartError(err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [cartId, ensureCartId, handleCartError, refreshCart]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => {
          acc.totalItems += it.quantity;
          acc.totalPrice += it.subtotal;
          return acc;
        },
        { totalItems: 0, totalPrice: 0 }
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      cartId,
      userId,
      items,
      totalItems: totals.totalItems,
      totalPrice: totals.totalPrice,
      isLoading,
      isMutating,
      error,
      refreshCart,
      addItem,
      updateQuantity,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
    }),
    [
      addItem,
      cartId,
      clearCart,
      decrementItem,
      error,
      incrementItem,
      isLoading,
      isMutating,
      items,
      refreshCart,
      removeItem,
      totals.totalItems,
      totals.totalPrice,
      updateQuantity,
      userId,
    ]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}