import { api } from './client';
import { clearAuthTokens, saveAuthTokens } from './tokenStorage';
import type {
  AuthTokens,
  LoginPayload,
  OtpDispatchResponse,
  OtpVerifyResponse,
  RegisterPayload,
  RegisterResult,
  RegistrationStatus,
  SendOtpPayload,
  VerifyOtpPayload,
} from './types';

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  return api.post<RegisterResult>('/auth/register', { role: 'CUSTOMER', ...payload }, { auth: false });
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const tokens = await api.post<AuthTokens>('/auth/login', payload, { auth: false });
  await saveAuthTokens(tokens);
  return tokens;
}

export async function sendOtp(payload: SendOtpPayload): Promise<OtpDispatchResponse> {
  return api.post<OtpDispatchResponse>('/auth/otp/send', payload, { auth: false });
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<OtpVerifyResponse> {
  const result = await api.post<OtpVerifyResponse>('/auth/otp/verify', payload, { auth: false });
  if (result.accessToken && result.refreshToken && result.user) {
    await saveAuthTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }
  return result;
}

export async function refreshSession(refreshToken: string): Promise<AuthTokens> {
  const tokens = await api.post<AuthTokens>(
    '/auth/refresh',
    { refreshToken },
    { auth: false, skipRefresh: true },
  );
  await saveAuthTokens(tokens);
  return tokens;
}

export async function getRegistrationStatus(identifier: string): Promise<RegistrationStatus> {
  return api.get<RegistrationStatus>('/auth/registration-status', {
    auth: false,
    query: { identifier },
  });
}

export async function submitVerification(payload?: Record<string, unknown>): Promise<unknown> {
  return api.post('/auth/submit-verification', payload ?? {});
}

export async function logout(): Promise<void> {
  await clearAuthTokens();
}
