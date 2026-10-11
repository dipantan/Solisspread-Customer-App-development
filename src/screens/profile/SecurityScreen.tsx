import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Smartphone,
  Fingerprint,
  ShieldCheck,
  LogOut,
  Laptop,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';

interface SecurityScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function SecurityScreen({ onBack, onNavigate }: SecurityScreenProps) {
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

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

  const renderSettingRow = (
    icon: React.ReactNode,
    title: string,
    desc: string,
    value: boolean,
    onValueChange: (val: boolean) => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIconBox}>
        {icon}
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
        thumbColor={value ? COLORS.primary : COLORS.background}
      />
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
          <Text style={COMMON_STYLES.headerTitle}>Security</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Login & Authentication</Text>
          <View style={styles.card}>
            {renderSettingRow(
              <Fingerprint size={22} color={COLORS.primary} />,
              'Biometric Login',
              'Use Face ID or Touch ID to log in',
              biometricEnabled,
              setBiometricEnabled
            )}
            <View style={styles.divider} />
            {renderSettingRow(
              <ShieldCheck size={22} color={COLORS.primary} />,
              'Two-Factor Authentication',
              'Add an extra layer of security to your account',
              twoFactorEnabled,
              setTwoFactorEnabled
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Active Devices</Text>
          <View style={styles.card}>
            <View style={styles.deviceRow}>
              <View style={[styles.settingIconBox, { backgroundColor: COLORS.success + '15' }]}>
                <Smartphone size={22} color={COLORS.success} />
              </View>
              <View style={styles.deviceTextContainer}>
                <Text style={styles.deviceTitle}>iPhone 14 Pro (This Device)</Text>
                <Text style={styles.deviceDesc}>Kolkata, India • Active now</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.deviceRow}>
              <View style={[styles.settingIconBox, { backgroundColor: COLORS.textTertiary + '20' }]}>
                <Laptop size={22} color={COLORS.textSecondary} />
              </View>
              <View style={styles.deviceTextContainer}>
                <Text style={styles.deviceTitle}>MacBook Pro</Text>
                <Text style={styles.deviceDesc}>Kolkata, India • Last active 2 hours ago</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn}>
                <LogOut size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 12,
    marginLeft: 60,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deviceTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  deviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  deviceDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
