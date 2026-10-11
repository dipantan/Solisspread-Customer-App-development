import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Shield } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function PrivacyPolicyScreen({ onBack, onNavigate }: PrivacyPolicyScreenProps) {
  const insets = useSafeAreaInsets();

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
        <Text style={COMMON_STYLES.headerTitle}>Privacy Policy</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerCard}>
          <View style={styles.iconBox}>
            <Shield size={24} color="#EF4444" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Privacy Commitment</Text>
            <Text style={styles.headerSubtitle}>Last updated: August 2026</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.contentCard}>
          <Text style={styles.sectionTitle}>1. Data Collection</Text>
          <Text style={styles.paragraph}>
            We collect personal information that you voluntarily provide to us when you register on the app, express an interest in obtaining information about us or our products, or when you contact us.
          </Text>

          <Text style={styles.sectionTitle}>2. Use of Information</Text>
          <Text style={styles.paragraph}>
            We use personal information collected via our App for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you.
          </Text>

          <Text style={styles.sectionTitle}>3. Data Sharing</Text>
          <Text style={styles.paragraph}>
            We only share information with your consent, to comply with laws, to provide you with services (like assigning technicians for AMC), to protect your rights, or to fulfill business obligations.
          </Text>

          <Text style={styles.sectionTitle}>4. Security</Text>
          <Text style={styles.paragraph}>
            We aim to protect your personal information through a system of organizational and technical security measures designed to protect the security of any personal information we process.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.paragraph}>
            In some regions, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.
          </Text>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF444415',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
