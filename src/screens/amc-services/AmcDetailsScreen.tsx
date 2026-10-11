import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, Calendar, MapPin, Package, FileText, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';

interface AmcDetailsScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const COVERAGE_POINTS = [
  "Free periodic maintenance visits",
  "Priority support for breakdowns",
  "Free replacement of minor parts",
  "Zero labor charges for repairs",
  "24/7 technical helpline access"
];

export default function AmcDetailsScreen({ onBack, onNavigate }: AmcDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const [isCoverageExpanded, setIsCoverageExpanded] = useState(false);

  useEffect(() => {
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
        <Text style={COMMON_STYLES.headerTitle}>AMC Details</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <ShieldCheck size={24} color={COLORS.success} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.planTitle}>Luminous Solar Panel - 5kW</Text>
              <Text style={styles.planSubtitle}>AMC ID: AMC-2024-001</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>12 Jan 2024</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailValue}>11 Jan 2025</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { marginTop: 16 }]}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={[styles.detailValue, { color: COLORS.primaryDeep }]}>₹1,499</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>Online (UPI)</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Coverage Details</Text>
          {COVERAGE_POINTS.slice(0, isCoverageExpanded ? COVERAGE_POINTS.length : 2).map((point, index) => (
            <View key={index} style={styles.listItem}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <Text style={styles.listText}>{point}</Text>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.toggleBtn} 
            onPress={() => setIsCoverageExpanded(!isCoverageExpanded)}
          >
            <Text style={styles.toggleBtnText}>
              {isCoverageExpanded ? 'See Less' : 'See All'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
           <Text style={styles.sectionTitle}>Purchased Address</Text>
           <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 }}>
             <MapPin size={20} color={COLORS.textSecondary} />
             <Text style={styles.addressText}>123 Solar Avenue, Green Tech Park, Sector 5, Kolkata 700091</Text>
           </View>

           <View style={styles.divider} />
           
           <Text style={styles.sectionTitle}>Product Details</Text>
           <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 }}>
             <Package size={20} color={COLORS.textSecondary} />
             <View style={{ flex: 1 }}>
               <Text style={styles.detailValue}>Luminous Solar Panel - 5kW</Text>
               <Text style={styles.detailLabel}>Installation ID: INST-998877</Text>
             </View>
           </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
           <Text style={styles.sectionTitle}>Need Help?</Text>
           <Text style={styles.helpDesc}>Facing any issues with your product or plan?</Text>
           <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate?.('request_service')}>
             <Text style={styles.primaryBtnText}>Raise Service Request</Text>
           </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: COLORS.successLightBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  listText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  helpDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  toggleBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
