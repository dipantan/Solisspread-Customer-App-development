import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  BackHandler,
  Linking,
} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HeadphonesIcon,
  CheckCircle2,
  Phone,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import * as amcApi from '../../api/amc';

const { width } = Dimensions.get('window');

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Pending',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route',
  ON_SITE: 'On Site',
  ON_SITE_DIAGNOSIS: 'On Site',
  IN_PROGRESS: 'In Progress',
  PARTS_PENDING: 'Parts Pending',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  CLOSED_OTP_VERIFIED: 'Closed',
  CANCELLED: 'Cancelled',
};

const STEP_TITLES: Record<string, string> = {
  REQUESTED: 'Request Submitted',
  ASSIGNED: 'Technician Assigned',
  EN_ROUTE: 'Technician On The Way',
  ON_SITE: 'Technician Arrived',
  ON_SITE_DIAGNOSIS: 'Technician Arrived',
  IN_PROGRESS: 'In Progress',
  PARTS_PENDING: 'Waiting For Parts',
  RESOLVED: 'Service Completed',
  CLOSED: 'Closed',
  CLOSED_OTP_VERIFIED: 'Closed',
  CANCELLED: 'Cancelled',
};

const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function ServiceRequestDetailsScreen({
  onBack,
  onNavigate,
  id,
}: {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
  id?: string;
}) {
  const insets = useSafeAreaInsets();
  const [docket, setDocket] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    amcApi
      .getDocket(id)
      .then((d) => setDocket(d))
      .catch(() => setDocket(null))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const logs: any[] = Array.isArray(docket?.logs) ? docket.logs : [];
  const timeline = logs.length
    ? logs.map((log: any, idx: number) => ({
        id: log.id || idx,
        title: STEP_TITLES[log.newStatus] || log.newStatus,
        date: fmtDateTime(log.createdAt),
        desc: log.notes || '',
        status: idx === logs.length - 1 ? 'active' : 'completed',
      }))
    : docket
      ? [
          {
            id: 1,
            title: 'Request Submitted',
            date: fmtDateTime(docket.createdAt),
            desc: 'Your service request has been submitted successfully.',
            status: 'completed',
          },
        ]
      : [];
  if (timeline.length > 1) {
    timeline[timeline.length - 1].status = 'active';
  }

  const tech = docket?.assignedTechnician?.user || docket?.assignedTechnician;
  const amcContract = docket?.amcContract;

  const renderHeader = () => (
    <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Service Request Details</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => onNavigate?.('help_center')}>
          <HeadphonesIcon size={18} color={COLORS.primaryDeep} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.reqCard}>
          <Text style={styles.reqLabel}>Request ID</Text>
          <View style={styles.reqIdRow}>
            <Text style={styles.reqId}>{docket?.docketNumber || (loading ? '…' : '—')}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {STATUS_LABELS[docket?.status] || (loading ? 'Loading' : 'Pending')}
              </Text>
            </View>
          </View>
          <Text style={styles.reqDate}>Requested on: {fmtDateTime(docket?.createdAt)}</Text>
        </Animated.View>

        {timeline.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Service Progress</Text>
            <View style={styles.timelineContainer}>
              {timeline.map((step, index) => {
                const isLast = index === timeline.length - 1;
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
                          <CheckCircle2 size={16} color={COLORS.borderDark} />
                        </View>
                      )}
                      {!isLast && <View style={[styles.timelineLine, step.status === 'completed' ? styles.lineCompleted : null]} />}
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={[styles.timelineTitle, step.status === 'pending' && { color: COLORS.textSecondary }]}>{step.title}</Text>
                      <Text style={styles.timelineDate}>{step.date}</Text>
                      {!!step.desc && <Text style={styles.timelineDesc}>{step.desc}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <View style={styles.detailsCard}>
            {amcContract && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>AMC Plan</Text>
                <View style={styles.planLinkRow}>
                  <Text style={styles.detailValueBold}>{amcContract.contractNumber}</Text>
                  <Text style={styles.activeText}> [{amcContract.status}]</Text>
                  <ChevronRight size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                </View>
              </View>
            )}

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Product</Text>
              <Text style={styles.detailValue}>{docket?.relatedTo || docket?.siteAddress || docket?.branch?.name || '—'}</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Issue Category</Text>
              <Text style={styles.detailValueBoldDark}>{docket?.issueCategory || '—'}</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Problem Description</Text>
              <Text style={styles.detailValue}>{docket?.description || '—'}</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Preferred Date & Time</Text>
              <Text style={styles.detailValue}>{docket?.scheduledAt ? fmtDateTime(docket.scheduledAt) : '—'}</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{docket?.siteAddress || '—'}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Technician Details</Text>
          <View style={styles.techCard}>
            {tech ? (
              <>
                <View style={styles.techInfoRow}>
                  <View style={styles.techAvatarPlaceholder}>
                    <Text style={styles.techAvatarText}>{(tech.fullName || 'T').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.techInfo}>
                    <Text style={styles.techName}>{tech.fullName}</Text>
                    {!!tech.phoneNumber && <Text style={styles.techSub}>{tech.phoneNumber}</Text>}
                  </View>
                  <View style={styles.techBadge}>
                    <Text style={styles.techBadgeText}>Assigned</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => tech.phoneNumber && Linking.openURL(`tel:${tech.phoneNumber}`)}
                >
                  <Phone size={16} color={COLORS.primary} />
                  <Text style={styles.callBtnText}>Call Technician</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.timelineDesc}>A technician will be assigned to your request shortly.</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Service Completed?</Text>
            <Text style={styles.reviewSub}>If the issue has been resolved, you can rate our service.</Text>
            <TouchableOpacity style={styles.rateBtn}>
              <Text style={styles.rateBtnText}>Rate & Review</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.section}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeaderRow}>
              <HeadphonesIcon size={20} color={COLORS.primary} />
              <Text style={styles.helpTitle}>Need Help?</Text>
            </View>
            <Text style={styles.helpSub}>Contact our support team if you need any assistance.</Text>
            <TouchableOpacity style={styles.contactBtn} onPress={() => onNavigate?.('help_center')}>
              <Text style={styles.contactBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </Animated.ScrollView>
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
    gap: 12,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  reqCard: {
    backgroundColor: COLORS.infoLight + '30',
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  reqLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  reqIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reqId: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  statusBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reqDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  iconCircleCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  iconCircleActiveInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  iconCirclePending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.borderDark,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: COLORS.primary,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailGroup: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  detailValueBoldDark: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  planLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  techCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  techInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  techAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  techAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  techInfo: {
    flex: 1,
  },
  techName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  techSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  techBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  techBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewCard: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  reviewSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  rateBtn: {
    backgroundColor: COLORS.surface,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  rateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  helpCard: {
    backgroundColor: COLORS.infoLight + '30',
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  helpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  helpSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  contactBtn: {
    backgroundColor: COLORS.surface,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
    ...SHADOWS.soft,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
