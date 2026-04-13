import client from './client';

export const authAPI = {
  // Login with email and password
  // Returns either:
  // - {access_token, refresh_token, user, expires_in} if success
  // - {two_factor_required, two_factor_token, user} if 2FA needed
  login: async (email, password, twoFactorToken = null, totpCode = null, recoveryCode = null) => {
    const body = { email, password };
    if (twoFactorToken) body.two_factor_token = twoFactorToken;
    if (totpCode) body.totp_code = totpCode;
    if (recoveryCode) body.recovery_code = recoveryCode;

    const response = await client.post('/v1/auth/login', body);
    return response.data;
  },

  // Register new user
  // Same response structure as login
  register: async (name, email, password) => {
    const response = await client.post('/v1/auth/register', { name, email, password });
    return response.data;
  },

  // Verify 2FA code during login (alternative flow, not used - we use login() with totp_code)
  verify2FA: async (code) => {
    const response = await client.post('/v1/auth/2fa/verify', { code });
    return response.data;
  },

  // Refresh access token
  refresh: async (refresh_token) => {
    const response = await client.post('/v1/auth/refresh', { refresh_token });
    return response.data;
  },

  // Logout (revoke current session)
  logout: async () => {
    const response = await client.post('/v1/auth/logout');
    return response.data;
  },

  // Get list of active sessions
  getSessions: async () => {
    const response = await client.get('/v1/auth/sessions');
    return response.data;
  },

  // Revoke a specific session
  revokeSession: async (session_id) => {
    const response = await client.post(`/v1/auth/sessions/${session_id}/revoke`);
    return response.data;
  },

  // Setup 2FA (returns QR code)
  setup2FA: async () => {
    const response = await client.post('/v1/auth/2fa/setup');
    return response.data;
  },

  // Confirm 2FA setup with verification code
  confirm2FA: async (code) => {
    const response = await client.post('/v1/auth/2fa/confirm', { code });
    return response.data;
  },

  // Disable 2FA
  disable2FA: async () => {
    const response = await client.post('/v1/auth/2fa/disable');
    return response.data;
  },

  // Get recovery codes
  getRecoveryCodes: async () => {
    const response = await client.get('/v1/auth/2fa/recovery-codes');
    return response.data;
  },
};
