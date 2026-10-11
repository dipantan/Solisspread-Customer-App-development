import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TextInput, RefreshControl, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  Plus,
  ChevronRight,
  ShieldCheck,
  Clock,
  CalendarX2,
  FileText,
  Calendar,
  AlertCircle,
  Shield,
  HardHat
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as amcApi from '../../api/amc';
import { ApiError } from '../../api/client';

const { width } = Dimensions.get('window');



export default function AmcScreen({ onBack, onNavigate }: { onBack?: () => void, onNavigate?: (step: any, params?: any) => void }) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingAmc, setLoadingAmc] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAmc = async () => {
    setLoadError(null);
    try {
      const myPlans = await amcApi.listMyAmcPlans();
      const today = Date.now();
      setContracts(
        myPlans.map((c) => {
          const end = c.endDate ? new Date(c.endDate).getTime() : NaN;
          const daysLeft = Number.isFinite(end) ? Math.ceil((end - today) / 86400000) : null;
          const expired = daysLeft !== null && daysLeft < 0;
          const expiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
          return {
            id: c.contractNumber || c.id,
            status: expired ? 'Expiring Soon' : expiring ? 'Expiring Soon' : 'Active',
            title: c.planName || 'AMC Plan',
            instId: c.contractNumber || c.id,
            startDate: c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
            endDate: c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
            covered: `${c.visitsCompleted ?? 0}/${c.totalVisitsAllocated ?? 0} service visits completed`,
            daysRemaining:
              daysLeft === null
                ? c.status
                : expired
                  ? `Expired ${Math.abs(daysLeft)} days ago`
                  : `${daysLeft} days remaining`,
            image: require('../../../assets/solar_panel_product.png'),
          };
        }),
      );
    } catch (e: any) {
      setContracts([]);
      setLoadError(e instanceof ApiError ? e.message : 'Could not load your AMC plans.');
    } finally {
      setLoadingAmc(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAmc();
  }, []);

  const [expandedPlans, setExpandedPlans] = useState<{ [key: string]: boolean }>({});
  const [hasSubmittedAmcRequest, setHasSubmittedAmcRequest] = useState(false); // Used to toggle between Buy New AMC and AMC Request Status
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadAmc();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedPlans(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <MainLayout headerScrollY={scrollY} activeTab="amc" onTabChange={onNavigate}>
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: COLORS.primaryDeep }}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.bodyContent}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.overviewContainer}>
            <Text style={styles.sectionTitle}>AMC Overview</Text>
            <View style={styles.overviewRow}>
              <View style={styles.overviewBox}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.successLight }]}>
                  <ShieldCheck size={20} color={COLORS.success} />
                </View>
                <Text style={[styles.overviewCount, { color: COLORS.successAlt }]}>4</Text>
                <Text style={[styles.overviewLabel, { color: COLORS.success }]}>Active</Text>
              </View>
              <View style={styles.overviewBox}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.warning + '20' }]}>
                  <Clock size={20} color={COLORS.warning} />
                </View>
                <Text style={[styles.overviewCount, { color: COLORS.warning }]}>1</Text>
                <Text style={[styles.overviewLabel, { color: COLORS.warning }]}>Expiring Soon</Text>
              </View>
              <View style={styles.overviewBox}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.errorLight }]}>
                  <CalendarX2 size={20} color={COLORS.error} />
                </View>
                <Text style={[styles.overviewCount, { color: COLORS.error }]}>0</Text>
                <Text style={[styles.overviewLabel, { color: COLORS.error }]}>Expired</Text>
              </View>
              <View style={styles.overviewBox}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '15' }]}>
                  <FileText size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.overviewCount, { color: COLORS.primary }]}>5</Text>
                <Text style={[styles.overviewLabel, { color: COLORS.primary }]}>Total</Text>
              </View>
            </View>
          </Animated.View>


          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.actionCardsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.9}
              onPress={() => onNavigate?.(hasSubmittedAmcRequest ? 'amc_request_status' : 'buy_amc')}
            >
              <ImageBackground
                source={require('../../../assets/amc_card_bg.jpg')}
                style={styles.actionCardBg}
                imageStyle={styles.actionCardImage}
              >
                <LinearGradient
                  colors={[COLORS.primary + '20', COLORS.primaryDeep + 'F0']}
                  style={styles.actionCardOverlay}
                />
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIconBox}>
                    {hasSubmittedAmcRequest ? <Clock size={24} color={COLORS.surface} /> : <Shield size={24} color={COLORS.surface} />}
                  </View>
                  <Text style={styles.actionCardTitle}>{hasSubmittedAmcRequest ? 'AMC Request Status' : 'Buy New AMC'}</Text>
                  <Text style={styles.actionCardSub}>Protect your solar system</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.9}
              onPress={() => onNavigate?.('service_request_list')}
            >
              <ImageBackground
                source={require('../../../assets/service_card_bg.jpg')}
                style={styles.actionCardBg}
                imageStyle={styles.actionCardImage}
              >
                <LinearGradient
                  colors={[COLORS.warning + '20', COLORS.warning + 'F0']}
                  style={styles.actionCardOverlay}
                />
                <View style={styles.actionCardContent}>
                  <View style={[styles.actionCardIconBox, { backgroundColor: COLORS.surface + '30' }]}>
                    <HardHat size={24} color={COLORS.surface} />
                  </View>
                  <Text style={styles.actionCardTitle}>Service Requests</Text>
                  <Text style={styles.actionCardSub}>Track your open requests</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.sectionTitle}>My AMC Plans</Text>
          </Animated.View>


          {loadError && (
            <Text style={{ color: COLORS.warning, textAlign: 'center', marginVertical: 12 }}>{loadError}</Text>
          )}
          {!loadingAmc && !loadError && contracts.length === 0 && (
            <View style={[styles.planCard, { alignItems: 'center', paddingVertical: 28 }]}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' }}>
                No active AMC plans yet.{'\n'}Buy an AMC plan to keep your solar system protected.
              </Text>
              <TouchableOpacity style={styles.renewBtn} onPress={() => onNavigate?.('buy_amc')}>
                <Text style={styles.renewBtnText}>Buy AMC</Text>
              </TouchableOpacity>
            </View>
          )}
          {contracts.map((plan, index) => (
            <Animated.View key={plan.id} entering={FadeInDown.delay((index + 4) * 100).springify()} style={styles.planCard}>

              <View style={styles.cardHeader}>
                <View style={styles.imageBg}>
                  <Image source={plan.image} style={styles.productImage} resizeMode="contain" />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.statusRow}>
                    <View style={[
                      styles.statusBadge,
                      plan.status === 'Active' ? styles.statusActive : styles.statusExpiring
                    ]}>
                      <Text style={[
                        styles.statusText,
                        plan.status === 'Active' ? styles.statusTextActive : styles.statusTextExpiring
                      ]}>{plan.status}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.amcIdText}>AMC ID: {plan.id}</Text>
                    </View>
                  </View>
                  <Text style={styles.productTitle} numberOfLines={2}>{plan.title}</Text>
                  <Text style={styles.instId}>Installation ID: {plan.instId}</Text>
                </View>
              </View>

              <View style={styles.datesRow}>
                <View style={styles.dateCol}>
                  <Calendar size={16} color={COLORS.textSecondary} />
                  <View>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>{plan.startDate}</Text>
                  </View>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateCol}>
                  <Calendar size={16} color={COLORS.textSecondary} />
                  <View>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateValue}>{plan.endDate}</Text>
                  </View>
                </View>
              </View>

              {plan.covered && (
                <View style={[styles.coveredRow, expandedPlans[plan.id] ? { flexDirection: 'column', alignItems: 'flex-start', gap: 12 } : {}]}>
                  <View style={{ flexDirection: 'row', alignItems: expandedPlans[plan.id] ? 'flex-start' : 'center', gap: 6, flex: 1, width: '100%' }}>
                    <ShieldCheck size={16} color={COLORS.success} style={expandedPlans[plan.id] ? { marginTop: 2 } : {}} />
                    <Text
                      style={[styles.coveredText, { flex: 1 }]}
                      numberOfLines={expandedPlans[plan.id] ? undefined : 1}
                    >
                      Covered: {plan.covered}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', alignSelf: expandedPlans[plan.id] ? 'flex-end' : 'auto' }}
                    onPress={() => toggleExpand(plan.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDetailsText}>
                      {expandedPlans[plan.id] ? 'View Less' : 'View Details'}
                    </Text>
                    <ChevronRight
                      size={14}
                      color={COLORS.success}
                      style={{ transform: [{ rotate: expandedPlans[plan.id] ? '-90deg' : '0deg' }] }}
                    />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color={plan.status === 'Active' ? COLORS.primary : COLORS.warning} />
                  <Text style={[
                    styles.remainingText,
                    { color: plan.status === 'Active' ? COLORS.primary : COLORS.warning }
                  ]}>
                    {plan.daysRemaining}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {plan.status === 'Expiring Soon' && (
                    <TouchableOpacity style={styles.renewBtn} onPress={() => onNavigate?.('buy_amc')}>
                      <Text style={styles.renewBtnText}>Renew Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => onNavigate?.('amc_details')}>
                  <Text style={styles.viewDetailsBtnText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceRequestBtn} onPress={() => onNavigate?.('request_service')}>
                  <Text style={styles.serviceRequestBtnText}>Service Request</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          ))}

          <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.infoCard}>
            <View style={styles.infoIconBg}>
              <ShieldCheck size={24} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Why AMC is Important?</Text>
              <Text style={styles.infoDesc}>Regular maintenance increases product life and ensures maximum performance and safety.</Text>
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.learnMoreText}>Learn More</Text>
              <ChevronRight size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </Animated.View>

        </View>
      </Animated.ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 24,
    minHeight: Dimensions.get('window').height,
  },
  overviewContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewBox: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overviewCount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  actionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  actionCardBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionCardImage: {
    opacity: 0.8,
  },
  actionCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  actionCardContent: {
    padding: 16,
    zIndex: 1,
  },
  actionCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionCardSub: {
    color: COLORS.surface + 'CC',
    fontSize: 11,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  imageBg: {
    width: 80,
    height: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  cardInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: COLORS.successLightBorder,
  },
  statusExpiring: {
    backgroundColor: COLORS.warning + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextActive: {
    color: COLORS.success,
  },
  statusTextExpiring: {
    color: COLORS.warning,
  },
  amcIdText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  instId: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  dateLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  coveredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.successLight,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  coveredText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '500',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  renewBtn: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  renewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewDetailsBtn: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  serviceRequestBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  serviceRequestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  infoCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    paddingRight: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
