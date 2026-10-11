import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Filter,
  ChevronRight,
  HeadphonesIcon,
  Plus,
  BookOpen,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TICKETS = [
  {
    id: '#TKT2505123',
    status: 'Open',
    statusColor: COLORS.success,
    statusBg: COLORS.successAlt + '15',
    subject: 'Inverter is not turning on',
    category: 'Technical Issue',
    subCategory: 'Inverter',
    date: '12 May 2025, 10:30 AM',
  },
  {
    id: '#TKT2505119',
    status: 'In Progress',
    statusColor: COLORS.warning,
    statusBg: COLORS.warning + '15',
    subject: 'Solar app not showing data',
    category: 'Technical Issue',
    subCategory: 'Monitoring',
    date: '11 May 2025, 03:15 PM',
  },
  {
    id: '#TKT2505112',
    status: 'Waiting for Reply',
    statusColor: COLORS.info,
    statusBg: COLORS.info + '15',
    subject: 'AMC plan information',
    category: 'General Query',
    subCategory: 'AMC',
    date: '10 May 2025, 11:45 AM',
  },
  {
    id: '#TKT2505105',
    status: 'Resolved',
    statusColor: COLORS.textSecondary,
    statusBg: COLORS.backgroundLight,
    subject: 'Need help with registration',
    category: 'Account & Billing',
    subCategory: 'Registration',
    date: '09 May 2025, 09:20 AM',
  },
  {
    id: '#TKT2505098',
    status: 'Closed',
    statusColor: COLORS.textSecondary,
    statusBg: COLORS.backgroundLight,
    subject: 'Payment failed but amount deducted',
    category: 'Billing Issue',
    subCategory: 'Payment',
    date: '08 May 2025, 05:40 PM',
  },
];

interface SupportTicketsScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function SupportTicketsScreen({ onBack, onNavigate }: SupportTicketsScreenProps) {
  const insets = useSafeAreaInsets();

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
            Support Tickets
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
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

            {/* Ticket List */}
            {TICKETS.map((ticket, index) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                activeOpacity={0.7}
                onPress={() => onNavigate?.('ticket_details', { ticketId: ticket.id })}
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
            ))}

            {/* Help Center Box */}
            <View style={styles.helpCenterBox}>
              <View style={styles.helpCenterRow}>
                <View style={styles.helpCenterIconBox}>
                  <BookOpen size={24} color={COLORS.primary} />
                </View>
                <View style={styles.helpCenterTextContainer}>
                  <Text style={styles.helpCenterTitle}>Can't find your answer?</Text>
                  <Text style={styles.helpCenterSub}>Check our Help Center for quick solutions to common questions.</Text>
                  <TouchableOpacity style={styles.helpCenterBtn} activeOpacity={0.8}>
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
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },

  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
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
    fontSize: 14,
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
  ticketBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
    paddingRight: 12,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginBottom: 6,
  },
  ticketCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ticketDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  helpCenterBox: {
    backgroundColor: COLORS.successLightBorder,
    borderRadius: RADIUS.card,
    padding: 16,
    marginTop: 8,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.successAlt,
  },
  helpCenterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpCenterIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.success + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  helpCenterTextContainer: {
    flex: 1,
  },
  helpCenterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.successAlt,
    marginBottom: 4,
  },
  helpCenterSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  helpCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpCenterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
});
