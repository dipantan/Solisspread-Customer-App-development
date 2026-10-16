import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HeadphonesIcon,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Check,
  MessageCircle,
  LayoutGrid,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import * as amcApi from '../../api/amc';
import { ApiError } from '../../api/client';

const { width } = Dimensions.get('window');

interface AmcRequestStatusScreenProps {
  id?: string;
  requestId?: string;
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function AmcRequestStatusScreen({ id, requestId, onBack, onNavigate }: AmcRequestStatusScreenProps) {
  const insets = useSafeAreaInsets();
  const [negotiationRequested, setNegotiationRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<{
    reqId: string;
    productName: string;
    stageName: string;
    requestDate: string;
    rawStatus: string;
    address?: string;
  }>({
    reqId: id || requestId || '',
    productName: 'Solar AMC Onboarding',
    stageName: 'Submitted',
    requestDate: '',
    rawStatus: 'REQUESTED',
  });

  const targetId = id || requestId;

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (targetId) {
        try {
          const docket = await amcApi.getDocket(targetId);
          if (docket) {
            setRequestData({
              reqId: docket.docketNumber || docket.id || targetId,
              productName: docket.issueCategory || docket.description || 'Solar AMC Onboarding',
              stageName: (docket.status || 'Under Review').replace(/_/g, ' '),
              requestDate: docket.createdAt ? new Date(docket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
              rawStatus: (docket.status || '').toUpperCase(),
              address: docket.siteAddress || undefined,
            });
            return;
          }
        } catch {
          // fallback to my-requests below
        }
      }

      const reqs = await amcApi.getMyAmcRequests();
      const list = Array.isArray(reqs) ? reqs : [];
      const match = targetId
        ? list.find((r: any) => r.id === targetId || r.docketNumber === targetId || r.requestNumber === targetId)
        : list[0];

      if (match) {
        setRequestData({
          reqId: match.docketNumber || match.requestNumber || match.id || 'AMC Request',
          productName: match.product?.name || match.productType || match.notes?.split('\n')[0] || 'Solar AMC Onboarding',
          stageName: (match.status || 'Under Review').replace(/_/g, ' '),
          requestDate: match.createdAt ? new Date(match.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          rawStatus: (match.status || '').toUpperCase(),
          address: match.address || undefined,
        });
      } else if (!targetId) {
        setError('No active AMC requests found.');
      } else {
        setError('AMC request not found.');
      }
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load request status.');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const rawStatus = requestData.rawStatus;
  const progressed = ['IN_PROGRESS', 'ASSIGNED', 'IN_REVIEW', 'QUOTE_SHARED', 'NEGOTIATION', 'COMPLETED', 'RESOLVED', 'CLOSED_OTP_VERIFIED'];
  const stageIdx = progressed.includes(rawStatus) ? 2 : rawStatus === 'RESOLVED' || rawStatus === 'CLOSED_OTP_VERIFIED' ? 6 : 1;

  const STAGES = [
    { id: 1, title: 'Request Submitted', desc: 'Your request is being reviewed.', status: 'completed' },
    { id: 2, title: 'Under Review', desc: 'Our team is reviewing your request.', status: stageIdx >= 1 ? 'completed' : 'pending' },
    { id: 3, title: 'Visit Scheduled', desc: 'Technician visit scheduling.', status: stageIdx >= 2 ? 'completed' : 'pending' },
    { id: 4, title: 'Quotation', desc: 'Quotation shared by our team.', status: rawStatus === 'QUOTE_SHARED' ? 'active' : stageIdx >= 3 ? 'completed' : 'pending' },
    { id: 5, title: 'Negotiation', desc: 'Discussing final price.', status: negotiationRequested ? 'active' : 'pending' },
    { id: 6, title: 'Contract Activated', desc: 'Your AMC plan is active.', status: ['ACTIVE', 'RESOLVED', 'CLOSED_OTP_VERIFIED'].includes(rawStatus) ? 'completed' : 'pending' },
  ];

  const renderHeader = () => (
    <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>AMC Request Status</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => onNavigate?.('help_center')}>
          <HeadphonesIcon size={18} color={COLORS.primaryDeep} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading request status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <LayoutGrid size={48} color={COLORS.textTertiary} />
          <Text style={styles.errorTitle}>{error}</Text>
          <Text style={styles.errorSub}>Submit an AMC request to start protecting your solar installation.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => onNavigate?.('buy_amc')}>
            <Text style={styles.retryBtnText}>Request AMC</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerCard}>
            <Text style={styles.reqId}>{requestData.reqId}</Text>
            <Text style={styles.productName}>{requestData.productName}</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{requestData.stageName}</Text>
            </View>
            {!!requestData.requestDate && (
              <View style={styles.dateRow}>
                <Calendar size={14} color={COLORS.textTertiary} />
                <Text style={styles.dateText}>Requested on {requestData.requestDate}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <View style={styles.timelineContainer}>
              {STAGES.map((step, index) => {
                const isLast = index === STAGES.length - 1;
                return (
                  <View key={step.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      {step.status === 'completed' ? (
                        <View style={styles.iconCircleCompleted}>
                          <CheckCircle2 size={16} color={COLORS.surface} />
                        </View>
                      ) : step.status === 'active' ? (
                        <View style={styles.iconCircleActive}>
                          <View style={styles.iconCircleActiveInner} />
                        </View>
                      ) : (
                        <View style={styles.iconCirclePending}>
                          <Clock size={16} color={COLORS.textTertiary} />
                        </View>
                      )}
                      {!isLast && <View style={[styles.timelineLine, step.status === 'completed' ? styles.lineCompleted : null]} />}
                    </View>
                    <View style={[styles.timelineRight, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }]}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.timelineTitle, step.status === 'pending' && { color: COLORS.textTertiary }]}>{step.title}</Text>
                        {!!step.desc && (
                          <Text style={[styles.timelineDesc, step.status === 'pending' && { color: COLORS.textTertiary }]}>{step.desc}</Text>
                        )}
                      </View>
                      {step.id === 4 && rawStatus === 'QUOTE_SHARED' && !negotiationRequested && (
                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                          <TouchableOpacity style={styles.actionBtn}>
                            <Check size={14} color={COLORS.surface} />
                            <Text style={styles.actionBtnText}>Accept Offer</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: COLORS.warning }]}
                            onPress={() => setNegotiationRequested(true)}
                          >
                            <MessageCircle size={14} color={COLORS.surface} />
                            <Text style={[styles.actionBtnText, { color: COLORS.surface }]}>Request Negotiation</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {step.id === 5 && negotiationRequested && (
                        <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.warning, fontStyle: 'italic', marginTop: 8 }}>
                          Request submitted
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
            <Text style={styles.sectionTitle}>Need Assistance?</Text>
            <Text style={styles.helpDesc}>Have questions regarding your AMC onboarding request? Reach out to support.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate?.('create_ticket', { relatedTo: requestData.reqId })}>
              <Text style={styles.primaryBtnText}>Raise a Support Query</Text>
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
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  reqId: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.info,
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 12,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 64,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  iconCircleCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircleActiveInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
  },
  iconCirclePending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
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
