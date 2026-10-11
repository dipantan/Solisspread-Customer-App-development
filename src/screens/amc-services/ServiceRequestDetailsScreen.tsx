import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  BackHandler,
} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HeadphonesIcon,
  CheckCircle2,
  Circle,
  Phone,
  ChevronRight,
  Star,
  ShieldCheck,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';

const { width } = Dimensions.get('window');

const TIMELINE = [
  { id: 1, title: 'Request Submitted', date: '08 May 2025, 10:30 AM', desc: 'Your service request has been submitted successfully.', status: 'completed' },
  { id: 2, title: 'In Progress', date: '08 May 2025, 11:15 AM', desc: 'Our technician has been assigned and is on the way.', status: 'active' },
  { id: 3, title: 'Technician Arrived', date: 'Pending', desc: '', status: 'pending' },
  { id: 4, title: 'Service Completed', date: 'Pending', desc: '', status: 'pending' },
  { id: 5, title: 'Closed', date: 'Pending', desc: '', status: 'pending' },
];

export default function ServiceRequestDetailsScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (step: any, params?: any) => void }) {
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
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
        <Text style={COMMON_STYLES.headerTitle}>Service Request Details</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => {}}>
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
            <Text style={styles.reqId}>SR202500123</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>In Progress</Text>
            </View>
          </View>
          <Text style={styles.reqDate}>Requested on: 08 May 2025, 10:30 AM</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Service Progress</Text>
          <View style={styles.timelineContainer}>
            {TIMELINE.map((step, index) => {
              const isLast = index === TIMELINE.length - 1;
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

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>AMC Plan</Text>
              <View style={styles.planLinkRow}>
                <Text style={styles.detailValueBold}>AMC2025001</Text>
                <Text style={styles.activeText}> [Active]</Text>
                <ChevronRight size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
              </View>
            </View>
            
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Product</Text>
              <Text style={styles.detailValue}>Waaree 5kW Solar System</Text>
            </View>
            
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Issue Category</Text>
              <Text style={styles.detailValueBoldDark}>Inverter Issue</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Problem Description</Text>
              <Text style={styles.detailValue}>Inverter is showing error code E-12 and system is not generating power.</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Preferred Date & Time</Text>
              <Text style={styles.detailValue}>09 May 2025, Morning (9 AM - 12 PM)</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>123, Green Street, Katwa, Purba Bardhaman, West Bengal - 713150</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Technician Details</Text>
          <View style={styles.techCard}>
            <View style={styles.techInfoRow}>
              <View style={styles.techAvatarPlaceholder}>
                <Text style={styles.techAvatarText}>R</Text>
              </View>
              <View style={styles.techInfo}>
                <Text style={styles.techName}>Rahul Kumar</Text>
                <Text style={styles.techSub}>Technician ID: TECH1025</Text>
                <Text style={styles.techSub}>Experience: 5+ Years</Text>
              </View>
              <View style={styles.techBadge}>
                <Text style={styles.techBadgeText}>Assigned</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Phone size={16} color={COLORS.primary} />
              <Text style={styles.callBtnText}>Call Technician</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.contactBtn}>
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
