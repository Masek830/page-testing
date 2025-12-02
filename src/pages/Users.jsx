import { useEffect, useState, useMemo } from "react";
import { fetchUsers, deleteUser, toggleActive, updateRole, updateUser } from "../api/usersApi";
import EditUserModal from "../components/EditUserModal";

const norm = (v) => String(v || "").trim().toLowerCase();

export default function Users() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [q, setQ] = useState("");
  const [role, setRole] = useState("todos");   
  const [active, setActive] = useState("todos");

  const [editingUser, setEditingUser] = useState(null);

  async function load() {
    setLoading(true); 
    try {
      const response = await fetchUsers();
      
      let dataArray = [];
      if (Array.isArray(response)) dataArray = response;
      else if (response?.items) dataArray = response.items;
      else if (response?.result) dataArray = response.result;
      
      setItems(dataArray);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    let list = items;
    if (q) {
      const s = norm(q);
      list = list.filter(u => norm(u.name).includes(s) || norm(u.email).includes(s));
    }
    if (role !== "todos") list = list.filter(u => norm(u.user_type) === norm(role));
    if (active !== "todos") {
      const wantActive = active === "activos";
      list = list.filter(u => (u.status === 'activo') === wantActive);
    }
    return list.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [items, q, role, active]);

  async function onToggleActive(u) {
    if(!window.confirm(`¿Cambiar estado de ${u.name}?`)) return;
    try {
      const newStatus = u.status === 'activo' ? 'suspendido' : 'activo';
      await toggleActive(u.id, u.status);
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, status: newStatus } : x));
    } catch (error) { alert("Error al cambiar estado"); } 
  }

  async function onChangeRole(u) {
    const newRole = u.user_type === "admin" ? "cliente" : "admin";
    if(!window.confirm(`¿Cambiar rol de ${u.name} a ${newRole}?`)) return;
    try {
      await updateRole(u.id, u.user_type);
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, user_type: newRole } : x));
    } catch (error) { alert("Error al cambiar rol"); } 
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario permanentemente?")) return;
    try {
      await deleteUser(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (error) { alert("Error al eliminar"); }
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white mb-0 fw-bold">Gestión de Usuarios</h2>
        <button className="btn btn-glass" onClick={load} disabled={loading}>
          {loading ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      <div className="glass mb-4 p-3">
        <div className="row g-3">
          <div className="col-md-5">
            <input
              type="text" className="form-control" placeholder="Buscar por nombre o email..."
              value={q} onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="todos">Rol: Todos</option>
              <option value="admin">Administrador</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={active} onChange={e => setActive(e.target.value)}>
              <option value="todos">Estado: Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Suspendidos</option>
            </select>
          </div>
          <div className="col-md-2">
             <button className="btn btn-glass w-100" onClick={() => {setQ(""); setRole("todos"); setActive("todos")}}>
               Limpiar
             </button>
          </div>
        </div>
      </div>

      <div className="table-responsive" style={{ overflowX: "auto" }}>
        <table className="table-glass">
          <thead>
            <tr>
              <th style={{width: '80px'}}>Avatar</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && !loading && (
              <tr><td colSpan="6" className="text-center py-5 text-muted">No se encontraron usuarios.</td></tr>
            )}
            
            {visible.map(u => (
              <tr key={u.id}>
                <td>
                  <div 
                    className="d-flex align-items-center justify-content-center fw-bold text-white"
                    style={{ 
                      width: 45, height: 45, 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      fontSize: "1.1rem",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.2)"
                    }}
                  >
                    {(u.name?.[0] || u.email?.[0] || "?").toUpperCase()}
                  </div>
                </td>
                
                <td className="fw-bold">{u.name || "Sin nombre"}</td>
                <td className="text-white-50">{u.email}</td>

                <td>
                  <span className={`badge ${u.user_type === 'admin' ? 'bg-primary' : 'bg-secondary'} bg-opacity-75`} style={{fontSize: '0.8rem', padding: '6px 10px'}}>
                    {u.user_type || "cliente"}
                  </span>
                </td>

                <td>
                   <span className={`badge ${u.status === 'activo' ? 'bg-success' : 'bg-danger'} bg-opacity-75`} style={{fontSize: '0.8rem', padding: '6px 10px'}}>
                    {u.status || "suspendido"}
                  </span>
                </td>

                <td className="text-end">
                  <button 
                    className="btn-action-glass" 
                    onClick={() => setEditingUser(u)}
                    title="Editar usuario"
                  >
                    <i className="fas fa-pen" style={{ fontSize: '0.8rem' }}></i>
                  </button>

                  <button 
                    className="btn-action-glass btn-action-delete"
                    onClick={() => handleDelete(u.id)}
                    title="Eliminar usuario"
                  >
                    <i className="fas fa-trash" style={{ fontSize: '0.8rem' }}></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onSuccess={load} 
        />
      )}
    </div>
  );
}