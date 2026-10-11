import React, { useState, useEffect } from 'react';
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
  Paperclip,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface TicketDetailsScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

// ============================================
// STATIC DATA (To be replaced with API later)
// ============================================
const TICKET_DATA = {
  id: '#TKT2505123',
  status: 'Open',
  subject: 'Inverter is not turning on',
  category: 'Technical Issue',
  subCategory: 'Inverter',
  createdAt: '12 May 2025, 10:30 AM',
  relatedTo: 'Waaree 5kW Solar System',
  installationId: 'INST2025001',
  preferredContact: 'Email',
  description: 'My inverter is not turning on since morning. The display is blank and no lights are showing.',

  steps: [
    {
      id: 1,
      title: 'Submitted',
      time: '12 May, 10:30 AM',
      status: 'completed', // completed, current, pending
    },
    {
      id: 2,
      title: 'In Progress',
      time: '12 May, 11:05 AM',
      status: 'completed',
    },
    {
      id: 3,
      title: 'Waiting for Reply',
      time: '12 May, 11:20 AM',
      status: 'current',
    },
    {
      id: 4,
      title: 'Resolved',
      time: '-',
      status: 'pending',
    },
  ],

  attachments: [
    { id: '1', type: 'image', source: require('../../../assets/solar_panel_product.png') },
    { id: '2', type: 'video', source: require('../../../assets/solar_panel_product.png') },
  ],

  messages: [
    {
      id: 'm1',
      sender: 'user',
      name: 'You',
      time: '12 May 2025, 10:30 AM',
      text: 'My inverter is not turning on since morning. Please help me resolve this issue.',
      image: require('../../../assets/solar_panel_product.png'),
    },
    {
      id: 'm2',
      sender: 'support',
      name: 'Support Team',
      time: '12 May 2025, 11:05 AM',
      text: 'Thank you for reaching out. Our technician has been assigned and will contact you soon.',
    },
    {
      id: 'm3',
      sender: 'user',
      name: 'You',
      time: '12 May 2025, 11:20 AM',
      text: 'Thank you.',
    },
  ],
};

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return { color: COLORS.success, bg: COLORS.successAlt + '15' };
    case 'closed':
    case 'resolved':
      return { color: COLORS.textTertiary, bg: COLORS.border };
    case 'in progress':
      return { color: COLORS.primary, bg: COLORS.primary + '15' };
    case 'pending':
    case 'waiting':
      return { color: COLORS.warning, bg: COLORS.warning + '15' };
    default:
      return { color: COLORS.primary, bg: COLORS.primary + '15' };
  }
};

export default function TicketDetailsScreen({ onBack, onNavigate }: TicketDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [viewLess, setViewLess] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Check if ticket is waiting for reply
  const isWaitingForReply = TICKET_DATA.steps.find(s => s.title === 'Waiting for Reply')?.status === 'current';

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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

  return (
    <MainLayout hideHeader={true} onTabChange={onNavigate}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Custom Header */}
        <View style={COMMON_STYLES.header}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={24} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'center', marginRight: 16 }]}>
            Ticket Details
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent, 
              { paddingBottom: isWaitingForReply ? keyboardHeight + 180 : insets.bottom + 100 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              {/* Top Info Card */}
              <View style={styles.topCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketId}>{TICKET_DATA.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(TICKET_DATA.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusStyle(TICKET_DATA.status).color }]}>{TICKET_DATA.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketSubject}>{TICKET_DATA.subject}</Text>
                <Text style={styles.ticketCategory}>{TICKET_DATA.category} • {TICKET_DATA.subCategory}</Text>
                <Text style={styles.ticketDate}>Created on: {TICKET_DATA.createdAt}</Text>
              </View>

              {/* Ticket Status Stepper */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ticket Status</Text>
                <View style={styles.stepperContainer}>
                  {TICKET_DATA.steps.map((step, index) => {
                    const isLast = index === TICKET_DATA.steps.length - 1;
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';
                    const isPending = step.status === 'pending';

                    return (
                      <React.Fragment key={step.id}>
                        <View style={styles.stepBox}>
                          {isCompleted && <CheckCircle2 size={24} color={COLORS.primary} fill={COLORS.primary} />}
                          {isCurrent && (
                            <View style={styles.stepCircleActive}>
                              <View style={styles.stepInnerCircle} />
                            </View>
                          )}
                          {isPending && <Circle size={24} color={COLORS.border} fill={COLORS.surface} />}

                          <Text style={isCompleted || isCurrent ? styles.stepTextActive : styles.stepText}>
                            {step.title}
                          </Text>
                          <Text style={styles.stepTime}>{step.time}</Text>
                        </View>

                        {!isLast && (
                          <View style={isCompleted || isCurrent ? styles.stepLineActive : styles.stepLine} />
                        )}
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
                    <Text style={styles.detailValue}>{TICKET_DATA.category}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sub Category</Text>
                    <Text style={styles.detailValue}>{TICKET_DATA.subCategory}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Related To</Text>
                    <Text style={styles.detailValue}>{TICKET_DATA.relatedTo}</Text>
                  </View>

                  {!viewLess && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Installation ID</Text>
                        <Text style={styles.detailValue}>{TICKET_DATA.installationId}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Preferred Contact</Text>
                        <Text style={styles.detailValue}>{TICKET_DATA.preferredContact}</Text>
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
                  <Text style={styles.descText}>
                    {TICKET_DATA.description}
                  </Text>
                </View>
              </View>

              {/* Attachments */}
              {TICKET_DATA.attachments.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Attachments ({TICKET_DATA.attachments.length})</Text>
                    <TouchableOpacity activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.viewAllText}>View All</Text>
                      <ChevronRight size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.attachmentsRow}>
                    {TICKET_DATA.attachments.map((attachment) => (
                      <View key={attachment.id} style={styles.attachmentBox}>
                        <Image
                          source={attachment.source}
                          style={styles.attachmentImg}
                          blurRadius={attachment.type === 'video' ? 10 : 0}
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
                <Text style={styles.sectionTitle}>Messages</Text>

                {TICKET_DATA.messages.map((msg, index) => {
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
                            <View style={styles.onlineDot} />
                          </View>
                        )}
                        {index !== TICKET_DATA.messages.length - 1 && (
                          <View style={styles.msgTimelineLine} />
                        )}
                      </View>
                      <View style={styles.msgContentCol}>
                        <View style={styles.msgHeader}>
                          <Text style={isUser ? styles.msgName : styles.msgNameSupport}>{msg.name}</Text>
                          <Text style={styles.msgTime}>{msg.time}</Text>
                        </View>
                        <View style={isUser ? styles.msgBubble : styles.msgBubbleSupport}>
                          <Text style={isUser ? styles.msgText : styles.msgTextSupport}>
                            {msg.text}
                          </Text>
                          {msg.image && (
                            <Image source={msg.image} style={styles.msgImg} />
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}

              </View>
            </Animated.View>
          </ScrollView>
          {/* Reply Input Bar */}
          {isWaitingForReply && (
            <View style={[
              styles.replyBar,
              {
                bottom: isKeyboardVisible
                  ? keyboardHeight + (Platform.OS === 'android' ? 45 : 0)
                  : 64 + Math.max(insets.bottom, 8)
              }
            ]}>
              <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
                <Paperclip size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <View style={styles.replyInputWrapper}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Type your reply here..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                />
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, replyText.trim().length > 0 && styles.sendBtnActive]}
                activeOpacity={0.8}
              >
                <Send size={18} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 8,
  },
  ticketCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  ticketDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  stepBox: {
    alignItems: 'center',
    width: 65,
  },
  stepCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  stepTextActive: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginTop: 8,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  stepTime: {
    fontSize: 9,
    color: COLORS.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  stepLineActive: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.primary,
    marginTop: 12,
    marginHorizontal: 4,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginTop: 12,
    marginHorizontal: 4,
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    flex: 1,
    textAlign: 'right',
  },
  viewLessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  viewLessText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  descCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  descText: {
    fontSize: 14,
    color: COLORS.primaryDeep,
    lineHeight: 22,
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  attachmentBox: {
    width: 100,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageTimelineRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  msgAvatarCol: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  msgUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.info,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgSupportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.successAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.successAlt,
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  msgTimelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  msgContentCol: {
    flex: 1,
    paddingBottom: 24,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  msgName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  msgNameSupport: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.successAlt,
  },
  msgTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  msgBubble: {
    backgroundColor: COLORS.infoLight,
    padding: 16,
    borderRadius: 12,
    borderTopLeftRadius: 4,
  },
  msgBubbleSupport: {
    backgroundColor: COLORS.successLight,
    padding: 16,
    borderRadius: 12,
    borderTopLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    color: COLORS.primaryDeep,
    lineHeight: 22,
  },
  msgTextSupport: {
    fontSize: 14,
    color: COLORS.primaryDeep,
    lineHeight: 22,
  },
  msgImg: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginTop: 12,
  },
  replyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.card,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
  },
  attachBtn: {
    padding: 8,
    marginRight: 8,

  },
  replyInputWrapper: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.input,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    minHeight: 20,
    maxHeight: 100,
    justifyContent: 'center',
  },
  replyInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
});
