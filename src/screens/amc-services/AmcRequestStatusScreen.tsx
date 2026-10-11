import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
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
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';

const { width } = Dimensions.get('window');



export default function AmcRequestStatusScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (step: any, params?: any) => void }) {
  const insets = useSafeAreaInsets();
  const [negotiationRequested, setNegotiationRequested] = useState(false);
  const STAGES = [
    { id: 1, title: 'In Processing', desc: 'Your request is being reviewed.', status: 'completed' },
    { id: 2, title: 'Visiting Time', desc: 'Technician visited on 12 May 2025.', status: 'completed' },
    { id: 3, title: 'Quotation provided', desc: 'Initial quote provided: ₹1,15,000.', status: 'completed' },
    ...(negotiationRequested ? [
      { id: 4, title: 'Negotiation', desc: 'Discussing final price.', status: 'active' },
      { id: 5, title: 'Final Quotation', desc: 'Pending agreement.', status: 'pending' },
    ] : []),
    { id: 6, title: 'Payment', desc: 'Pending payment.', status: 'pending' },
  ];

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
        <Text style={COMMON_STYLES.headerTitle}>AMC Request Status</Text>
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
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerCard}>
            <Text style={styles.reqId}>REQ-2025-8942</Text>
            <Text style={styles.productName}>Waaree 5kW Solar System</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Negotiation Stage</Text>
            </View>
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
                           step.id === 3 ? (
                             <Text style={[styles.timelineDesc, step.status === 'pending' && { color: COLORS.textTertiary }]}>
                               Initial quote provided: <Text style={{ fontWeight: 'bold', color: COLORS.primaryDeep, fontSize: 13 }}>₹1,15,000</Text>.
                             </Text>
                           ) : (
                             <Text style={[styles.timelineDesc, step.status === 'pending' && { color: COLORS.textTertiary }]}>{step.desc}</Text>
                           )
                        )}
                      </View>
                      {step.id === 3 && !negotiationRequested && (
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
                      {step.id === 4 && negotiationRequested && (
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

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Quotation Details</Text>
            <View style={styles.quoteCard}>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Initial Quotation</Text>
                <Text style={styles.quoteAmount}>₹15,000</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Discount</Text>
                <Text style={styles.quoteDiscount}>- ₹1,500</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.quoteRow}>
                <Text style={styles.quoteTotalLabel}>Current Offer</Text>
                <Text style={styles.quoteTotalAmount}>₹13,500</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.actionContainer}>
            <TouchableOpacity style={styles.acceptBtn}>
              <CheckCircle2 size={20} color={COLORS.surface} />
              <Text style={styles.acceptBtnText}>Accept Offer (₹13,500)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.negotiateBtn, negotiationRequested && styles.negotiateBtnDisabled]}
              onPress={() => setNegotiationRequested(true)}
              disabled={negotiationRequested}
            >
              <FileText size={20} color={negotiationRequested ? COLORS.textTertiary : COLORS.primaryDeep} />
              <Text style={[styles.negotiateBtnText, negotiationRequested && { color: COLORS.textTertiary }]}>
                {negotiationRequested ? 'Negotiation Processing...' : 'Request for Negotiation'}
              </Text>
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
  headerCard: {
    backgroundColor: COLORS.infoLight + '50',
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  reqId: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.surface,
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
    backgroundColor: COLORS.success,
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
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 24,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  quoteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  quoteAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quoteDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  quoteTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  quoteTotalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    ...SHADOWS.soft,
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  documentBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  negotiateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryDeep,
    marginTop: 12,
  },
  negotiateBtnDisabled: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  negotiateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
});
