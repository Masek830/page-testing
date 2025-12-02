import { getToken } from '../api/http';

const XANO_BASE_URL = "https://x8ki-letl-twmt.n7.xano.io/api:MJq6ok-f";

function getAuthHeaders() {
  // Usar la función getToken() para obtener el token, asegurando consistencia
  const token = getToken(); 
  if (!token) {
    throw new Error("No se encontró token de autenticación. Inicia sesión para crear una orden.");
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

/**
 * Función genérica para hacer llamadas GET a endpoints autenticados.
 * @param {string} endpoint - La ruta específica después de la URL base (ej: '/auth/me').
 * @returns {Promise<Object|Array>} Los datos del endpoint.
 */
async function getAuthenticatedData(endpoint) {
    const url = `${XANO_BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorDetails = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorDetails = errorData.message || JSON.stringify(errorData);
            } catch {}
            throw new Error(`Error al obtener datos de ${endpoint}. Xano dice: ${errorDetails}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error en getAuthenticatedData (${endpoint}):`, error);
        throw error;
    }
}

// 🎯 1. Función para obtener el perfil del usuario logueado (usa /auth/me)
export async function getUserProfile() {
    return getAuthenticatedData('/auth/me');
}

// 🎯 2. Función para crear la orden (POST)
export async function createOrder(totalAmount, items, userId, addressId) {
  // CORRECCIÓN: Usar el endpoint real de Xano: /create_order
  const url = `${XANO_BASE_URL}/create_order`; 
  
  const orderItems = items.map(item => ({
    quantity: item.quantity,
    product_id: item.product_id || item.product.id, 
  }));

  // Incluir el addressId en el payload
  const payload = {
    total_amount: totalAmount, 
    user_id: userId,
    order_items: orderItems,
    payment_method_simulated: "Visa **** 4242",
    address_id: addressId,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetails = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || JSON.stringify(errorData);
      } catch {}

      throw new Error(`Error al crear la orden. Xano dice: ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createOrder:", error);
    throw error;
  }
}

// 🎯 3. Función para obtener las direcciones del usuario (usa /user/addresses)
export async function getUserAddresses() {
    // Usamos el endpoint asumido '/user/addresses' o el que crees en Xano
    return getAuthenticatedData('/user/addresses');
}