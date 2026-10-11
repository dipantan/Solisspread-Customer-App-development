import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Sun,
  Settings,
  HeadphonesIcon,
  MessageCircle,
  PhoneCall,
  ChevronRight,
  FileText,
  ShieldCheck,
  Calculator,
  Shield,
  PenTool,
} from 'lucide-react-native';
import { Linking } from 'react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { getContactInfo } from '../../api/settings';

interface HelpCenterScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const POPULAR_TOPICS = [
  {
    id: 1,
    title: 'How does AMC work?',
    desc: 'Learn about our AMC plans and benefits.',
    icon: <Shield size={22} color={COLORS.primary} />,
    color: COLORS.primary + '15',
  },
  {
    id: 2,
    title: 'How to request a service?',
    desc: 'Steps to raise a service request.',
    icon: <PenTool size={22} color={COLORS.success} />,
    color: COLORS.successAlt + '15',
  },
  {
    id: 3,
    title: 'Payment & Billing',
    desc: 'Find answers about payments and invoices.',
    icon: <FileText size={22} color={COLORS.warning} />,
    color: COLORS.warning + '15',
  },
  {
    id: 4,
    title: 'Inverter Issues',
    desc: 'Troubleshoot common inverter problems.',
    icon: <Settings size={22} color={COLORS.accent} />,
    color: COLORS.accent + '15',
  },
  {
    id: 5,
    title: 'Solar System Maintenance Tips',
    desc: 'Keep your system running efficiently.',
    icon: <Sun size={22} color="#F59E0B" />,
    color: COLORS.accentLight,
  },
];

const FAQS = [
  {
    id: 1,
    question: 'What is covered under AMC?',
    answer: 'Our AMC covers regular maintenance, cleaning, performance checks, and replacement of certain parts depending on the specific plan you chose.',
  },
  {
    id: 2,
    question: 'How long does a typical service take?',
    answer: 'A routine check-up usually takes 1-2 hours. If parts need replacement, it might take longer based on availability.',
  },
  {
    id: 3,
    question: 'Can I upgrade my AMC plan later?',
    answer: 'Yes, you can upgrade your AMC plan at any time through the AMC section in the app.',
  },
];

export default function HelpCenterScreen({ onBack, onNavigate }: HelpCenterScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(1); // ID 1 expanded by default
  const [contact, setContact] = useState<{ phone?: string | null; whatsappNumber?: string | null }>({});
  const phoneDigits = (contact.phone || '+91 1800 123 4567').replace(/[^\d+]/g, '');
  const waDigits = (contact.whatsappNumber || contact.phone || '').replace(/[^\d]/g, '');

  useEffect(() => {
    getContactInfo().then(setContact).catch(() => {});
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'center', marginRight: 44 }]}>
          Help Center
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          {/* Welcome Banner */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Hi, how can we help you?</Text>
              <Text style={styles.welcomeDesc}>Find answers, guides and support for all your solar needs.</Text>

              <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.textTertiary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for help articles..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            <Image
              source={require('../../../assets/help_center_welcome.jpg')}
              style={styles.welcomeImg}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={() => onNavigate?.('service_request_list')}>
                <View style={[styles.quickActionIconBg, { backgroundColor: COLORS.primary + '15' }]}>
                  <FileText size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.quickActionText}>My Service{'\n'}Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={() => onNavigate?.('amc')}>
                <View style={[styles.quickActionIconBg, { backgroundColor: COLORS.successAlt + '15' }]}>
                  <ShieldCheck size={24} color={COLORS.success} />
                </View>
                <Text style={styles.quickActionText}>My AMC{'\n'}Plans</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={() => onNavigate?.('solar_calculator')}>
                <View style={[styles.quickActionIconBg, { backgroundColor: COLORS.warning + '15' }]}>
                  <Calculator size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.quickActionText}>Solar{'\n'}Calculator</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={() => onNavigate?.('support_tickets')}>
                <View style={[styles.quickActionIconBg, { backgroundColor: COLORS.accent + '15' }]}>
                  <PhoneCall size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.quickActionText}>Contact{'\n'}Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          {/* Popular Topics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Topics</Text>

            <View style={styles.topicsCard}>
              {POPULAR_TOPICS.map((topic, index) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicRow,
                    index === POPULAR_TOPICS.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => onNavigate?.('faqs', { categoryId: topic.id })}
                >
                  <View style={[styles.topicIconBg, { backgroundColor: topic.color }]}>
                    {topic.icon}
                  </View>
                  <View style={styles.topicContent}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <Text style={styles.topicDesc}>{topic.desc}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          {/* Support CTA */}
          <View style={styles.supportCard}>
            <View style={styles.supportHeaderRow}>
              <Image
                source={require('../../../assets/support_headset.jpg')}
                style={styles.supportImg}
                resizeMode="contain"
              />
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Need more help?</Text>
                <Text style={styles.supportDesc}>Our support team is here for you.</Text>
                <Text style={styles.supportSubDesc}>We usually reply within a few minutes.</Text>
              </View>
            </View>

            <View style={styles.supportBtnsRow}>
              <TouchableOpacity
                style={styles.chatBtn}
                activeOpacity={0.9}
                onPress={() => onNavigate?.('create_ticket')}
              >
                <MessageCircle size={16} color={COLORS.surface} />
                <Text style={styles.chatBtnText}>Chat with Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callBtn}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`tel:${phoneDigits}`)}
              >
                <PhoneCall size={16} color={COLORS.primary} />
                <Text style={styles.callBtnText}>Call Us: {contact.phone || '1800 123 4567'}</Text>
              </TouchableOpacity>

              {waDigits ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`https://wa.me/${waDigits}`)}
                >
                  <MessageCircle size={16} color={COLORS.primary} />
                  <Text style={styles.callBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 12,
  },

  // Welcome Banner
  welcomeCard: {
    backgroundColor: COLORS.infoLight, // Soft primary tint
    borderRadius: RADIUS.card,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 24,
    ...SHADOWS.soft,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  welcomeContent: {
    flex: 1,
    zIndex: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 6,
    lineHeight: 28,
    width: '65%',
  },
  welcomeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
    width: '65%',
  },
  welcomeImg: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 120,
    height: 120,
    opacity: 0.9,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.input,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...SHADOWS.soft,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  quickActionCard: {
    alignItems: 'center',
    width: '24%',
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Popular Topics
  topicsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topicIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  topicDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Support CTA
  supportCard: {
    backgroundColor: COLORS.border, // Light gray/blue
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.soft,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  supportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  supportImg: {
    width: 70,
    height: 70,
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  supportDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  supportSubDesc: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  supportBtnsRow: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 12,
  },
  chatBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
    ...SHADOWS.soft,
  },
  chatBtnText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  callBtn: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  callBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

});
