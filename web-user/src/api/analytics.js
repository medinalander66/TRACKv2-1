import apiClient from './client';

export const getCampusOfficeStats = async (range = 30) => {
  const { data } = await apiClient.get('/analytics/campus-office-stats', { params: { range } });
  return data;
};

export const getDepartmentOfficePerformance = async (range = 30) => {
  const { data } = await apiClient.get('/analytics/department-performance', { params: { range } });
  return data;
};

export const getConflictForecast = async (venueId, days = 7) => {
  const { data } = await apiClient.get('/analytics/conflict-forecast', {
    params: { venue_id: venueId, days },
  });
  return data;
};

export const getVenuePie = async (range = 30) => {
  const { data } = await apiClient.get('/analytics/venue-pie', { params: { range } });
  return data;
};

export const getSchedulingConflicts = async (range = 30) => {
  const { data } = await apiClient.get('/analytics/scheduling-conflicts', { params: { range } });
  return data;
};

export const getPersonalEvents = async (range = 30) => {
  const { data } = await apiClient.get('/analytics/personal-events', { params: { range } });
  return data;
};

export const getTaskStats = async (range = 30) => {
  const { data } = await apiClient.get('/analytics/task-stats', { params: { range } });
  return data;
};