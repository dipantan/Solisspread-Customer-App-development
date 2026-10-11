import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthTokens, UserSummary } from './types';

const KEYS = {
  accessToken: '@solis/accessToken',
  refreshToken: '@solis/refreshToken',
  user: '@solis/user',
} as const;

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.refreshToken);
}

export async function getStoredUser(): Promise<UserSummary | null> {
  const raw = await AsyncStorage.getItem(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSummary;
  } catch {
    return null;
  }
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.accessToken, tokens.accessToken],
    [KEYS.refreshToken, tokens.refreshToken],
    [KEYS.user, JSON.stringify(tokens.user)],
  ]);
}

export async function saveUser(user: UserSummary): Promise<void> {
  await AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
}

export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.accessToken, KEYS.refreshToken, KEYS.user]);
}

export async function hasAuthTokens(): Promise<boolean> {
  const access = await getAccessToken();
  return Boolean(access);
}
