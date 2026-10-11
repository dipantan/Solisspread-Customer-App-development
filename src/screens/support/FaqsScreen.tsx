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
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface FaqsScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
  categoryId?: number;
}

const FAQ_CATEGORIES = [
  { id: 1, title: 'AMC Plans' },
  { id: 2, title: 'Service Requests' },
  { id: 3, title: 'Payment & Billing' },
  { id: 4, title: 'Inverter Issues' },
];

const FAQS_DATA = {
  1: [
    { id: '1-1', q: 'What is covered under the AMC plan?', a: 'Our comprehensive AMC plan covers parts replacement, labor charges, and regular maintenance visits for your solar system.' },
    { id: '1-2', q: 'How do I renew my AMC?', a: 'You can renew your AMC directly from the "My AMC Plans" section in the app before it expires.' },
    { id: '1-3', q: 'Can I upgrade my current plan?', a: 'Yes, you can upgrade your plan at any time. The remaining balance of your current plan will be adjusted pro-rata.' },
  ],
  2: [
    { id: '2-1', q: 'How long does it take for a technician to arrive?', a: 'Typically, a technician will be assigned and visit your premises within 24-48 hours of raising a request.' },
    { id: '2-2', q: 'How can I track my service request?', a: 'You can track the real-time status of your request in the "My Service Requests" section.' },
  ],
  3: [
    { id: '3-1', q: 'What payment methods do you accept?', a: 'We accept Credit/Debit cards, UPI, Net Banking, and Wallets.' },
    { id: '3-2', q: 'Where can I download my invoice?', a: 'Invoices can be downloaded from the Order Details page or the AMC Details page.' },
    { id: '3-3', q: 'Is there any hidden charge?', a: 'No, all our pricing is transparent and includes GST. There are no hidden charges.' },
  ],
  4: [
    { id: '4-1', q: 'My inverter is beeping continuously. What should I do?', a: 'A continuous beep usually indicates an overload or a low battery warning. Try turning off heavy appliances.' },
    { id: '4-2', q: 'The inverter shows a red light.', a: 'A red light indicates a fault. Please raise a service request from the app for our technicians to inspect it.' },
  ],
};

export default function FaqsScreen({ onBack, onNavigate, categoryId = 1 }: FaqsScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(categoryId);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  useEffect(() => {
    setActiveCategory(categoryId);
  }, [categoryId]);

  useEffect(() => {
    const backAction = () => {
      if (onBack) {
        onBack();
        return true;
      } else if (onNavigate) {
        onNavigate('help_center');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack, onNavigate]);

  const handleBack = () => {
    if (onBack) onBack();
    else if (onNavigate) onNavigate('help_center');
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => prev === id ? null : id);
  };

  const currentFaqs = FAQS_DATA[activeCategory as keyof typeof FAQS_DATA] || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={handleBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'center', marginRight: 44 }]}>
          FAQs
        </Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive
                ]}
                onPress={() => {
                  setActiveCategory(cat.id);
                  setExpandedFaq(null);
                }}
              >
                <Text style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive
                ]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* FAQ List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {currentFaqs.map((faq, index) => {
          const isExpanded = expandedFaq === faq.id;
          return (
            <Animated.View
              key={faq.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
              layout={Layout.springify()}
              style={styles.faqCard}
            >
              <TouchableOpacity
                style={styles.faqHeader}
                activeOpacity={0.7}
                onPress={() => toggleFaq(faq.id)}
              >
                <Text style={[styles.faqQuestion, isExpanded && { color: COLORS.primary }]}>
                  {faq.q}
                </Text>
                {isExpanded ? (
                  <ChevronUp size={20} color={COLORS.primary} />
                ) : (
                  <ChevronDown size={20} color={COLORS.textTertiary} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              )}
            </Animated.View>
          );
        })}

        {currentFaqs.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No FAQs found for this category.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  categoriesWrapper: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  faqCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 16,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  }
});
