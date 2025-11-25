// src/pages/Users.jsx
import { useEffect, useState, useMemo } from "react";
import { fetchUsers, deleteUser, toggleActive, updateRole, updateUser } from "../api/usersApi";

const norm = (v) => String(v || "").trim().toLowerCase();

export default function Users() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  // Filtros
  const [q, setQ] = useState("");
  const [role, setRole] = useState("todos");   
  const [active, setActive] = useState("todos");
  const [workingId, setWorkingId] = useState(null);

  // --- CARGA DE DATOS ---
  async function load() {
    setLoading(true); 
    setErr("");
    console.log("🔄 Iniciando carga de usuarios..."); // LOG 1

    try {
      const response = await fetchUsers();
      console.log("📦 RESPUESTA DEL BACKEND:", response); // LOG 2: Mira esto en la consola (F12)

      // LÓGICA INTELIGENTE PARA ENCONTRAR EL ARRAY
      let dataArray = [];

      if (Array.isArray(response)) {
        // Caso 1: La API devuelve directamente la lista [ ... ]
        dataArray = response;
      } else if (response && Array.isArray(response.items)) {
        // Caso 2: Devuelve { items: [ ... ] } (Paginación estándar)
        dataArray = response.items;
      } else if (response && Array.isArray(response.result)) {
        // Caso 3: Devuelve { result: [ ... ] } (Xano a veces hace esto)
        dataArray = response.result;
      } else if (response && Array.isArray(response.data)) {
         // Caso 4: Axios a veces anida data dentro de data
        dataArray = response.data;
      } else {
        console.warn("⚠️ No encontré un array de usuarios en la respuesta.");
      }

      setItems(dataArray);

    } catch (e) {
      console.error("❌ Error cargando usuarios:", e);
      setErr("Error al cargar usuarios. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // --- FILTROS ---
  const visible = useMemo(() => {
    let list = items;

    if (q) {
      const s = norm(q);
      list = list.filter(u => 
        norm(u.name).includes(s) || norm(u.email).includes(s)
      );
    }
    if (role !== "todos") {
      list = list.filter(u => norm(u.role).includes(norm(role)));
    }
    if (active !== "todos") {
      const wantActive = active === "activos";
      list = list.filter(u => !!u.active === wantActive);
    }
    // Ordenar: nuevos primero (usando ID o created_at)
    return list.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [items, q, role, active]);

  // --- ACCIONES ---
  async function onToggleActive(u) {
    if(!window.confirm(`¿${u.active ? "Desactivar" : "Activar"} a ${u.name}?`)) return;
    setWorkingId(u.id);
    try {
      await toggleActive(u.id, u.active);
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, active: !x.active } : x));
    } catch (error) { alert("Error al cambiar estado"); } 
    finally { setWorkingId(null); }
  }

  async function onChangeRole(u) {
    const newRole = u.role === "admin" ? "cliente" : "admin";
    if(!window.confirm(`¿Cambiar rol de ${u.name} a ${newRole}?`)) return;
    setWorkingId(u.id);
    try {
      await updateRole(u.id, newRole);
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
    } catch (error) { alert("Error al cambiar rol"); } 
    finally { setWorkingId(null); }
  }

  async function onDelete(u) {
    if (!window.confirm(`¿Eliminar a ${u.name}?`)) return;
    setWorkingId(u.id);
    try {
      await deleteUser(u.id);
      setItems(prev => prev.filter(x => x.id !== u.id));
    } catch (error) { alert("Error al eliminar usuario"); } 
    finally { setWorkingId(null); }
  }

  async function onQuickEdit(u) {
    const name = window.prompt("Editar Nombre:", u.name || "");
    if (name === null) return;
    const email = window.prompt("Editar Email:", u.email || "");
    if (email === null) return;

    setWorkingId(u.id);
    try {
      await updateUser(u.id, { name, email });
      setItems(prev => prev.map(x => x.id === u.id ? { ...x, name, email } : x));
    } catch (error) { alert("Error al actualizar"); } 
    finally { setWorkingId(null); }
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white mb-0">Gestión de Usuarios</h2>
        <button className="btn btn-glass" onClick={load} disabled={loading}>
          <i className={`fas fa-sync-alt me-2 ${loading ? "fa-spin" : ""}`}></i>
          Refrescar
        </button>
      </div>

      {/* FILTROS GLASS */}
      <div className="glass mb-4">
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
              <option value="admin">Administradores</option>
              <option value="cliente">Clientes</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={active} onChange={e => setActive(e.target.value)}>
              <option value="todos">Estado: Todos</option>
              <option value="activos">Solo Activos</option>
              <option value="inactivos">Solo Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {err && <div className="alert alert-danger glass border-danger text-danger mb-4">{err}</div>}

      {/* TABLA GLASS */}
      <div className="glass p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No se encontraron usuarios o la lista está vacía.
                  </td>
                </tr>
              )}
              
              {visible.map(u => (
                <tr key={u.id}>
                  <td style={{ width: "80px" }}>
                    <div className="d-flex align-items-center justify-content-center bg-dark rounded-circle text-white fw-bold"
                      style={{ width: 40, height: 40, fontSize: "1.2rem", background: "rgba(255,255,255,0.1)" }}>
                      {(u.name?.[0] || u.email?.[0] || "?").toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold text-white">{u.name || "Sin nombre"}</div>
                    <div className="small text-white-50">{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${String(u.role).includes('admin') ? 'bg-primary' : 'bg-secondary'} bg-opacity-75`}>
                      {u.role || "cliente"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'bg-success' : 'bg-danger'} bg-opacity-75`}>
                      {u.active ? "Activo" : "Suspendido"}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button className="btn btn-sm btn-glass" onClick={() => onQuickEdit(u)} disabled={workingId === u.id}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-sm btn-glass text-warning" onClick={() => onChangeRole(u)} disabled={workingId === u.id}>
                        <i className="fas fa-user-shield"></i>
                      </button>
                      <button className={`btn btn-sm btn-glass ${u.active ? 'text-danger' : 'text-success'}`} onClick={() => onToggleActive(u)} disabled={workingId === u.id}>
                        <i className={`fas ${u.active ? "fa-ban" : "fa-check"}`}></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(u)} disabled={workingId === u.id}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}