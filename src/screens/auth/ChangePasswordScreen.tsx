import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import * as usersApi from '../../api/users';
import { ApiError } from '../../api/client';
import { showAlert, showToast } from '../../store/useAlertStore';

interface ChangePasswordScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function ChangePasswordScreen({ onBack, onNavigate }: ChangePasswordScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showAlert('Invalid password', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Mismatch', 'New password and confirm password do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.changePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      });
      showToast('Password updated successfully.');
      onBack?.();
    } catch (e: any) {
      showAlert('Error', e instanceof ApiError ? e.message : e?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };


  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <View style={styles.inputIcon}>
          <Lock size={20} color={COLORS.textSecondary} />
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}
        >
          {showPassword ? (
            <EyeOff size={20} color={COLORS.textSecondary} />
          ) : (
            <Eye size={20} color={COLORS.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={COMMON_STYLES.headerTitle}>Change Password</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerTextContainer}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from previous used passwords.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.formContainer}>
            {renderInput(
              'Current Password',
              currentPassword,
              setCurrentPassword,
              showCurrent,
              setShowCurrent,
              'Enter current password'
            )}

            {renderInput(
              'New Password',
              newPassword,
              setNewPassword,
              showNew,
              setShowNew,
              'Enter new password'
            )}

            {renderInput(
              'Confirm New Password',
              confirmPassword,
              setConfirmPassword,
              showConfirm,
              setShowConfirm,
              'Confirm new password'
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.requirementsContainer}>
            <Text style={styles.reqTitle}>Password requirements:</Text>
            <Text style={styles.reqItem}>• Minimum 8 characters long</Text>
            <Text style={styles.reqItem}>• At least one uppercase character</Text>
            <Text style={styles.reqItem}>• At least one number or special character</Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={() => onBack?.()}>
          <Text style={styles.saveBtnText}>Update Password</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTextContainer: {
    marginBottom: 32,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  formContainer: {
    gap: 20,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.input,
    height: 52,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
    marginRight: -4,
  },
  requirementsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  reqItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  saveBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
