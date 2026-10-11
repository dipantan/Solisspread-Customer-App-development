import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AppStep =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'otp'
  | 'profile'
  | 'success'
  | 'home'
  | 'shop'
  | 'search'
  | 'filter'
  | 'categories'
  | 'packages'
  | 'products'
  | 'productDetails'
  | 'cart'
  | 'checkout'
  | 'paymentReview'
  | 'orderHistory'
  | 'trackOrder'
  | 'orderDetails'
  | 'amc'
  | 'buy_amc'
  | 'request_service'
  | 'service_request_list'
  | 'service_request_details'
  | 'amc_request_status'
  | 'amc_details'
  | 'solar_calculator'
  | 'saved_addresses'
  | 'support_tickets'
  | 'create_ticket'
  | 'ticket_details'
  | 'help_center'
  | 'faqs'
  | 'edit_profile'
  | 'change_password'
  | 'security'
  | 'about_us'
  | 'terms'
  | 'privacy'
  | 'delete_account'
  | 'privacy_center'
  | 'request_data'
  | 'consent_management'
  | 'grievance_redressal'
  | 'deactivate_account'
  | 'refer_earn'
  | 'referral_history';

const SESSION_KEY = '@app_session_step';

interface NavigationState {
  currentStep: AppStep;
  previousStep: AppStep;
  initialRoute: AppStep;
  showExitModal: boolean;
  navParams: any;
  /** Last params per step, so returning to a screen via "back" keeps its context. */
  paramsByStep: Partial<Record<AppStep, any>>;
  setCurrentStep: (step: AppStep) => void;
  navigate: (step: AppStep, params?: any) => void;
  setShowExitModal: (visible: boolean) => void;
  setInitialRoute: (step: AppStep) => void;
  loadSession: () => Promise<void>;
  persistSession: (step: AppStep) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentStep: 'splash',
  previousStep: 'home',
  initialRoute: 'onboarding',
  showExitModal: false,
  navParams: null,
  paramsByStep: {},
  setCurrentStep: (step) => {
    set({
      previousStep: get().currentStep,
      currentStep: step,
      navParams: get().paramsByStep[step] ?? null,
    });
    void get().persistSession(step);
  },
  navigate: (step, params) => {
    const resolved = params ?? get().paramsByStep[step] ?? null;
    set({
      previousStep: get().currentStep,
      currentStep: step,
      navParams: resolved,
      paramsByStep: params ? { ...get().paramsByStep, [step]: params } : get().paramsByStep,
    });
    void get().persistSession(step);
  },
  setShowExitModal: (visible) => set({ showExitModal: visible }),
  setInitialRoute: (step) => set({ initialRoute: step }),
  loadSession: async () => {
    try {
      const savedStep = (await AsyncStorage.getItem(SESSION_KEY)) as AppStep | null;
      if (savedStep === 'profile' || savedStep === 'home') {
        set({ initialRoute: savedStep });
      } else {
        set({ initialRoute: 'onboarding' });
      }
    } catch {
      set({ initialRoute: 'onboarding' });
    }
  },
  persistSession: async (step) => {
    try {
      if (step === 'profile' || step === 'home') {
        await AsyncStorage.setItem(SESSION_KEY, step);
      }
    } catch {
      // ignore persistence failures
    }
  },
  clearSession: async () => {
    set({ paramsByStep: {}, navParams: null });
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore persistence failures
    }
  },
}));
