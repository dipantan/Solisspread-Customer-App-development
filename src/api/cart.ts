import { api, ApiError, tryRefreshTokens } from './client';
import { getAccessToken } from './tokenStorage';
import type { AddToCartPayload, Cart, UpdateCartItemPayload } from './types';

/**
 * Cart routes accept guests, so older backends answer an expired token with
 * 400 "User ID or Session ID required" instead of 401. Treat that as an
 * expired session: refresh once and retry, otherwise ask the user to log in.
 */
async function withSession<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (e) {
    const staleSession =
      e instanceof ApiError &&
      e.statusCode === 400 &&
      /user id or session id required/i.test(e.message) &&
      Boolean(await getAccessToken());
    if (!staleSession) throw e;
    if (await tryRefreshTokens()) return call();
    throw new ApiError('Session expired. Please log in again.', 401);
  }
}

export async function getCart(sessionId?: string): Promise<Cart> {
  return withSession(() =>
    api.get<Cart>('/ecom/cart', {
      query: sessionId ? { sessionId } : undefined,
    }),
  );
}

export async function clearCart(sessionId?: string): Promise<unknown> {
  return withSession(() =>
    api.delete('/ecom/cart', {
      query: sessionId ? { sessionId } : undefined,
    }),
  );
}

export async function addToCart(payload: AddToCartPayload): Promise<Cart> {
  return withSession(() => api.post<Cart>('/ecom/cart/add', payload));
}

export async function updateCartItem(
  productId: string,
  payload: UpdateCartItemPayload,
): Promise<Cart> {
  return withSession(() => api.patch<Cart>(`/ecom/cart/items/${productId}`, payload));
}

export async function removeCartItem(productId: string, sessionId?: string): Promise<Cart> {
  return withSession(() =>
    api.delete<Cart>(`/ecom/cart/items/${productId}`, {
      query: sessionId ? { sessionId } : undefined,
    }),
  );
}
