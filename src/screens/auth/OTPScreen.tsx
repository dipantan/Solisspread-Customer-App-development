import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, Edit2 } from 'lucide-react-native';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError } from '../../api/client';
import type { OtpPurpose } from '../../api/types';
import { OTPBackConfirmationModal } from '../../components/auth/OTPBackConfirmationModal';
import { showAlert, showToast } from '../../store/useAlertStore';

interface OTPScreenProps {
  onVerify: () => void;
  onBack?: () => void;
  onEditDetails?: () => void;
  identifier?: string;
  purpose?: OtpPurpose;
}

export default function OTPScreen({
  onVerify,
  onBack,
  onEditDetails,
  identifier = '',
  purpose = 'LOGIN',
}: OTPScreenProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [showBackModal, setShowBackModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const maskIdentifier = (value: string) => {
    if (!value) return 'your registered contact';
    if (value.includes('@')) {
      const [u, d] = value.split('@');
      return `${u.slice(0, 2)}***@${d}`;
    }
    return value.length > 4 ? `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : value;
  };

  const verifyCurrentOtp = useAuthStore((s) => s.verifyCurrentOtp);
  const resendCurrentOtp = useAuthStore((s) => s.resendCurrentOtp);
  const authFlow = useAuthStore((s) => s.authFlow);
  const resolvedIdentifier = identifier || authFlow?.identifier || '';

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showAlert('Incomplete OTP', 'Please enter the 6-digit code.');
      return;
    }
    if (!resolvedIdentifier) {
      showAlert('Missing identifier', 'Please go back and try again.');
      return;
    }
    setLoading(true);
    try {
      await verifyCurrentOtp(otpCode);
      onVerify();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'OTP verification failed';
      showAlert('Verification failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resolvedIdentifier) return;
    try {
      await resendCurrentOtp();
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      showToast('A new code has been sent.');
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'Failed to resend OTP';
      showAlert('Resend failed', msg);
    }
  };

  const handleBackPress = () => {
    setShowBackModal(true);
    return true; // prevent default back
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [onBack]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (text: string, index: number) => {
    // Handle pasting multi-digit OTP string
    if (text.length > 1) {
      const pastedDigits = text.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input box
    if (text !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Back Navigation Arrow */}
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.primaryNavy} />
        </TouchableOpacity>

        <View style={styles.mainSection}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>{`Enter the 6-digit code sent to\n${maskIdentifier(resolvedIdentifier)}`}</Text>
            <Text style={styles.warningText}>Please do not go back</Text>
          </View>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.timerRow}>
            <Text style={styles.timerText}>
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Did not receive code?'}
            </Text>
            {timer === 0 && (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendLink}> Resend</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={onEditDetails} style={styles.editRow}>
            <Edit2 size={14} color={COLORS.info} />
            <Text style={styles.editLink}>Wrong Email/Mobile? Edit details</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton title="Verify" onPress={handleVerify} loading={loading} style={styles.verifyBtn} />
      </KeyboardAvoidingView>
      
      <OTPBackConfirmationModal
        visible={showBackModal}
        onClose={() => setShowBackModal(false)}
        onConfirm={() => {
          setShowBackModal(false);
          if (onBack) onBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  mainSection: {
    marginVertical: 50,
    width: '100%',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
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
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
    marginTop: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  otpBox: {
    width: 40,
    height: 50,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryNavy,
    marginHorizontal: 5,
    boxSizing: 'border-box',
  },
  otpBoxFilled: {
    borderColor: COLORS.info,
    borderWidth: 1.5,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.info,
  },
  verifyBtn: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: RADIUS.button,
    marginTop: 'auto',
    marginBottom: 10,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.info,
    marginLeft: 6,
  },
});
