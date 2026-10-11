import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../common/AnimatedButton';
import { X, Mail, Phone, AlertCircle } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface OtpVerificationModalProps {
  visible: boolean;
  type: 'email' | 'phone';
  contactValue: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  visible,
  type,
  contactValue,
  onClose,
  onSuccess,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputs = useRef<Array<TextInput | null>>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setLoading(false);
      setTimer(60);
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (visible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visible, timer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pasted = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      // Focus the last filled input
      const lastIndex = Math.min(index + pasted.length, 5);
      inputs.current[lastIndex]?.focus();
      return;
    }

    // Handle single char
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    setError('');

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (code === '123456') { // Dummy check for now, can be anything or specifically 123456
        onSuccess();
      } else {
        setError('Invalid OTP code. Try 123456 for testing.');
      }
    }, 1000);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={COLORS.googleRed} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            {type === 'email' ? (
              <Mail size={32} color={COLORS.primary} />
            ) : (
              <Phone size={32} color={COLORS.primary} />
            )}
          </View>

          <Text style={styles.title}>Verify {type === 'email' ? 'Email' : 'Phone'}</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>{contactValue}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputActive : null,
                  error ? styles.otpInputError : null,
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={{ height: 24 }} />
          )}

          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.verifyBtnText}>
              {loading ? 'Verifying...' : 'Verify Now'}
            </Text>
          </TouchableOpacity>

          <View style={styles.timerRow}>
            <Text style={styles.timerText}>
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Did not receive code?'}
            </Text>
            {timer === 0 && (
              <TouchableOpacity onPress={() => setTimer(60)} activeOpacity={0.7}>
                <Text style={styles.resendLink}> Resend</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 24, 56, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.modal,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    borderRadius: 50,
    backgroundColor: COLORS.errorLight,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.error + '50',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 0,
    marginBottom: 16,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 45,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.input,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  otpInputActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  otpInputError: {
    borderColor: COLORS.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    height: 24,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 6,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 48,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyBtnDisabled: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  timerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
