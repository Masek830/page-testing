// src/lib/miniAxios.js

// 1. CONFIGURACIÓN DEL PROXY
// En lugar de la URL completa, usamos la ruta relativa que definiste en vite.config.js
// "/xano-auth" -> Vite lo redirige internamente a "https://.../api:MJq6ok-f"
const PROXY_URL = "/xano-auth"; 

// 2. GESTIÓN DE TOKENS
const TOKEN_KEY = "token";
let _token = (typeof localStorage !== "undefined" && localStorage.getItem(TOKEN_KEY)) || null;

function setToken(t) {
  _token = t || null;
  if (typeof localStorage !== "undefined") {
    if (_token) localStorage.setItem(TOKEN_KEY, _token);
    else localStorage.removeItem(TOKEN_KEY);
  }
}

function getToken() {
  return _token;
}

function clearToken() {
  setToken(null);
}

// 3. CONSTRUCTOR DE URL
function buildURL(baseURL = "", url = "", params) {
  let target;
  const effectiveBase = baseURL || "";

  try {
    // Si la base es relativa (ej: "/xano-auth"), usamos el origen de la ventana (localhost)
    if (effectiveBase.startsWith("/")) {
       const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
       // Combinamos origen + base + url, limpiando slashes dobles
       const combined = (effectiveBase + "/" + (url || "")).replace(/\/+/g, "/"); 
       target = new URL(combined, origin);
    } 
    // Si es absoluta (https://...)
    else if (/^https?:/i.test(effectiveBase)) {
      target = new URL(url || "", effectiveBase);
    } 
    else {
      target = new URL(url || "", window.location.origin);
    }
  } catch (e) {
    console.error("Error construyendo URL:", e);
    return "";
  }

  // Añadir parámetros
  if (params && typeof params === "object") {
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((x) => target.searchParams.append(k, x));
        else target.searchParams.set(k, v);
      });
  }

  return target.toString();
}

// 4. GESTIÓN DE HEADERS
function ensureHeaders(headers) {
  const result = new Headers();
  
  if (_token && !headers?.Authorization && !headers?.authorization) {
    result.set("Authorization", `Bearer ${_token}`);
  }

  if (!headers) return result;
  
  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value === "undefined" || value === null) return;
    result.set(key, value);
  });
  
  return result;
}

// 5. CREADOR DE LA INSTANCIA
function createAxiosInstance(defaultConfig = {}) {
  const requestInterceptors = [];
  const responseInterceptors = [];

  const instance = {
    defaults: { ...defaultConfig },
    
    interceptors: {
      request: {
        use(onFulfilled, onRejected) {
          requestInterceptors.push({ onFulfilled, onRejected });
          return requestInterceptors.length - 1;
        },
      },
      response: {
        use(onFulfilled, onRejected) {
          responseInterceptors.push({ onFulfilled, onRejected });
          return responseInterceptors.length - 1;
        },
      },
    },

    async request(config = {}) {
      let requestConfig = {
        method: "get",
        headers: {},
        withCredentials: false,
        ...instance.defaults,
        ...config,
      };

      for (const { onFulfilled, onRejected } of requestInterceptors) {
        if (!onFulfilled) continue;
        try {
          requestConfig = await onFulfilled(requestConfig);
        } catch (err) {
          if (onRejected) requestConfig = await onRejected(err);
          else throw err;
        }
      }

      const { baseURL = instance.defaults.baseURL ?? "", params, data, body } = requestConfig;
      const url = buildURL(baseURL, requestConfig.url ?? "", params);
      const method = (requestConfig.method || "get").toUpperCase();
      const headers = ensureHeaders(requestConfig.headers);

      let payload = body ?? data;

      if (payload && typeof payload === "object" && !(payload instanceof FormData)) {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        if (headers.get("Content-Type")?.includes("application/json")) {
          payload = JSON.stringify(payload);
        }
      }

      const fetchOptions = {
        method,
        headers,
        body: ["GET", "HEAD"].includes(method) ? undefined : payload,
        credentials: requestConfig.withCredentials ? "include" : "omit",
      };

      let response;
      try {
        response = await fetch(url, fetchOptions);
      } catch (networkError) {
        const error = new Error("Network Error");
        error.config = requestConfig;
        throw error;
      }

      const contentType = response.headers.get("Content-Type") || "";
      let responseData;

      if (contentType.includes("application/json")) {
        try { responseData = await response.json(); } catch { responseData = null; }
      } else if (contentType.includes("text/")) {
        try { responseData = await response.text(); } catch { responseData = null; }
      } else {
        try { responseData = await response.blob(); } catch { responseData = null; }
      }

      let axiosResponse = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config: requestConfig,
        request: null,
      };

      if (!response.ok) {
        const axiosError = new Error(`Request failed with status code ${response.status}`);
        axiosError.response = axiosResponse;
        axiosError.config = requestConfig;
        axiosError.isAxiosError = true;

        for (const { onRejected } of responseInterceptors) {
          if (!onRejected) continue;
          try {
            const maybe = await onRejected(axiosError);
            if (maybe !== undefined) return maybe;
          } catch (error) {
            throw error;
          }
        }
        throw axiosError;
      }

      for (const { onFulfilled } of responseInterceptors) {
        if (onFulfilled) {
          axiosResponse = await onFulfilled(axiosResponse);
        }
      }

      return axiosResponse;
    },

    get(url, config) { return instance.request({ ...config, method: "get", url }); },
    delete(url, config) { return instance.request({ ...config, method: "delete", url }); },
    post(url, data, config) { return instance.request({ ...config, method: "post", url, data }); },
    put(url, data, config) { return instance.request({ ...config, method: "put", url, data }); },
    patch(url, data, config) { return instance.request({ ...config, method: "patch", url, data }); },
  };

  return instance;
}

// 6. INICIALIZACIÓN CON PROXY
// Aquí está la clave: usamos PROXY_URL ("/xano-auth") como base por defecto.
const api = createAxiosInstance({ baseURL: PROXY_URL });

api.setToken = setToken;
api.getToken = getToken;
api.clearToken = clearToken;

const axios = {
  create: (config) => createAxiosInstance(config),
};

export default api;
export { createAxiosInstance, axios, buildURL, setToken, getToken, clearToken };