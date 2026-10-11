import { api, ApiError } from './client';
import { saveUser } from './tokenStorage';
import type {
  Address,
  ChangePasswordPayload,
  CreateAddressPayload,
  UpdateProfilePayload,
  UserSummary,
} from './types';

export async function getMe(): Promise<UserSummary> {
  const user = await api.get<UserSummary>('/users/me');
  await saveUser(user);
  return user;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserSummary> {
  const user = await api.patch<UserSummary>('/users/profile', payload);
  await saveUser(user);
  return user;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<unknown> {
  return api.post('/users/me/change-password', payload);
}

export async function listAddresses(): Promise<Address[]> {
  const data = await api.get<Address[] | { items?: Address[] }>('/users/addresses');
  return Array.isArray(data) ? data : data?.items ?? [];
}

const sameAddress = (a: Pick<Address, 'address' | 'pinCode'>, b: Pick<Address, 'address' | 'pinCode'>) =>
  a.pinCode === b.pinCode &&
  a.address.trim().toLowerCase().replace(/\s+/g, ' ') === b.address.trim().toLowerCase().replace(/\s+/g, ' ');

/** Older backends lack the address-book routes and answer "Cannot PATCH …" with 404. */
const isMissingRoute = (e: unknown) =>
  e instanceof ApiError && e.statusCode === 404 && /cannot (patch|delete|put)/i.test(e.message);

export async function createAddress(payload: CreateAddressPayload): Promise<Address> {
  const data = await api.post<Address | Address[]>('/users/addresses', payload);
  if (!Array.isArray(data)) return data;
  const stored = data.find((a) => sameAddress(a, payload));
  if (stored) return stored;
  throw new ApiError('The address was not saved. Please try again.', 0);
}

export async function updateAddress(id: string, payload: CreateAddressPayload): Promise<Address> {
  try {
    return await api.patch<Address>(`/users/addresses/${id}`, payload);
  } catch (e) {
    if (!isMissingRoute(e)) throw e;
    return createAddress({ ...payload, isDefault: true });
  }
}

export async function setDefaultAddress(address: Address): Promise<Address> {
  try {
    return await api.patch<Address>(`/users/addresses/${address.id}/default`);
  } catch (e) {
    if (!isMissingRoute(e)) throw e;
    const { id: _id, isDefault: _d, local: _l, ...rest } = address;
    return createAddress({ ...(rest as CreateAddressPayload), isDefault: true });
  }
}

export async function deleteAddress(id: string): Promise<unknown> {
  try {
    return await api.delete(`/users/addresses/${id}`);
  } catch (e) {
    if (!isMissingRoute(e)) throw e;
    throw new ApiError('Deleting addresses is not available yet. Please try again after the next update.', 404);
  }
}

export function formatAddressLine(a: Pick<Address, 'address' | 'city' | 'state' | 'pinCode'>): string {
  return [a.address, a.city, a.state].filter(Boolean).join(', ') + (a.pinCode ? ` - ${a.pinCode}` : '');
}
