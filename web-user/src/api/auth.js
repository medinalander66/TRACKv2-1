import apiClient from './client';

export const getGoogleUrl = async (redirectUrl, mode = 'login') => {
  const params = new URLSearchParams();
  if (redirectUrl) params.append('redirect', redirectUrl);
  if (mode) params.append('mode', mode);

  const { data } = await apiClient.get(`/auth/google?${params.toString()}`);
  return data;
};

export const completeGoogleRegistration = async (registrationToken, accountCode) => {
  const { data } = await apiClient.post('/auth/complete-google-registration', {
    registration_token: registrationToken,
    account_code: accountCode
  }, {
    timeout: 15000
  });
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};