import apiClient from './client';

export const getGoogleUrl = async (redirectUrl, mode = 'login') => {
  const params = {};
  if (redirectUrl) params.redirect = redirectUrl;
  if (mode) params.mode = mode; // 'login' or 'request'
  
  const { data } = await apiClient.get('/auth/google', { params });
  return data;
};

export const completeGoogleRegistration = async (registrationToken, accountCode) => {
  const { data } = await apiClient.post('/auth/complete-google-registration', {
    registration_token: registrationToken,
    account_code: accountCode
  }, {
    timeout: 15000   // 15 seconds timeout
  });
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};