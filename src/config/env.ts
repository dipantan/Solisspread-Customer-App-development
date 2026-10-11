/**
 * App environment / API configuration.
 * Override at build time with EXPO_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.solisspread.in/api/v1';

export const API_TIMEOUT_MS = 30_000;
