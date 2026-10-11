import { create } from 'zustand';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import { getStoredUser } from '../api/tokenStorage';
import * as usersApi from '../api/users';
import { useCartStore } from './useCartStore';
import type { OtpPurpose, UserSummary } from '../api/types';
import { canonicalIdentifier, isAlreadyRegisteredMessage } from '../utils/phone';

export type CustomerType = 'Residential' | 'Commercial' | 'Industrial';

export interface RegistrationDraft {
  fullName: string;
  email: string;
  phoneNumber: string;
  customerType: CustomerType | null;
}

interface AuthFlow {
  identifier: string;
  purpose: OtpPurpose;
}

type AuthNext = 'otp' | 'login' | 'profile' | 'home';

interface AuthState {
  user: UserSummary | null;
  authFlow: AuthFlow | null;
  draft: RegistrationDraft;
  loginPrefill: string;
  notice: string | null;
  setNotice: (notice: string | null) => void;
  setDraft: (partial: Partial<RegistrationDraft>) => void;
  setLoginPrefill: (value: string) => void;
  hydrateUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  registerCustomer: (input: {
    fullName: string;
    email?: string;
    phone: string;
    password: string;
    customerType: CustomerType | null;
  }) => Promise<AuthNext>;
  loginWithPassword: (identifier: string, password: string) => Promise<AuthNext>;
  requestLoginOtp: (identifier: string) => Promise<void>;
  verifyCurrentOtp: (otpCode: string) => Promise<AuthNext>;
  resendCurrentOtp: () => Promise<void>;
  submitProfile: (input: {
    address: string;
    city: string;
    state: string;
    pinCode: string;
  }) => Promise<void>;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function continueUnverified(identifier: string): Promise<void> {
  await authApi.sendOtp({ identifier, purpose: 'REGISTRATION' });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  authFlow: null,
  draft: {
    fullName: '',
    email: '',
    phoneNumber: '',
    customerType: null,
  },
  loginPrefill: '',
  notice: null,
  setNotice: (notice) => set({ notice }),
  setDraft: (partial) => set({ draft: { ...get().draft, ...partial } }),
  setLoginPrefill: (value) => set({ loginPrefill: value }),
  hydrateUser: async () => {
    const user = await getStoredUser();
    if (user) set({ user });
  },
  refreshUser: async () => {
    const stored = await getStoredUser();
    if (stored) set({ user: stored });
    try {
      const user = await usersApi.getMe();
      set({ user });
    } catch {
      // keep the stored user when offline or the session is being refreshed
    }
  },
  logout: async () => {
    await authApi.logout();
    useCartStore.getState().reset();
    set({
      user: null,
      authFlow: null,
      draft: { fullName: '', email: '', phoneNumber: '', customerType: null },
      loginPrefill: '',
      notice: null,
    });
  },
  registerCustomer: async (input) => {
    const phoneNumber = canonicalIdentifier(input.phone);
    const email = input.email?.trim().toLowerCase() || undefined;
    set({
      draft: {
        fullName: input.fullName.trim(),
        email: email ?? '',
        phoneNumber,
        customerType: input.customerType,
      },
      notice: null,
    });

    const openOtp = (message?: string) => {
      set({
        authFlow: { identifier: phoneNumber, purpose: 'REGISTRATION' },
        notice: message ?? null,
      });
      return 'otp' as const;
    };

    try {
      const result = await authApi.register({
        fullName: input.fullName.trim(),
        phoneNumber,
        email,
        password: input.password,
        role: 'CUSTOMER',
      });
      if (result.user) set({ user: result.user });
      return openOtp(result.resumed ? result.message : undefined);
    } catch (error) {
      const message = errorMessage(error, 'Registration failed');
      if (!isAlreadyRegisteredMessage(message)) throw error;

      const status = await authApi.getRegistrationStatus(phoneNumber);
      if (status.status === 'NOT_FOUND') throw error;

      if (!status.phoneVerified && status.status === 'PENDING_VERIFICATION') {
        await continueUnverified(phoneNumber);
        return openOtp('Continue verifying this mobile number.');
      }

      set({
        loginPrefill: phoneNumber,
        notice: status.canLogin
          ? 'This mobile number is already registered. Please log in.'
          : status.message || 'This mobile number is already registered. Please log in.',
      });
      return 'login';
    }
  },
  loginWithPassword: async (identifier, password) => {
    const canonical = canonicalIdentifier(identifier);
    set({ notice: null });
    try {
      const tokens = await authApi.login({ identifier: canonical, password });
      set({ user: tokens.user, loginPrefill: canonical });
      return tokens.user.status === 'PENDING_VERIFICATION' ? 'profile' : 'home';
    } catch (error) {
      const message = errorMessage(error, 'Login failed');
      if (message.toLowerCase().includes('continue with otp')) {
        await continueUnverified(canonical);
        set({
          authFlow: { identifier: canonical, purpose: 'REGISTRATION' },
          loginPrefill: canonical,
          draft: { ...get().draft, phoneNumber: canonical },
        });
        return 'otp';
      }
      throw error;
    }
  },
  requestLoginOtp: async (identifier) => {
    const canonical = canonicalIdentifier(identifier);
    await authApi.sendOtp({ identifier: canonical, purpose: 'LOGIN' });
    set({
      authFlow: { identifier: canonical, purpose: 'LOGIN' },
      loginPrefill: canonical,
      notice: null,
    });
  },
  verifyCurrentOtp: async (otpCode) => {
    const flow = get().authFlow;
    if (!flow?.identifier) {
      throw new Error('Missing mobile number. Please go back and try again.');
    }
    const result = await authApi.verifyOtp({
      identifier: flow.identifier,
      otpCode,
      purpose: flow.purpose,
    });
    if (result.user) set({ user: result.user });
    if (flow.purpose === 'REGISTRATION' || result.user?.status === 'PENDING_VERIFICATION') {
      return 'profile';
    }
    return 'home';
  },
  resendCurrentOtp: async () => {
    const flow = get().authFlow;
    if (!flow?.identifier) return;
    await authApi.sendOtp({ identifier: flow.identifier, purpose: flow.purpose });
  },
  submitProfile: async (input) => {
    const { draft, user } = get();
    await authApi.submitVerification({
      identifier: draft.phoneNumber || user?.phoneNumber,
      address: input.address,
      city: input.city,
      state: input.state,
      pinCode: input.pinCode,
      customerType: draft.customerType || 'Residential',
    });
  },
}));
