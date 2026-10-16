import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/screens/auth/SplashScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import CompleteProfileScreen from './src/screens/auth/CompleteProfileScreen';
import ProfileSuccessScreen from './src/screens/auth/ProfileSuccessScreen';
import HomeScreen from './src/screens/core/HomeScreen';
import ShopScreen from './src/screens/e-commerce/ShopScreen';
import SearchScreen from './src/screens/core/SearchScreen';
import FilterScreen from './src/screens/core/FilterScreen';
import CategoriesScreen from './src/screens/e-commerce/CategoriesScreen';
import PackagesScreen from './src/screens/e-commerce/PackagesScreen';
import ProductsScreen from './src/screens/e-commerce/ProductsScreen';
import ProductDetailsScreen from './src/screens/e-commerce/ProductDetailsScreen';
import CartScreen from './src/screens/e-commerce/CartScreen';
import CheckoutScreen from './src/screens/e-commerce/CheckoutScreen';
import PaymentReviewScreen from './src/screens/e-commerce/PaymentReviewScreen';
import OrderHistoryScreen from './src/screens/e-commerce/OrderHistoryScreen';
import TrackOrderScreen from './src/screens/e-commerce/TrackOrderScreen';
import OrderDetailsScreen from './src/screens/e-commerce/OrderDetailsScreen';
import AmcScreen from './src/screens/amc-services/AmcScreen';
import BuyAmcScreen from './src/screens/amc-services/BuyAmcScreen';
import RequestServiceScreen from './src/screens/amc-services/RequestServiceScreen';
import ServiceRequestListScreen from './src/screens/amc-services/ServiceRequestListScreen';
import ServiceRequestDetailsScreen from './src/screens/amc-services/ServiceRequestDetailsScreen';
import AmcRequestStatusScreen from './src/screens/amc-services/AmcRequestStatusScreen';
import AmcDetailsScreen from './src/screens/amc-services/AmcDetailsScreen';
import SolarCalculatorScreen from './src/screens/core/SolarCalculatorScreen';
import SavedAddressesScreen from './src/screens/profile/SavedAddressesScreen';
import SupportTicketsScreen from './src/screens/support/SupportTicketsScreen';
import CreateTicketScreen from './src/screens/support/CreateTicketScreen';
import TicketDetailsScreen from './src/screens/support/TicketDetailsScreen';
import HelpCenterScreen from './src/screens/support/HelpCenterScreen';
import FaqsScreen from './src/screens/support/FaqsScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import ChangePasswordScreen from './src/screens/auth/ChangePasswordScreen';
import SecurityScreen from './src/screens/profile/SecurityScreen';
import AboutUsScreen from './src/screens/legal/AboutUsScreen';
import TermsScreen from './src/screens/legal/TermsScreen';
import PrivacyPolicyScreen from './src/screens/legal/PrivacyPolicyScreen';
import DeleteAccountScreen from './src/screens/profile/DeleteAccountScreen';
import PrivacyCenterScreen from './src/screens/profile/PrivacyCenterScreen';
import RequestDataScreen from './src/screens/profile/RequestDataScreen';
import ConsentManagementScreen from './src/screens/profile/ConsentManagementScreen';
import GrievanceRedressalScreen from './src/screens/support/GrievanceRedressalScreen';
import DeactivateAccountScreen from './src/screens/profile/DeactivateAccountScreen';
import ReferAndEarnScreen from './src/screens/referral/ReferAndEarnScreen';
import ReferralHistoryScreen from './src/screens/referral/ReferralHistoryScreen';
import { ExitConfirmationModal } from './src/components/common/ExitConfirmationModal';
import AppAlertHost from './src/components/common/AppAlertHost';
import { useNavigationStore } from './src/store/useNavigationStore';
import { useAuthStore } from './src/store/useAuthStore';

import Animated, { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { MOTION } from './src/constants/motion';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated 4 strict mode false suppresses transform layout animation warnings
});

type StepType = 'splash' | 'onboarding' | 'login' | 'register' | 'otp' | 'profile' | 'success' | 'home' | 'shop' | 'search' | 'filter' | 'categories' | 'packages' | 'products' | 'productDetails' | 'cart' | 'checkout' | 'paymentReview' | 'orderHistory' | 'trackOrder' | 'orderDetails' | 'amc' | 'buy_amc' | 'request_service' | 'service_request_list' | 'service_request_details' | 'amc_request_status' | 'amc_details' | 'solar_calculator' | 'saved_addresses' | 'support_tickets' | 'create_ticket' | 'ticket_details' | 'help_center' | 'faqs' | 'edit_profile' | 'change_password' | 'security' | 'about_us' | 'terms' | 'privacy' | 'delete_account' | 'privacy_center' | 'request_data' | 'consent_management' | 'grievance_redressal' | 'deactivate_account' | 'refer_earn' | 'referral_history';

LogBox.ignoreLogs([
  'Property "transform" of AnimatedComponent',
  '[Reanimated] Property "transform" of AnimatedComponent'
]);

export default function App() {
  const currentStep = useNavigationStore((s) => s.currentStep);
  const previousStep = useNavigationStore((s) => s.previousStep);
  const initialRoute = useNavigationStore((s) => s.initialRoute);
  const showExitModal = useNavigationStore((s) => s.showExitModal);
  const navParams = useNavigationStore((s) => s.navParams);
  const setCurrentStep = useNavigationStore((s) => s.setCurrentStep);
  const setShowExitModal = useNavigationStore((s) => s.setShowExitModal);
  const loadSession = useNavigationStore((s) => s.loadSession);
  const authFlow = useAuthStore((s) => s.authFlow);
  const hydrateUser = useAuthStore((s) => s.hydrateUser);

  useEffect(() => {
    loadSession();
    hydrateUser();
  }, [loadSession, hydrateUser]);

  // Global BackHandler for non-screen specific blocks
  useEffect(() => {
    const backAction = () => {
      if (['login', 'profile', 'success', 'home', 'shop', 'amc'].includes(currentStep)) {
        setShowExitModal(true);
        return true;
      }
      return false; // let the screen's back handler handle it if it exists
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentStep]);

  const handleNavigate = (step: StepType, params?: any) => {
    useNavigationStore.getState().navigate(step, params);
  };

  const handleBack = () => {
    useNavigationStore.getState().goBack();
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.container}>
        {currentStep === 'splash' && (
          <SplashScreen
          onFinish={() => setCurrentStep(initialRoute)}
          onAuthenticated={() => setCurrentStep('home')}
        />
        )}
        {currentStep === 'onboarding' && (
          <OnboardingScreen
            onNext={() => setCurrentStep('login')}
            onSkip={() => setCurrentStep('login')}
            onRequestExit={() => setShowExitModal(true)}
          />
        )}
        {currentStep === 'login' && (
          <LoginScreen
            onLogin={() => setCurrentStep('home')}
            onRegister={() => setCurrentStep('register')}
            onNeedOtp={() => setCurrentStep('otp')}
          />
        )}
        {currentStep === 'register' && (
          <RegisterScreen
            onRegisterSuccess={() => setCurrentStep('otp')}
            onLogin={() => setCurrentStep('login')}
          />
        )}
        {currentStep === 'otp' && (
          <OTPScreen
            identifier={authFlow?.identifier}
            purpose={(authFlow?.purpose as any) || 'LOGIN'}
            onVerify={() => {
              const purpose = useAuthStore.getState().authFlow?.purpose;
              const status = useAuthStore.getState().user?.status;
              setCurrentStep(purpose === 'LOGIN' && status !== 'PENDING_VERIFICATION' ? 'home' : 'profile');
            }}
            onBack={() => setCurrentStep(authFlow?.purpose === 'LOGIN' ? 'login' : 'register')}
            onEditDetails={() => setCurrentStep(authFlow?.purpose === 'LOGIN' ? 'login' : 'register')}
          />
        )}
        {currentStep === 'profile' && (
          <CompleteProfileScreen
            onSave={() => setCurrentStep('success')}
            onBack={() => setShowExitModal(true)}
          />
        )}
        {currentStep === 'success' && (
          <ProfileSuccessScreen onGoHome={() => setCurrentStep('home')} />
        )}
        {currentStep === 'home' && (
          <Animated.View entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft} style={StyleSheet.absoluteFill}>
            <HomeScreen onNavigate={handleNavigate} />
          </Animated.View>
        )}
        {currentStep === 'shop' && (
          <Animated.View entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft} style={StyleSheet.absoluteFill}>
            <ShopScreen onNavigate={handleNavigate} />
          </Animated.View>
        )}
        {currentStep === 'search' && (
          <Animated.View entering={MOTION.modalSlideUp} exiting={MOTION.modalSlideDown} style={styles.absoluteFill}>
            <SearchScreen onBack={handleBack} />
          </Animated.View>
        )}
        {currentStep === 'filter' && (
          <Animated.View entering={MOTION.modalSlideUp} exiting={MOTION.modalSlideDown} style={styles.absoluteFill}>
            <FilterScreen onBack={handleBack} onApply={handleBack} />
          </Animated.View>
        )}
        {currentStep === 'categories' && (
          <Animated.View entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft} style={styles.absoluteFill}>
            <CategoriesScreen onBack={handleBack} onNavigate={handleNavigate} />
          </Animated.View>
        )}
        {currentStep === 'packages' && (
          <Animated.View entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft} style={styles.absoluteFill}>
            <PackagesScreen onBack={handleBack} onNavigate={handleNavigate} />
          </Animated.View>
        )}
        {currentStep === 'products' && (
          <Animated.View entering={MOTION.modalSlideUp} exiting={MOTION.modalSlideDown} style={styles.absoluteFill}>
            <ProductsScreen onBack={handleBack} onNavigate={handleNavigate} brand={navParams?.brand ?? undefined} />
          </Animated.View>
        )}
        {currentStep === 'productDetails' && (
          <Animated.View entering={MOTION.modalSlideUp} exiting={MOTION.modalSlideDown} style={styles.absoluteFill}>
            <ProductDetailsScreen onBack={handleBack} onNavigate={handleNavigate} type={navParams?.type || 'product'} productId={navParams?.id || navParams?.productId} />
          </Animated.View>
        )}
        {currentStep === 'cart' && (
          <Animated.View entering={MOTION.modalSlideUp} exiting={MOTION.modalSlideDown} style={styles.absoluteFill}>
            <CartScreen onBack={handleBack} onNavigate={handleNavigate} />
          </Animated.View>
        )}
        {currentStep === 'checkout' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <CheckoutScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'paymentReview' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <PaymentReviewScreen
              onBack={() => handleNavigate('home')}
              onNavigate={handleNavigate}
              status={navParams?.status || 'success'}
              orderId={navParams?.orderId}
              message={navParams?.message}
            />
          </Animated.View>
        )}
        {currentStep === 'orderHistory' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <OrderHistoryScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'trackOrder' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <TrackOrderScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              orderId={navParams?.id || navParams?.orderId}
            />
          </Animated.View>
        )}
        {currentStep === 'orderDetails' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <OrderDetailsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              orderId={navParams?.id || navParams?.orderId}
            />
          </Animated.View>
        )}
        {currentStep === 'amc' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <AmcScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'buy_amc' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <BuyAmcScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'request_service' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <RequestServiceScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              amcContractId={navParams?.amcContractId || navParams?.id}
            />
          </Animated.View>
        )}
        {currentStep === 'service_request_list' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <ServiceRequestListScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'amc_request_status' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <AmcRequestStatusScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              id={navParams?.id || navParams?.requestId}
              requestId={navParams?.requestId || navParams?.id}
            />
          </Animated.View>
        )}
        {currentStep === 'amc_details' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <AmcDetailsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              id={navParams?.id || navParams?.contractId}
              contractId={navParams?.contractId || navParams?.id}
            />
          </Animated.View>
        )}
        {currentStep === 'service_request_details' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <ServiceRequestDetailsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              id={navParams?.id || navParams?.docketId}
            />
          </Animated.View>
        )}
        {currentStep === 'solar_calculator' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <SolarCalculatorScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'saved_addresses' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <SavedAddressesScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'support_tickets' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <SupportTicketsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'help_center' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <HelpCenterScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'faqs' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <FaqsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              categoryId={navParams?.categoryId}
            />
          </Animated.View>
        )}
        {currentStep === 'create_ticket' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <CreateTicketScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'ticket_details' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <TicketDetailsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
              id={navParams?.id || navParams?.ticketId || navParams?.docketId}
              ticketId={navParams?.ticketId || navParams?.id}
              docketId={navParams?.docketId || navParams?.id}
            />
          </Animated.View>
        )}
        {currentStep === 'edit_profile' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageFadeIn} exiting={MOTION.pageFadeOut}>
            <EditProfileScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'change_password' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <ChangePasswordScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'security' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <SecurityScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'about_us' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <AboutUsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'terms' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <TermsScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'privacy' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <PrivacyPolicyScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'delete_account' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <DeleteAccountScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'privacy_center' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <PrivacyCenterScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'request_data' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <RequestDataScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'consent_management' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <ConsentManagementScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'grievance_redressal' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <GrievanceRedressalScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'deactivate_account' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <DeactivateAccountScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'refer_earn' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <ReferAndEarnScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}
        {currentStep === 'referral_history' && (
          <Animated.View style={StyleSheet.absoluteFill} entering={MOTION.pageSlideInRight} exiting={MOTION.pageSlideOutLeft}>
            <ReferralHistoryScreen
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          </Animated.View>
        )}

        {/* Global Exit Confirmation */}
        <ExitConfirmationModal
          visible={showExitModal}
          onClose={() => setShowExitModal(false)}
        />
        <AppAlertHost />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
});
