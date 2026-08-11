import apiClient from "./client";

export const getChangeRequests = async (status = "pending") => {
  const { data } = await apiClient.get("/admin/profile-change-requests", {
    params: { status },
  });
  return data;
};

export const approveChangeRequest = async (id) => {
  const { data } = await apiClient.put(`/admin/profile-change-requests/${id}/approve`);
  return data;
};

export const rejectChangeRequest = async (id, reason = "") => {
  const { data } = await apiClient.put(`/admin/profile-change-requests/${id}/reject`, { reason });
  return data;
};