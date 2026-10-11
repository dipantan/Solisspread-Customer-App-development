import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';
import { showAlert } from '../../store/useAlertStore';

interface DeleteAccountScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function DeleteAccountScreen({ onBack, onNavigate }: DeleteAccountScreenProps) {
  const insets = useSafeAreaInsets();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const renderHeader = () => (
    <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Delete Account</Text>
      </View>
    </View>
  );

  const handleDelete = () => {
    if (confirmText !== 'DELETE') return;

    showAlert(
      "Final Confirmation",
      "Are you absolutely sure you want to delete your account? This action cannot be reversed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: () => {
            setIsDeleting(true);
            // Simulate API call for deletion
            setTimeout(() => {
              setIsDeleting(false);
              onNavigate?.('login');
            }, 1500);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.warningCard}>
            <View style={styles.iconBox}>
              <AlertTriangle size={32} color={COLORS.error} />
            </View>
            <Text style={styles.warningTitle}>Warning: This action is permanent.</Text>

            <View style={styles.bulletPoints}>
              <Text style={styles.bulletText}>• All your personal data will be permanently erased.</Text>
              <Text style={styles.bulletText}>• Your active AMCs and service histories will be lost.</Text>
              <Text style={styles.bulletText}>• SolaCoins balance will be forfeited.</Text>
              <Text style={styles.bulletText}>• You will not be able to recover this account.</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputContainer}>
            <Text style={styles.inputLabel}>To confirm, type "DELETE" below:</Text>
            <TextInput
              style={styles.input}
              placeholder="Type DELETE"
              placeholderTextColor={COLORS.textTertiary}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <TouchableOpacity
              style={[
                styles.deleteBtn,
                confirmText !== 'DELETE' && styles.deleteBtnDisabled
              ]}
              activeOpacity={0.8}
              onPress={handleDelete}
              disabled={confirmText !== 'DELETE' || isDeleting}
            >
              <Text style={styles.deleteBtnText}>
                {isDeleting ? "Deleting..." : "Permanently Delete Account"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    padding: 24,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.googleRed,
    ...SHADOWS.soft,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  bulletPoints: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  bulletText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    height: 52,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    ...SHADOWS.soft,
  },
  deleteBtn: {
    backgroundColor: COLORS.error,
    height: 52,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  deleteBtnDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
