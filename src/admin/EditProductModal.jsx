// src/admin/EditProductModal.jsx
import { useEffect, useState } from "react";
import { updateProductWithImages } from "../api/ProductsApi";

export default function EditProductModal({ product, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock_quantity: 0,
    brand: "",
    category: "",
  });

  const [files, setFiles] = useState(null);
  const [keepExisting, setKeepExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        stock_quantity: product.stock_quantity || 0,
        brand: product.brand || "",
        category: product.category || "",
      });
    }
  }, [product]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onFilesChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        brand: form.brand.trim(),
        category: form.category.toLowerCase().trim(),
        keepExistingImages: keepExisting,
      };

      const updated = await updateProductWithImages(product.id, payload, files);

      console.log("[EditProductModal] Producto actualizado:", updated);
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      console.error("[EditProductModal] Error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al actualizar el producto"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <>
      {/* Backdrop con blur */}
      <div
        className="modal-backdrop-glass"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        {/* Modal container */}
        <div
          className="content-panel"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "900px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              paddingBottom: "1rem",
              borderBottom: "1px solid rgba(255,255,255,.18)",
            }}
          >
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.75rem" }}>
              Editar Producto
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,.1)",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#fff",
                fontSize: "1.2rem",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,.2)";
                e.target.style.transform = "rotate(90deg)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,.1)";
                e.target.style.transform = "rotate(0deg)";
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: "1rem",
                  marginBottom: "1rem",
                  backgroundColor: "rgba(255,107,107,.2)",
                  border: "1px solid rgba(255,107,107,.4)",
                  borderRadius: "12px",
                  color: "#ff6b6b",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "grid", gap: "1.5rem" }}>
              {/* Nombre y Marca */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: ".5rem", display: "block" }}
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    style={{
                      width: "100%",
                      padding: ".7rem 1rem",
                      borderRadius: "12px",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: ".5rem", display: "block" }}
                  >
                    Marca
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="brand"
                    value={form.brand}
                    onChange={onChange}
                    style={{
                      width: "100%",
                      padding: ".7rem 1rem",
                      borderRadius: "12px",
                      fontSize: "1rem",
                    }}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label
                  className="form-label"
                  style={{ marginBottom: ".5rem", display: "block" }}
                >
                  Descripción
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: ".7rem 1rem",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Precio, Stock y Categoría */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: ".5rem", display: "block" }}
                  >
                    Precio
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={form.price}
                    onChange={onChange}
                    min="0"
                    step="1"
                    required
                    style={{
                      width: "100%",
                      padding: ".7rem 1rem",
                      borderRadius: "12px",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: ".5rem", display: "block" }}
                  >
                    Stock
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="stock_quantity"
                    value={form.stock_quantity}
                    onChange={onChange}
                    min="0"
                    required
                    style={{
                      width: "100%",
                      padding: ".7rem 1rem",
                      borderRadius: "12px",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: ".5rem", display: "block" }}
                  >
                    Categoría
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="category"
                    value={form.category}
                    onChange={onChange}
                    style={{
                      width: "100%",
                      padding: ".7rem 1rem",
                      borderRadius: "12px",
                      fontSize: "1rem",
                    }}
                    placeholder="ej: carcasas"
                  />
                  <small
                    style={{
                      color: "rgba(255,255,255,.6)",
                      fontSize: ".85rem",
                    }}
                  >
                    Se normaliza a minúsculas para coincidir con Xano.
                  </small>
                </div>
              </div>

              {/* Imágenes actuales */}
              {product.image_url && product.image_url.length > 0 && (
                <div>
                  <label
                    className="form-label"
                    style={{ marginBottom: ".8rem", display: "block" }}
                  >
                    Imágenes actuales
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: ".8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {product.image_url.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`${product.name} ${idx + 1}`}
                        style={{
                          width: "90px",
                          height: "90px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          border: "2px solid rgba(255,255,255,.2)",
                          boxShadow: "0 4px 12px rgba(0,0,0,.3)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Subir nuevas imágenes */}
              <div>
                <label
                  className="form-label"
                  style={{ marginBottom: ".5rem", display: "block" }}
                >
                  Agregar nuevas imágenes
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={onFilesChange}
                  style={{
                    width: "100%",
                    padding: ".7rem 1rem",
                    borderRadius: "12px",
                    fontSize: "1rem",
                  }}
                />
                <div
                  style={{
                    marginTop: ".8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    id="keepExisting"
                    checked={keepExisting}
                    onChange={(e) => setKeepExisting(e.target.checked)}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    htmlFor="keepExisting"
                    style={{ margin: 0, cursor: "pointer" }}
                  >
                    Mantener imágenes existentes
                  </label>
                </div>
                <small
                  style={{
                    color: "rgba(255,255,255,.6)",
                    fontSize: ".85rem",
                    display: "block",
                    marginTop: ".4rem",
                  }}
                >
                  {keepExisting
                    ? "Las nuevas imágenes se agregarán a las existentes"
                    : "Las nuevas imágenes reemplazarán las existentes"}
                </small>
              </div>
            </div>

            {/* Footer con botones */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid rgba(255,255,255,.18)",
              }}
            >
              <button
                type="button"
                className="btn-glass"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: ".7rem 1.8rem",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: ".7rem 2rem",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  background: loading
                    ? "rgba(138,43,226,.5)"
                    : "var(--main_color-primary, #8A2BE2)",
                  border: "none",
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all .2s ease",
                  boxShadow: "0 4px 12px rgba(138,43,226,.3)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 16px rgba(138,43,226,.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(138,43,226,.3)";
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(255,255,255,.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                        marginRight: ".5rem",
                        verticalAlign: "middle",
                      }}
                    />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
