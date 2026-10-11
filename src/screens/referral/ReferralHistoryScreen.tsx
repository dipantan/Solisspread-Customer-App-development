import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, CalendarDays, Phone, MapPin, Box, ArrowUpDown, Gift } from 'lucide-react-native';
import * as usersApi from '../../api/users';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';

interface ReferralHistoryScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function ReferralHistoryScreen({ onBack, onNavigate }: ReferralHistoryScreenProps) {
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
        <Text style={COMMON_STYLES.headerTitle}>Referral History</Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return COLORS.success;
      case 'In Progress': return COLORS.primary;
      case 'Pending': return COLORS.warning;
      case 'Not Interested': return COLORS.error;
      case 'Converted': return '#8B5CF6'; // Purple
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Completed': return COLORS.success + '15';
      case 'In Progress': return COLORS.primary + '15';
      case 'Pending': return COLORS.warning + '15';
      case 'Not Interested': return COLORS.error + '15';
      case 'Converted': return '#8B5CF615';
      default: return COLORS.border;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const [referrals, setReferrals] = useState<any[]>([]);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    // Referral history has no dedicated API yet — show the real wallet
    // balance and an honest empty list rather than fabricated rows.
    usersApi
      .getMe()
      .then((u) => {
        setCoinsEarned(Number(u.wallets?.coins) || 0);
      })
      .catch(() => {});
    setReferrals([]);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Summary Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.summaryCard}>
          <LottieView
            source={require('../../../assets/animations/gift_box.json')}
            autoPlay
            loop
            style={styles.summaryBgGraphic}
          />
          <View style={styles.summaryStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Earnings</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{coinsEarned.toLocaleString('en-IN')}</Text>
                <Text style={styles.statSub}>Coins</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Referrals</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{String(referrals.length).padStart(2, '0')}</Text>
                <Text style={styles.statSub}>Friends</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {referrals.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Gift size={40} color={COLORS.textSecondary} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 }}>
              No referrals yet. Share your referral code to start earning!
            </Text>
          </View>
        )}

        {/* List of Referrals */}
        {referrals.map((item, index) => (
          <Animated.View key={item.id} entering={FadeInDown.delay(200 + (index * 50)).springify()} style={styles.referralCard}>

            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.refId}>Referral ID: {item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>

            {/* Profile Info */}
            <View style={styles.profileRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{item.name}</Text>
                <View style={styles.detailRow}>
                  <Phone size={12} color={COLORS.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText}>{item.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Box size={12} color={COLORS.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText}>{item.product}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={12} color={COLORS.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>
              </View>
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.dateRow}>
                <CalendarDays size={14} color={COLORS.textSecondary} style={styles.dateIcon} />
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
              <View style={styles.earnedRow}>
                <Text style={styles.earnedLabel}>Earned</Text>
                <Text style={styles.earnedValue}>{item.earned}</Text>
                <Image source={require('../../../assets/coins_img.png')} style={{ width: 14, height: 14, marginLeft: 4 }} resizeMode="contain" />
              </View>
            </View>

          </Animated.View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.card,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.soft,
  },
  summaryBgGraphic: {
    position: 'absolute',
    left: -20,
    bottom: -10,
    width: 120,
    height: 120,
    opacity: 0.9,
    resizeMode: 'contain',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: 40,
  },
  statBox: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 24,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  statSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  referralCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refId: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.googleBlue + '20',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earnedLabel: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginRight: 4,
    fontWeight: '500',
  },
  earnedValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.successAlt,
  }
});
