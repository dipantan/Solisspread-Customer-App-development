import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  BackHandler,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  User,
  HeadphonesIcon,
  ChevronDown,
  ChevronRight,
  Send,
  FileText,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as amcApi from '../../api/amc';
import { ApiError } from '../../api/client';

interface TicketDetailsScreenProps {
  id?: string;
  ticketId?: string;
  docketId?: string;
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const DOCKET_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Open',
  TRIAGED: 'Open',
  ASSIGNED: 'In Progress',
  EN_ROUTE: 'In Progress',
  ON_SITE_DIAGNOSIS: 'In Progress',
  PARTS_REQUISITION: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED_OTP_VERIFIED: 'Resolved',
  CANCELLED: 'Closed',
};

const STATUS_STEP_TITLE: Record<string, string> = {
  REQUESTED: 'Submitted',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  EN_ROUTE: 'En Route',
  ON_SITE_DIAGNOSIS: 'Diagnosis',
  PARTS_REQUISITION: 'Parts Pending',
  RESOLVED: 'Resolved',
  CLOSED_OTP_VERIFIED: 'Closed',
  CANCELLED: 'Cancelled',
};

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return { color: COLORS.success, bg: COLORS.successAlt + '15' };
    case 'closed':
    case 'resolved':
      return { color: COLORS.textTertiary, bg: COLORS.border };
    case 'in progress':
      return { color: COLORS.warning, bg: COLORS.warning + '15' };
    default:
      return { color: COLORS.primary, bg: COLORS.primary + '15' };
  }
};

export default function TicketDetailsScreen({ id, ticketId, docketId, onBack, onNavigate }: TicketDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [viewLess, setViewLess] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<any>(null);

  const targetId = id || ticketId || docketId;

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: any = null;
      if (targetId) {
        try {
          data = await amcApi.getDocket(targetId);
        } catch {
          // fallback
        }
      }

      if (!data) {
        const list = await amcApi.listSupportTickets();
        const found = targetId
          ? list.find((t: any) => t.id === targetId || t.docketNumber === targetId)
          : list[0];
        if (found) {
          data = await amcApi.getDocket(found.id).catch(() => found);
        }
      }

      if (!data) {
        setError('Support ticket not found.');
        setTicket(null);
        return;
      }

      const label = DOCKET_STATUS_LABELS[data.status] || data.status || 'Open';
      const logs: any[] = Array.isArray(data.logs) ? data.logs : [];
      const hasSubmittedLog = logs.some((l: any) => l.newStatus === 'REQUESTED');
      const steps = [
        ...(hasSubmittedLog ? [] : [{
          id: 0,
          title: 'Submitted',
          time: fmtDateTime(data.createdAt),
          desc: 'Your request has been submitted successfully.',
          status: 'completed',
        }]),
        ...logs.map((l: any, i: number) => ({
          id: i + 1,
          title: STATUS_STEP_TITLE[l.newStatus] || l.newStatus,
          time: fmtDateTime(l.createdAt),
          desc: l.notes || '',
          status: 'completed',
        })),
      ];

      const attachments = (data.photos || []).map((url: string, idx: number) => ({
        id: String(idx),
        type: url.toLowerCase().endsWith('.mp4') ? 'video' : 'image',
        source: { uri: url },
      }));

      const messages = [
        {
          id: 'm-initial',
          sender: 'user',
          name: 'You',
          time: fmtDateTime(data.createdAt),
          text: data.description || 'Support ticket created.',
        },
        ...logs.filter((l: any) => Boolean(l.notes)).map((l: any, idx: number) => ({
          id: `m-log-${idx}`,
          sender: 'support',
          name: 'Support Team',
          time: fmtDateTime(l.createdAt),
          text: l.notes,
        })),
      ];

      setTicket({
        id: data.docketNumber || data.id,
        status: label,
        subject: data.subject || data.issueCategory || 'Support Ticket',
        category: data.issueCategory || data.category || 'General',
        subCategory: data.subCategory || 'General',
        createdAt: fmtDateTime(data.createdAt),
        relatedTo: data.relatedTo || 'General Support',
        installationId: data.projectId || data.amcContractId || '—',
        preferredContact: data.preferredContact || 'Email',
        description: data.description || '',
        steps,
        attachments,
        messages,
        technician: data.assignedTechnician,
      });
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    const backAction = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]);

  const renderHeader = () => (
    <View style={COMMON_STYLES.header}>
      <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
        <ArrowLeft size={24} color={COLORS.primaryDeep} />
      </TouchableOpacity>
      <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'center', marginRight: 16 }]}>
        Ticket Details
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );

  if (loading) {
    return (
      <MainLayout hideHeader={true} onTabChange={onNavigate}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {renderHeader()}
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading ticket details...</Text>
          </View>
        </SafeAreaView>
      </MainLayout>
    );
  }

  if (error || !ticket) {
    return (
      <MainLayout hideHeader={true} onTabChange={onNavigate}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {renderHeader()}
          <View style={styles.centerBox}>
            <AlertCircle size={44} color={COLORS.warning} />
            <Text style={styles.errorTitle}>{error || 'Ticket Not Found'}</Text>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Back to Support Tickets</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </MainLayout>
    );
  }

  const statusStyle = getStatusStyle(ticket.status);

  return (
    <MainLayout hideHeader={true} onTabChange={onNavigate}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            {/* Top Info Card */}
            <View style={styles.topCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketId}>{ticket.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{ticket.status}</Text>
                </View>
              </View>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <Text style={styles.ticketCategory}>{ticket.category} • {ticket.subCategory}</Text>
              <Text style={styles.ticketDate}>Created on: {ticket.createdAt}</Text>
            </View>

            {/* Ticket Status Stepper */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ticket Status</Text>
              <View style={styles.stepperContainer}>
                {ticket.steps.map((step: any, index: number) => {
                  const isLast = index === ticket.steps.length - 1;
                  return (
                    <React.Fragment key={step.id}>
                      <View style={styles.stepBox}>
                        <CheckCircle2 size={22} color={COLORS.primary} fill={COLORS.primary} />
                        <Text style={styles.stepTextActive}>{step.title}</Text>
                        <Text style={styles.stepTime}>{step.time}</Text>
                      </View>
                      {!isLast && <View style={styles.stepLineActive} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

            {/* Ticket Details Table */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ticket Details</Text>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{ticket.category}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sub Category</Text>
                  <Text style={styles.detailValue}>{ticket.subCategory}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Related To</Text>
                  <Text style={styles.detailValue}>{ticket.relatedTo}</Text>
                </View>

                {!viewLess && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Installation ID</Text>
                      <Text style={styles.detailValue}>{ticket.installationId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Preferred Contact</Text>
                      <Text style={styles.detailValue}>{ticket.preferredContact}</Text>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.viewLessBtn}
                  activeOpacity={0.8}
                  onPress={() => setViewLess(!viewLess)}
                >
                  <Text style={styles.viewLessText}>{viewLess ? 'View More' : 'View Less'}</Text>
                  <ChevronDown size={16} color={COLORS.primary} style={{ transform: [{ rotate: viewLess ? '0deg' : '180deg' }] }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descCard}>
                <Text style={styles.descText}>{ticket.description || 'No detailed description provided.'}</Text>
              </View>
            </View>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attachments ({ticket.attachments.length})</Text>
                <View style={styles.attachmentsRow}>
                  {ticket.attachments.map((attachment: any) => (
                    <View key={attachment.id} style={styles.attachmentBox}>
                      <Image
                        source={attachment.source}
                        style={styles.attachmentImg}
                      />
                      {attachment.type === 'video' && (
                        <View style={styles.playOverlay}>
                          <Play size={16} color={COLORS.surface} fill={COLORS.surface} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Messages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Updates & Logs</Text>
              {ticket.messages.map((msg: any, index: number) => {
                const isUser = msg.sender === 'user';
                return (
                  <View key={msg.id} style={styles.messageTimelineRow}>
                    <View style={styles.msgAvatarCol}>
                      {isUser ? (
                        <View style={styles.msgUserAvatar}>
                          <User size={16} color={COLORS.surface} />
                        </View>
                      ) : (
                        <View style={styles.msgSupportAvatar}>
                          <HeadphonesIcon size={16} color={COLORS.surface} />
                        </View>
                      )}
                      {index !== ticket.messages.length - 1 && (
                        <View style={styles.msgTimelineLine} />
                      )}
                    </View>
                    <View style={styles.msgBubble}>
                      <View style={styles.msgBubbleHeader}>
                        <Text style={styles.msgAuthor}>{msg.name}</Text>
                        <Text style={styles.msgTime}>{msg.time}</Text>
                      </View>
                      <Text style={styles.msgText}>{msg.text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  topCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  ticketCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  ticketDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  stepBox: {
    alignItems: 'center',
    flex: 1,
  },
  stepTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginTop: 4,
  },
  stepTime: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  stepLineActive: {
    height: 2,
    backgroundColor: COLORS.primary,
    flex: 1,
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  viewLessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 4,
  },
  viewLessText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  descCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  descText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  attachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attachmentBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentImg: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageTimelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  msgAvatarCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  msgUserAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgSupportAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.info,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgTimelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  msgBubble: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  msgBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  msgAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  msgTime: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  msgText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  centerBox: {
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
  },
  backButtonText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
