import http from "../lib/miniAxios"; 

export async function fetchUsers() {
  const { data } = await http.get("/GET_USERS");
  return data;
}

export async function deleteUser(id) {
  const { data } = await http.delete(`/delete_user/${id}`);
  return data;
}

export async function updateUser(id, patch) {
  const payload = { 
    ...patch, 
    user_id: id, 
    id: id 
  };

  const { data } = await http.patch("/user/update", payload);
  return data;
}

export async function toggleActive(id, currentStatus) {
  const newStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
  return updateUser(id, { status: newStatus });
}

export async function updateRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'cliente' : 'admin';
  return updateUser(id, { user_type: newRole }); 
}