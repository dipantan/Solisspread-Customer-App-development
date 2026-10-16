import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, BackHandler, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Home, Building2, Factory } from 'lucide-react-native';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ApiError } from '../../api/client';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuthStore, type CustomerType } from '../../store/useAuthStore';
import { normalizeIndianPhone } from '../../utils/phone';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { showAlert } from '../../store/useAlertStore';

type AccountType = CustomerType | null;

export default function RegisterScreen({
  onRegisterSuccess,
  onLogin,
}: {
  onRegisterSuccess: (identifier: string, purpose?: string) => void;
  onLogin: () => void;
}) {
  const draft = useAuthStore((s) => s.draft);
  const [step, setStep] = useState<1 | 2>(draft.phoneNumber || draft.customerType ? 2 : 1);
  const [userType, setUserType] = useState<AccountType>(draft.customerType ?? null);
  
  const [fullName, setFullName] = useState(draft.fullName || '');
  const [email, setEmail] = useState(draft.email || '');
  const [phone, setPhone] = useState(draft.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const registerCustomer = useAuthStore((s) => s.registerCustomer);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (draft.customerType) setUserType(draft.customerType);
    if (draft.fullName) setFullName(draft.fullName);
    if (draft.email) setEmail(draft.email);
    if (draft.phoneNumber) setPhone(draft.phoneNumber);
  }, [draft]);

  const handleNext = () => {
    if (!userType) {
      showAlert('Selection Required', 'Please select a customer type to proceed.');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    setPhoneError('');
    setEmailError('');
    if (!fullName || !phone || !password || !confirmPassword) {
      showAlert('Error', 'Please fill all the required fields.');
      return;
    }
    if (!normalizeIndianPhone(phone)) {
      setPhoneError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const next = await registerCustomer({
        fullName,
        email,
        phone,
        password,
        customerType: userType,
      });
      if (next === 'login') {
        onLogin();
        return;
      }
      onRegisterSuccess(useAuthStore.getState().draft.phoneNumber, 'REGISTRATION');
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'Registration failed';
      const lower = msg.toLowerCase();
      if (lower.includes('email')) {
        setEmailError(msg);
        return;
      }
      if (lower.includes('mobile') || lower.includes('phone') || lower.includes('number')) {
        setPhoneError(msg);
        return;
      }
      showAlert('Registration failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onLogin();
    }
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => backHandler.remove();
  }, [step]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Navigation Arrow */}
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.primaryNavy} />
        </TouchableOpacity>

        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 1 ? 'Choose Account Type' : 'Create Your Account'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Select the category that best describes you' : `Registering as a ${userType} customer`}
          </Text>
        </View>

        {step === 1 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            
            <TouchableOpacity 
              style={[styles.typeCard, userType === 'Residential' && styles.typeCardSelected]}
              onPress={() => setUserType('Residential')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, userType === 'Residential' && styles.iconWrapSelected]}>
                <Home size={28} color={userType === 'Residential' ? COLORS.surface : COLORS.primaryNavy} />
              </View>
              <View style={styles.typeTextWrap}>
                <Text style={[styles.typeTitle, userType === 'Residential' && styles.typeTitleSelected]}>Residential</Text>
                <Text style={[styles.typeSub, userType === 'Residential' && styles.typeSubSelected]}>For individual homes & apartments</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeCard, userType === 'Commercial' && styles.typeCardSelected]}
              onPress={() => setUserType('Commercial')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, userType === 'Commercial' && styles.iconWrapSelected]}>
                <Building2 size={28} color={userType === 'Commercial' ? COLORS.surface : COLORS.primaryNavy} />
              </View>
              <View style={styles.typeTextWrap}>
                <Text style={[styles.typeTitle, userType === 'Commercial' && styles.typeTitleSelected]}>Commercial</Text>
                <Text style={[styles.typeSub, userType === 'Commercial' && styles.typeSubSelected]}>For offices, shops, and small businesses</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeCard, userType === 'Industrial' && styles.typeCardSelected]}
              onPress={() => setUserType('Industrial')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, userType === 'Industrial' && styles.iconWrapSelected]}>
                <Factory size={28} color={userType === 'Industrial' ? COLORS.surface : COLORS.primaryNavy} />
              </View>
              <View style={styles.typeTextWrap}>
                <Text style={[styles.typeTitle, userType === 'Industrial' && styles.typeTitleSelected]}>Industrial</Text>
                <Text style={[styles.typeSub, userType === 'Industrial' && styles.typeSubSelected]}>For large scale factories and plants</Text>
              </View>
            </TouchableOpacity>

          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
            <View style={styles.form}>
              <InputField
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />

              <InputField
                placeholder="Email Address"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />

              <InputField
                placeholder="Mobile Number"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setPhoneError('');
                }}
                keyboardType="phone-pad"
                error={phoneError}
              />

              <InputField
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color={COLORS.primaryNavy} />
                    ) : (
                      <Eye size={20} color={COLORS.primaryNavy} />
                    )}
                  </TouchableOpacity>
                }
              />

              <InputField
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={COLORS.primaryNavy} />
                    ) : (
                      <Eye size={20} color={COLORS.primaryNavy} />
                    )}
                  </TouchableOpacity>
                }
              />

            </View>
          </Animated.View>
        )}

      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {step === 1 ? (
          <PrimaryButton
            title="Next Step"
            onPress={handleNext}
            style={styles.registerBtn}
            disabled={!userType}
          />
        ) : (
          <PrimaryButton title="Register" onPress={handleRegister} loading={loading} style={styles.registerBtn} />
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  flex: {
    flex: 1,
  },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 160,
    flexGrow: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
    marginLeft: -8,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryNavy,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '400',
  },
  stepContainer: {
    width: '100%',
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
  },
  typeCardSelected: {
    borderColor: COLORS.primaryNavy,
    backgroundColor: '#F0F4FA',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  iconWrapSelected: {
    backgroundColor: COLORS.primaryNavy,
  },
  typeTextWrap: {
    marginLeft: 16,
    flex: 1,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    marginBottom: 4,
  },
  typeTitleSelected: {
    color: COLORS.primaryNavy,
  },
  typeSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  typeSubSelected: {
    color: COLORS.primaryNavy,
    opacity: 0.8,
  },
  form: {
    width: '100%',
  },
  registerBtn: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: RADIUS.button,
    marginTop: 12,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.info,
  },
});
