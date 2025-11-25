import http from "../lib/miniAxios"; 

// 1. OBTENER USUARIOS
export async function fetchUsers() {
  // CORRECCIÓN: Usamos exactamente el endpoint que me pasaste
  const { data } = await http.get("/GET_USERS");
  return data;
}

// 2. BORRAR USUARIO
export async function deleteUser(id) {
  // Según tus fotos de Xano, el endpoint es "delete_user"
  const { data } = await http.delete(`/delete_user/${id}`);
  return data;
}

// 3. ACTUALIZAR USUARIO (Para editar, cambiar rol o estado)
export async function updateUser(id, patch) {
  // Según tus fotos, el endpoint de edición es "user/update"
  // Nota: Asegúrate de que este endpoint reciba el ID en la URL (user/update/1)
  const { data } = await http.patch(`/user/update/${id}`, patch);
  return data;
}

// Helpers (Reutilizan la función de actualizar)
export async function toggleActive(id, currentActiveState) {
  // Enviamos el estado contrario. 
  // OJO: Si tu base de datos usa texto ("activo"/"suspendido"), cambia true/false por los textos.
  return updateUser(id, { active: !currentActiveState });
}

export async function updateRole(id, newRole) {
  return updateUser(id, { role: newRole }); 
}