
import { httpCore } from "./http";


const XANO_ORDER_ENDPOINT = "/order"; 

const CART_KEY = import.meta.env.VITE_CART_KEY ?? "THEHUB_CART_ID";

function getStoredCartId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CART_KEY);
  } catch {
    return null;
  }
}

function setStoredCartId(id) {
  if (typeof window === "undefined") return;
  try {
    if (!id) {
      window.localStorage.removeItem(CART_KEY);
    } else {
      window.localStorage.setItem(CART_KEY, String(id));
    }
  } catch {}
}

function clearStoredCartId() {
  setStoredCartId(null);
}

async function ensureCart() {
  const storedId = getStoredCartId();

  if (storedId) {
    try {
      const existing = await getCart(storedId);
      if (existing?.id) return existing;
    } catch (e) {
      console.error("Error verificando carrito existente:", e);
    }
  }

  const { data } = await httpCore.post("/cart");
  if (data?.id) {
    setStoredCartId(data.id);
  }
  return data;
}

async function getCart(cartId = getStoredCartId()) {
  const finalId = cartId ?? getStoredCartId();
  if (!finalId) return null;

  
  const { data } = await httpCore.get("/cart_item", {
    params: { 
        cart_id: finalId,
        
        add_related_data: "product", 
    },
  });

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  return {
    id: finalId,
    items,
  };
}

async function addItem({ product_id, quantity }) {
  const cartId = getStoredCartId();
  if (!cartId) throw new Error("No se encontró carrito activo");
  if (!product_id) throw new Error("product_id es obligatorio");

  const payload = {
    cart_id: cartId,
    product_id,
    quantity,
  };

  const { data } = await httpCore.post("/cart_item", payload);
  return data;
}

async function updateQty({ cart_item_id, quantity }) {
  if (!cart_item_id) throw new Error("cart_item_id es obligatorio");

  const { data } = await httpCore.patch(`/cart_item/${cart_item_id}`, {
    quantity,
  });

  return data;
}

async function removeItem(cart_item_id) {
  if (!cart_item_id) throw new Error("cart_item_id es obligatorio");

  const { data } = await httpCore.delete(`/cart_item/${cart_item_id}`);
  return data;
}

async function clearCart(cartId = getStoredCartId()) {
  const effective = cartId ?? getStoredCartId();
  if (!effective) return;

  const cart = await getCart(effective);
  if (!cart?.items?.length) return;

  
  await Promise.all(
    cart.items.map((item) =>
      item?.id ? removeItem(item.id) : Promise.resolve()
    )
  );
}

async function createOrder() {
  const cartId = getStoredCartId();
  if (!cartId) throw new Error("No hay carrito activo para crear la orden.");

  
  const payload = {
      cart_id: cartId,
      
  };

  try {
    
    const { data } = await httpCore.post(XANO_ORDER_ENDPOINT, payload);
    
    
    clearStoredCartId();
    
    return data; 
  } catch (error) {
    console.error("Fallo al crear la orden:", error);
    
    throw new Error("No se pudo completar la transacción. Intenta de nuevo.");
  }
}

async function listProducts(params = {}) {
  const { data } = await httpCore.get("/product", { params });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function getProduct(id) {
  if (!id) throw new Error("ID inválido");
  const { data } = await httpCore.get(`/product/${id}`);
  return data;
}

async function relatedProducts(id, n = 4) {
  if (!id) return [];
  const { data } = await httpCore.get(`/product/${id}/related`, {
    params: { n },
  });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export const ProductsApi = {
  list: listProducts,
  get: getProduct,
  relatedOf: relatedProducts,
};

export const CartApi = {
  ensureCart,
  getCart,
  addItem,
  updateQty,
  removeItem,
  clearCart,
  createOrder, 
  getStoredCartId,
  setStoredCartId,
  clearStoredCartId,
};

export { CART_KEY };
