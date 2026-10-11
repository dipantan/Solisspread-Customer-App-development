import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ApiError } from '../../api/client';
import { COLORS, RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { canonicalIdentifier } from '../../utils/phone';
import { showAlert } from '../../store/useAlertStore';

export default function LoginScreen({
  onLogin,
  onRegister,
  onNeedOtp,
}: {
  onLogin: () => void;
  onRegister: () => void;
  onNeedOtp?: (identifier: string, purpose: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const loginPrefill = useAuthStore((s) => s.loginPrefill);
  const notice = useAuthStore((s) => s.notice);
  const setNotice = useAuthStore((s) => s.setNotice);
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const requestLoginOtp = useAuthStore((s) => s.requestLoginOtp);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (loginPrefill) setEmail(loginPrefill);
  }, [loginPrefill]);

  const handleLogin = async () => {
    const identifier = email.trim();
    setIdentifierError('');
    if (!identifier) {
      setIdentifierError('Please enter your email or mobile number.');
      return;
    }
    try {
      canonicalIdentifier(identifier);
    } catch (e: any) {
      setIdentifierError(e?.message || 'Enter a valid email or mobile number.');
      return;
    }
    setLoading(true);
    try {
      if (password.trim()) {
        const next = await loginWithPassword(identifier, password);
        setNotice(null);
        if (next === 'otp') {
          onNeedOtp?.(useAuthStore.getState().authFlow?.identifier || identifier, 'REGISTRATION');
          return;
        }
        if (next === 'profile') {
          useNavigationStore.getState().setCurrentStep('profile');
          return;
        }
        onLogin();
      } else if (onNeedOtp) {
        await requestLoginOtp(identifier);
        onNeedOtp(useAuthStore.getState().authFlow?.identifier || identifier, 'LOGIN');
      } else {
        showAlert('Password required', 'Enter your password, or use OTP login.');
      }
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'Login failed';
      setIdentifierError(msg);
    } finally {
      setLoading(false);
    }
  };

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
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.primaryNavy} />
        </TouchableOpacity>

        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>Login to continue</Text>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <InputField
            placeholder="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setIdentifierError('');
            }}
            error={identifierError}
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

          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PrimaryButton title={password.trim() ? 'Login' : 'Send Email OTP'} onPress={handleLogin} loading={loading} style={styles.loginBtn} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>New user? </Text>
          <TouchableOpacity onPress={onRegister} activeOpacity={0.7}>
            <Text style={styles.registerLink}>Register</Text>
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
  },
  header: {
    marginBottom: 40,
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
  notice: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: COLORS.primaryNavy,
  },
  form: {
    width: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 28,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.info,
  },
  loginBtn: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: RADIUS.button,
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
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.info,
  },
});
