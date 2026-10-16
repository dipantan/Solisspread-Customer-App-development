import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  ChevronRight,
  HeadphonesIcon,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as amcApi from '../../api/amc';
import { ApiError } from '../../api/client';

interface SupportTicketsScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

interface TicketRow {
  id: string;
  docketId: string;
  status: string;
  statusColor: string;
  statusBg: string;
  subject: string;
  category: string;
  subCategory: string;
  date: string;
}

export default function SupportTicketsScreen({ onBack, onNavigate }: SupportTicketsScreenProps) {
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapTicketStatus = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'RESOLVED' || s === 'CLOSED_OTP_VERIFIED') {
      return { label: 'Resolved', color: COLORS.textSecondary, bg: COLORS.backgroundLight };
    }
    if (s === 'CANCELLED') {
      return { label: 'Closed', color: COLORS.error, bg: COLORS.errorLight };
    }
    if (s && s !== 'REQUESTED') {
      return { label: 'In Progress', color: COLORS.warning, bg: COLORS.warning + '15' };
    }
    return { label: 'Open', color: COLORS.success, bg: COLORS.successAlt + '15' };
  };

  const loadTickets = useCallback(async () => {
    setError(null);
    try {
      const data = await amcApi.listSupportTickets();
      const rows: TicketRow[] = (Array.isArray(data) ? data : []).map((t: any) => {
        const meta = mapTicketStatus(t.status);
        return {
          id: t.docketNumber || t.id,
          docketId: t.id,
          status: meta.label,
          statusColor: meta.color,
          statusBg: meta.bg,
          subject: t.subject || t.issueCategory || 'Support Ticket',
          category: t.issueCategory || t.category || 'General Query',
          subCategory: t.subCategory || 'General',
          date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        };
      });
      setTickets(rows);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load your tickets.');
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

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

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  return (
    <MainLayout hideHeader={true} onTabChange={onNavigate}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Custom Header */}
        <View style={COMMON_STYLES.header}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={24} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'center', marginRight: 16 }]}>
            Support Tickets
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            {/* Help Banner */}
            <View style={styles.helpBanner}>
              <View style={styles.helpBannerRow}>
                <View style={styles.iconCircle}>
                  <HeadphonesIcon size={24} color={COLORS.primary} />
                </View>
                <View style={styles.helpBannerTextContainer}>
                  <Text style={styles.helpBannerTitle}>How can we help you?</Text>
                  <Text style={styles.helpBannerSub}>Raise a ticket and our support team will get back to you.</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.createBtn}
                activeOpacity={0.8}
                onPress={() => onNavigate?.('create_ticket')}
              >
                <Plus size={18} color={COLORS.surface} style={{ marginRight: 8 }} />
                <Text style={styles.createBtnText}>Create New Ticket</Text>
              </TouchableOpacity>
            </View>

            {/* List Header */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>My Tickets</Text>
            </View>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.centerText}>Loading your support tickets...</Text>
              </View>
            ) : error ? (
              <View style={styles.emptyCard}>
                <AlertCircle size={36} color={COLORS.warning} />
                <Text style={styles.emptyTitle}>{error}</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={loadTickets}>
                  <Text style={styles.emptyBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText size={40} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No Support Tickets Yet</Text>
                <Text style={styles.emptySub}>When you submit a support request or question, it will show up here.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate?.('create_ticket')}>
                  <Text style={styles.emptyBtnText}>Raise a Ticket</Text>
                </TouchableOpacity>
              </View>
            ) : (
              tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  activeOpacity={0.7}
                  onPress={() => onNavigate?.('ticket_details', { id: ticket.docketId || ticket.id, docketId: ticket.docketId })}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketId}>{ticket.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: ticket.statusBg }]}>
                      <Text style={[styles.statusText, { color: ticket.statusColor }]}>{ticket.status}</Text>
                    </View>
                  </View>

                  <View style={styles.ticketBodyRow}>
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                      <Text style={styles.ticketCategory}>
                        {ticket.category} • {ticket.subCategory}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={COLORS.textTertiary} />
                  </View>

                  <Text style={styles.ticketDate}>Created on: {ticket.date}</Text>
                </TouchableOpacity>
              ))
            )}

            {/* Help Center Box */}
            <View style={styles.helpCenterBox}>
              <View style={styles.helpCenterRow}>
                <View style={styles.helpCenterIconBox}>
                  <BookOpen size={24} color={COLORS.primary} />
                </View>
                <View style={styles.helpCenterTextContainer}>
                  <Text style={styles.helpCenterTitle}>Can't find your answer?</Text>
                  <Text style={styles.helpCenterSub}>Check our Help Center for quick solutions to common questions.</Text>
                  <TouchableOpacity
                    style={styles.helpCenterBtn}
                    activeOpacity={0.8}
                    onPress={() => onNavigate?.('help_center')}
                  >
                    <Text style={styles.helpCenterBtnText}>Go to Help Center</Text>
                    <ChevronRight size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
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
  helpBanner: {
    backgroundColor: COLORS.secondary + '20',
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  helpBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  helpBannerTextContainer: {
    flex: 1,
  },
  helpBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  helpBannerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  createBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 13,
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
  ticketBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 8,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  ticketCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ticketDate: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  helpCenterBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  helpCenterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpCenterIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  helpCenterTextContainer: {
    flex: 1,
  },
  helpCenterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  helpCenterSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  helpCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpCenterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  centerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyBtn: {
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
  },
  emptyBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 13,
  },
});
