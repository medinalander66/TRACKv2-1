import apiClient from './client';

export const getDepartments = async () => {
  const { data } = await apiClient.get('/lookups/departments');
  return data;
};

export const getOffices = async () => {
  const { data } = await apiClient.get('/lookups/offices');
  return data;
};

export const getRoles = async () => {
  const { data } = await apiClient.get('/lookups/roles');
  return data;
};

export const getPositions = async () => {
  const { data } = await apiClient.get('/lookups/positions');
  return data;
};

export const getDomains = async () => {
  const { data } = await apiClient.get('/lookups/domains');
  return data;
};