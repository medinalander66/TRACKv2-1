import apiClient from "./client";

export const getAllUsers = async (search = "") => {
  const { data } = await apiClient.get("/admin/users", {
    params: search ? { search } : {},
  });
  return data;
};

export const toggleBlockUser = async (id) => {
  const { data } = await apiClient.put(`/admin/users/${id}/toggle-block`);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await apiClient.delete(`/admin/users/${id}`);
  return data;
};