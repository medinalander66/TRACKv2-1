import apiClient from './client';

export const getTasks = async (params = {}) => {
  const { data } = await apiClient.get('/tasks', { params });
  return data;
};

export const getTaskById = async (id) => {
  const { data } = await apiClient.get(`/tasks/${id}`);
  return data;
};

export const createTask = async (payload) => {
  const { data } = await apiClient.post('/tasks', payload);
  return data;
};

export const updateTask = async (id, payload) => {
  const { data } = await apiClient.put(`/tasks/${id}`, payload);
  return data;
};

export const deleteTask = async (id) => {
  const { data } = await apiClient.delete(`/tasks/${id}`);
  return data;
};

export const respondToTask = async (taskId, response) => {
  const { data } = await apiClient.put(`/tasks/${taskId}/respond`, { response });
  return data;
};

export const toggleChecklistItem = async (itemId, payload) => {
  const { data } = await apiClient.put(`/tasks/checklist/${itemId}`, payload);
  return data;
};

export const addChecklistComment = async (itemId, commentText) => {
  const { data } = await apiClient.post(`/tasks/checklist/${itemId}/comments`, {
    comment_text: commentText,
  });
  return data;
};

export const getInvitedTasks = async (params = {}) => {
  const { data } = await apiClient.get('/tasks/invited', { params });
  return data;
};