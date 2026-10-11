import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, Leaf, Heart, Building2, Target, Award, Users, Clock, Zap, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';

interface AboutUsScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function AboutUsScreen({ onBack, onNavigate }: AboutUsScreenProps) {
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
        <Text style={COMMON_STYLES.headerTitle}>About Us</Text>
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
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.mainBanner}>
          <Image
            source={require('../../../assets/about_us_solar_banner.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Powering a</Text>
            <Text style={styles.bannerTitleGreen}>Sustainable <Text style={styles.bannerTitleDark}>Future</Text></Text>
            <Text style={styles.bannerSubtitle}>We are committed to delivering high-quality solar solutions and exceptional service to every home and business.</Text>

            <View style={styles.badgesRow}>
              <View style={styles.badgeItem}>
                <ShieldCheck size={16} color={COLORS.primary} />
                <Text style={styles.badgeText}>Reliable{'\n'}Solutions</Text>
              </View>
              <View style={styles.badgeItem}>
                <Leaf size={16} color={COLORS.success} />
                <Text style={styles.badgeText}>Clean{'\n'}Energy</Text>
              </View>
              <View style={styles.badgeItem}>
                <Heart size={16} color={COLORS.warning} />
                <Text style={styles.badgeText}>Customer{'\n'}First</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionRow}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
            <Building2 size={24} color={COLORS.primary} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Who We Are</Text>
            <Text style={styles.sectionDesc}>We are a team of solar energy experts dedicated to making clean and affordable energy accessible to all. From consultation to installation and after-sales support, we are with you at every step.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.missionCard}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.successAlt + '20' }]}>
            <Target size={24} color={COLORS.successAlt} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionTitle, { color: COLORS.successAlt }]}>Our Mission</Text>
            <Text style={[styles.sectionDesc, { color: COLORS.textPrimary }]}>To accelerate the world's transition to sustainable energy through innovative solar solutions and unmatched customer care.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={styles.gridHeading}>Why Choose Us?</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Award size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.gridTitle}>Quality{'\n'}Assured</Text>
              <Text style={styles.gridDesc}>Premium quality products and standards.</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: COLORS.success + '15' }]}>
                <Users size={24} color={COLORS.success} />
              </View>
              <Text style={styles.gridTitle}>Expert{'\n'}Technicians</Text>
              <Text style={styles.gridDesc}>Trained and certified professionals for best service.</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: COLORS.warning + '15' }]}>
                <Clock size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.gridTitle}>Quick{'\n'}Support</Text>
              <Text style={styles.gridDesc}>Prompt support and service when you need it</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={[styles.gridIcon, { backgroundColor: '#8B5CF615' }]}>
                <ShieldCheck size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.gridTitle}>Trusted by{'\n'}Thousands</Text>
              <Text style={styles.gridDesc}>Thousands of happy customers across the country.</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.sectionRow}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
            <Building2 size={24} color={COLORS.primary} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Our Journey</Text>
            <Text style={styles.sectionDesc}>Over the years, we have successfully delivered numerous solar projects for homes, businesses, and industries, helping them reduce energy costs and build a greener tomorrow.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.statsCard}>
          <View style={styles.statItem}>
            <Users size={20} color={COLORS.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>25K+</Text>
            <Text style={styles.statLabel}>Happy Customers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Leaf size={20} color={COLORS.success} style={styles.statIcon} />
            <Text style={styles.statValue}>10K+</Text>
            <Text style={styles.statLabel}>Projects Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Zap size={20} color={COLORS.warning} style={styles.statIcon} />
            <Text style={styles.statValue}>150+</Text>
            <Text style={styles.statLabel}>Expert Technicians</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MapPin size={20} color="#8B5CF6" style={styles.statIcon} />
            <Text style={styles.statValue}>200+</Text>
            <Text style={styles.statLabel}>Cities Served</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.footerCard}>
          <View style={styles.footerIconBox}>
            <Heart size={24} color={COLORS.primary} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.footerTitle}>Thank you for trusting us</Text>
            <Text style={styles.footerDesc}>We look forward to powering a brighter and greener future together.</Text>
          </View>
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
  mainBanner: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    right: -50,
    bottom: 0,
    opacity: 0.5,
  },
  bannerOverlay: {
    padding: 20,
    paddingRight: 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  bannerTitleGreen: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.successAlt,
    marginBottom: 12,
  },
  bannerTitleDark: {
    color: COLORS.primaryDeep,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: COLORS.primaryDarker,
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: '1000%',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    ...SHADOWS.soft,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  missionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.successLight,
    padding: 16,
    borderRadius: RADIUS.card,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.successAlt,
    ...SHADOWS.soft,
  },
  gridHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  gridItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    textAlign: 'center',
    marginBottom: 6,
  },
  gridDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.info,
    ...SHADOWS.soft,
  },
  footerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...SHADOWS.soft,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  footerDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
