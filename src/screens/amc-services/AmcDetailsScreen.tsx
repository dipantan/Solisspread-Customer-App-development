import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, Calendar, MapPin, Package, CheckCircle2, Clock, Banknote } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';
import * as amcApi from '../../api/amc';
import { ApiError } from '../../api/client';

interface AmcDetailsScreenProps {
  id?: string;
  contractId?: string;
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const COVERAGE_POINTS = [
  "Free periodic maintenance visits",
  "Priority support for breakdowns",
  "Free replacement of minor parts",
  "Zero labor charges for repairs",
  "24/7 technical helpline access"
];

export default function AmcDetailsScreen({ id, contractId, onBack, onNavigate }: AmcDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [isCoverageExpanded, setIsCoverageExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);

  const targetId = id || contractId;

  const loadContract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const plans = await amcApi.listMyAmcPlans();
      const list = Array.isArray(plans) ? plans : [];
      const match = targetId
        ? list.find((c: any) => c.id === targetId || c.contractNumber === targetId)
        : list[0];

      if (!match) {
        setError('AMC contract not found');
        setContract(null);
        return;
      }

      const today = Date.now();
      const end = match.endDate ? new Date(match.endDate).getTime() : NaN;
      const start = match.startDate ? new Date(match.startDate).getTime() : NaN;
      const daysLeft = Number.isFinite(end) ? Math.ceil((end - today) / 86400000) : null;
      const expired = daysLeft !== null && daysLeft < 0;
      const expiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

      const progressPct = !isNaN(start) && !isNaN(end) && end > start
        ? Math.min(100, Math.max(0, Math.round(((today - start) / (end - start)) * 100)))
        : 0;

      const planTitle = match.planName || match.plan?.name || match.title || 'AMC Plan';
      const contractNumber = match.contractNumber || match.id || targetId || '—';
      const status = match.status === 'CANCELLED' ? 'Cancelled' : expired ? 'Expired' : expiring ? 'Expiring Soon' : 'Active';
      const startDate = match.startDate ? new Date(match.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      const endDate = match.endDate ? new Date(match.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      const amount = match.plan?.price ? `₹${Number(match.plan.price).toLocaleString('en-IN')}` : match.amount ? `₹${Number(match.amount).toLocaleString('en-IN')}` : '—';
      const paymentMethod = match.paymentMethod || 'Online (UPI)';
      const address = match.project?.installationAddress || match.address || 'Registered Installation Address';
      const productName = match.product?.name || match.system || match.project?.name || planTitle;
      const installationId = match.project?.projectNumber || match.contractNumber || match.id;

      setContract({
        raw: match,
        planTitle,
        contractNumber,
        status,
        startDate,
        endDate,
        amount,
        paymentMethod,
        address,
        productName,
        installationId,
        progressPct,
        visits: `${match.visitsCompleted ?? 0}/${match.totalVisitsAllocated ?? 0} service visits completed`,
      });
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load contract details.');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

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
        <Text style={COMMON_STYLES.headerTitle}>AMC Details</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading contract details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !contract) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ShieldCheck size={48} color={COLORS.textTertiary} />
          <Text style={styles.errorTitle}>{error || 'AMC Contract Not Found'}</Text>
          <Text style={styles.errorSub}>This contract may not exist or is not linked to your account.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onBack}>
            <Text style={styles.retryBtnText}>Back to AMC Plans</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = contract.status === 'Expired';
  const isExpiring = contract.status === 'Expiring Soon';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, (isExpired || isExpiring) && { backgroundColor: isExpired ? COLORS.errorLight : COLORS.warning + '20' }]}>
              <ShieldCheck size={24} color={isExpired ? COLORS.error : isExpiring ? COLORS.warning : COLORS.success} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.planTitle}>{contract.planTitle}</Text>
              <Text style={styles.planSubtitle}>AMC ID: {contract.contractNumber}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              isExpired ? { backgroundColor: COLORS.errorLight } : isExpiring ? { backgroundColor: COLORS.warning + '20' } : {}
            ]}>
              <Text style={[
                styles.statusText,
                isExpired ? { color: COLORS.error } : isExpiring ? { color: COLORS.warning } : {}
              ]}>{contract.status}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{contract.startDate}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailValue}>{contract.endDate}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { marginTop: 16 }]}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={[styles.detailValue, { color: COLORS.primaryDeep }]}>{contract.amount}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{contract.paymentMethod}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { marginTop: 16 }]}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Visits Status</Text>
              <Text style={[styles.detailValue, { color: COLORS.success }]}>{contract.visits}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Coverage Details</Text>
          {COVERAGE_POINTS.slice(0, isCoverageExpanded ? COVERAGE_POINTS.length : 2).map((point, index) => (
            <View key={index} style={styles.listItem}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <Text style={styles.listText}>{point}</Text>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.toggleBtn} 
            onPress={() => setIsCoverageExpanded(!isCoverageExpanded)}
          >
            <Text style={styles.toggleBtnText}>
              {isCoverageExpanded ? 'See Less' : 'See All'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
           <Text style={styles.sectionTitle}>Purchased Address</Text>
           <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 }}>
             <MapPin size={20} color={COLORS.textSecondary} />
             <Text style={styles.addressText}>{contract.address}</Text>
           </View>

           <View style={styles.divider} />
           
           <Text style={styles.sectionTitle}>Product Details</Text>
           <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 }}>
             <Package size={20} color={COLORS.textSecondary} />
             <View style={{ flex: 1 }}>
               <Text style={styles.detailValue}>{contract.productName}</Text>
               <Text style={styles.detailLabel}>Installation ID: {contract.installationId}</Text>
             </View>
           </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
           <Text style={styles.sectionTitle}>Need Help?</Text>
           <Text style={styles.helpDesc}>Facing any issues with your product or plan?</Text>
           <TouchableOpacity
             style={styles.primaryBtn}
             onPress={() => onNavigate?.('request_service', { amcContractId: contract.contractNumber || contract.raw?.id })}
           >
             <Text style={styles.primaryBtnText}>Raise Service Request</Text>
           </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: COLORS.successLightBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  listText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  toggleBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.info,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  helpDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryDeep,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
  },
  retryBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
  },
});
