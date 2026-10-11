import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Settings2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';

interface ConsentManagementScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function ConsentManagementScreen({ onBack }: ConsentManagementScreenProps) {
  const insets = useSafeAreaInsets();
  const [consents, setConsents] = useState({
    marketing: true,
    analytics: true,
    sms: false,
    thirdParty: false
  });

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const toggleSwitch = (key: keyof typeof consents) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={COMMON_STYLES.headerTitle}>Consent Management</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <View style={styles.iconBox}>
            <Settings2 size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Manage Preferences</Text>
          <Text style={styles.desc}>
            Control how we use your data and communicate with you. Essential communications regarding your AMC and services cannot be turned off.
          </Text>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Marketing Emails</Text>
              <Text style={styles.switchDesc}>Receive offers, news, and updates</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
              onValueChange={() => toggleSwitch('marketing')}
              value={consents.marketing}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>SMS Notifications</Text>
              <Text style={styles.switchDesc}>Promotional messages via SMS</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
              onValueChange={() => toggleSwitch('sms')}
              value={consents.sms}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Analytics Data</Text>
              <Text style={styles.switchDesc}>Help us improve the app experience</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
              onValueChange={() => toggleSwitch('analytics')}
              value={consents.analytics}
            />
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  desc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 24 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '50',
  },
  switchTextContainer: { flex: 1, paddingRight: 16 },
  switchTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  switchDesc: { fontSize: 12, color: COLORS.textSecondary },
});
