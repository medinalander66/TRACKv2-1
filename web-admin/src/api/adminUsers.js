import apiClient from "./client";

export const getAllUsers = async (search = "") => {
  const { data } = await apiClient.get("/admin/users", {
    params: search ? { search } : {},
  });
  return data;
};