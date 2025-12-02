import { useState, useEffect } from "react";
import { updateUser } from "../api/usersApi";

export default function EditUserModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "cliente",
    active: false,
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        role: user.user_type || "cliente",
        active: user.status === "activo",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUser(user.id, {
        name: form.name,
        email: form.email,
        user_type: form.role,
        status: form.active ? "activo" : "suspendido"
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar usuario");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        
        <div className="modal-header">
          <h3>Editar Usuario</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            
            <label>Nombre</label>
            <input 
              className="modal-input" name="name" 
              value={form.name} onChange={handleChange} required 
            />

            <label>Email</label>
            <input 
              type="email" className="modal-input" name="email" 
              value={form.email} onChange={handleChange} required
            />

            <div className="row">
              <div className="col-md-6">
                <label>Rol</label>
                <select 
                  className="modal-input" name="role" 
                  value={form.role} onChange={handleChange}
                >
                  <option value="cliente">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="col-md-6">
                <label>Estado</label>
                <select 
                   className="modal-input" 
                   name="active" 
                   value={form.active ? "true" : "false"}
                   onChange={(e) => setForm(prev => ({...prev, active: e.target.value === "true"}))}
                >
                  <option value="true">Activo</option>
                  <option value="false">Suspendido</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-end">
               <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancelar</button>
               <button type="submit" className="btn btn-primary" disabled={loading}>
                 {loading ? "Guardando..." : "Guardar Cambios"}
               </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}