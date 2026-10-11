import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, UserX } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';
import { showAlert } from '../../store/useAlertStore';

interface DeactivateAccountScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function DeactivateAccountScreen({ onBack, onNavigate }: DeactivateAccountScreenProps) {
  const insets = useSafeAreaInsets();
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const handleDeactivate = () => {
    showAlert(
      "Deactivate Account",
      "Are you sure you want to deactivate your account? You can reactivate it at any time by logging back in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => {
            setIsDeactivating(true);
            setTimeout(() => {
              setIsDeactivating(false);
              onNavigate?.('login');
            }, 1500);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={COMMON_STYLES.headerTitle}>De-activate Account</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <View style={styles.iconBox}>
            <UserX size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Temporarily Disable Account</Text>

          <View style={styles.bulletPoints}>
            <Text style={styles.bulletText}>• Your profile and AMCs will be hidden.</Text>
            <Text style={styles.bulletText}>• You will not receive any notifications or emails.</Text>
            <Text style={styles.bulletText}>• Your data is NOT deleted, only temporarily disabled.</Text>
            <Text style={styles.bulletText}>• Simply log back in to automatically reactivate your account.</Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, isDeactivating && styles.btnDisabled]}
            disabled={isDeactivating}
            onPress={handleDeactivate}
          >
            <Text style={styles.btnText}>{isDeactivating ? 'Deactivating...' : 'De-activate Account'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#EFF6FF',
    padding: 24,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDeep, marginBottom: 16, textAlign: 'center' },
  bulletPoints: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.button,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  bulletText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: RADIUS.button, width: '100%', alignItems: 'center',
  },
  btnDisabled: { backgroundColor: COLORS.textTertiary, opacity: 0.6 },
  btnText: { color: COLORS.surface, fontSize: 16, fontWeight: '600' },
});
