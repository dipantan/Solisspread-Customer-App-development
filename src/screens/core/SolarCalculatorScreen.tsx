import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, ImageBackground, Modal, Pressable, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  History,
  Zap,
  PlugZap,
  MapPin,
  Users,
  Home,
  ChevronDown,
  Calculator,
  ShieldCheck,
  Star,
  Info,
  CalendarDays
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import Animated, { FadeInDown, useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MainLayout from '../../layouts/MainLayout';
import * as calculatorApi from '../../api/calculator';
import { ApiError } from '../../api/client';
import { showAlert } from '../../store/useAlertStore';

export default function SolarCalculatorScreen({ onNavigate, onBack }: any) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [monthlyBill, setMonthlyBill] = useState('2500');
  const [customerType, setCustomerType] = useState<'Residential' | 'Commercial' | 'Industrial'>('Residential');
  const [estimating, setEstimating] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteCity, setQuoteCity] = useState('');
  const [quoteState, setQuoteState] = useState('');
  const [quotePin, setQuotePin] = useState('');

  const [dailyUsage, setDailyUsage] = useState('10');
  const [peopleCount, setPeopleCount] = useState('4');
  const [location, setLocation] = useState('West Bengal');
  const [roofType, setRoofType] = useState('Concrete Roof');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRoofModal, setShowRoofModal] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (onBack) {
        onBack();
      } else {
        onNavigate?.('home');
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack, onNavigate]);

  const handleCalculate = async () => {
    const bill = Number(monthlyBill);
    if (!bill || bill <= 0) {
      showAlert('Invalid bill', 'Enter a valid monthly electricity bill.');
      return;
    }
    setEstimating(true);
    try {
      const result = await calculatorApi.estimateSolar({
        monthlyElectricityBill: bill,
        customerType,
        ...(customerType !== 'Residential' ? { sanctionedLoadKw: Number(dailyUsage) || undefined } : {}),
      });
      setEstimate(result);
    } catch (e: any) {
      showAlert('Calculator', e instanceof ApiError ? e.message : e?.message || 'Failed to estimate');
    } finally {
      setEstimating(false);
    }
  };

  const money = (value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? `₹${Math.round(amount).toLocaleString('en-IN')}` : '—';
  };

  const handleGetQuote = async () => {
    const bill = Number(monthlyBill);
    if (!quoteName.trim() || !quotePhone.trim() || !quoteCity.trim() || !quoteState.trim() || !/^[1-9][0-9]{5}$/.test(quotePin)) {
      showAlert('Quote details', 'Enter name, phone, city, state, and a 6-digit PIN code.');
      return;
    }
    setQuoting(true);
    try {
      const result = await calculatorApi.estimateSolar({
        monthlyElectricityBill: bill,
        customerType,
        lead: {
          fullName: quoteName.trim(),
          phone: quotePhone.trim(),
          email: quoteEmail.trim() || undefined,
          city: quoteCity.trim(),
          state: quoteState.trim(),
          pinCode: quotePin,
          utmSource: 'customer_app',
          utmMedium: 'solar_calculator',
        },
      });
      setEstimate(result);
      const leadNumber = (result as { lead?: { leadNumber?: string } }).lead?.leadNumber;
      showAlert('Quote saved', leadNumber ? `Lead ${leadNumber} was sent to the team.` : 'Your quote request was saved.');
    } catch (e: any) {
      showAlert('Quote', e instanceof ApiError ? e.message : e?.message || 'Could not save the quote.');
    } finally {
      setQuoting(false);
    }
  };

  const LOCATIONS = ['West Bengal', 'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'Other'];
  const ROOF_TYPES = ['Concrete Roof', 'Slanted Roof', 'Tin Roof', 'Asbestos Roof', 'Other'];

  return (
    <MainLayout headerScrollY={scrollY} activeTab="calculator" onTabChange={onNavigate}>
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: COLORS.primaryDeep }}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.bodyContent}>
          {/* Top Banner */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.bannerContainer}>
          <LinearGradient
            colors={[COLORS.primary + '10', COLORS.primary + '20']}
            style={styles.bannerGradient}
          />
          <View style={styles.bannerContent}>
            <Image
              source={require('../../../assets/onboarding_solar_house.png')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Go Solar. Save More.</Text>
              <Text style={styles.bannerSub}>Enter your details to see how much you can save with solar energy.</Text>
            </View>
          </View>
        </Animated.View>

        {/* Details Form */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionContainer}>
          <Text style={styles.cardTitle}>Enter Your Details</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Monthly Electricity Bill</Text>
              <Info size={14} color={COLORS.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '20' }]}>
                <Zap size={20} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                value={monthlyBill}
                onChangeText={setMonthlyBill}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>₹ / Month</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Average Daily Usage</Text>
              <Info size={14} color={COLORS.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.success + '20' }]}>
                <PlugZap size={20} color={COLORS.success} />
              </View>
              <TextInput
                style={styles.input}
                value={dailyUsage}
                onChangeText={setDailyUsage}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>kWh / Day</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Select Location</Text>
              <Info size={14} color={COLORS.textSecondary} />
            </View>
            <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.7} onPress={() => setShowLocationModal(true)}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.warning + '20' }]}>
                <MapPin size={20} color={COLORS.warning} />
              </View>
              <Text style={[styles.input, { textAlignVertical: 'center', color: COLORS.textPrimary }]}>{location}</Text>
              <ChevronDown size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Number of People in Home</Text>
              <Info size={14} color={COLORS.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <View style={[styles.iconBox, { backgroundColor: '#8a2be2' + '20' }]}>
                <Users size={20} color="#8a2be2" />
              </View>
              <TextInput
                style={styles.input}
                value={peopleCount}
                onChangeText={setPeopleCount}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>People</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Roof Type</Text>
              <Info size={14} color={COLORS.textSecondary} />
            </View>
            <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.7} onPress={() => setShowRoofModal(true)}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.error + '20' }]}>
                <Home size={20} color={COLORS.error} />
              </View>
              <Text style={[styles.input, { textAlignVertical: 'center', color: COLORS.textPrimary }]}>{roofType}</Text>
              <ChevronDown size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Calculate Button */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <TouchableOpacity style={styles.calculateBtn} activeOpacity={0.8} onPress={handleCalculate} disabled={estimating}>
            <Calculator color={COLORS.surface} size={20} />
            <Text style={styles.calculateBtnText}>{estimating ? "Calculating..." : "Calculate Savings"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Estimated Results */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Your Estimated Results</Text>

          <View style={styles.highlightsRow}>
            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { borderColor: COLORS.success, borderWidth: 1, backgroundColor: COLORS.success + '10' }]}>
                <Zap size={18} color={COLORS.success} />
              </View>
              <Text style={[styles.highlightValue, { color: COLORS.textPrimary }]}>{estimate?.recommendedCapacityKw ?? '—'} <Text style={{ color: COLORS.success, fontSize: 16 }}>kW</Text></Text>
              <Text style={styles.highlightLabel}>Recommended Size</Text>
            </View>

            <View style={styles.highlightDivider} />

            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { borderColor: COLORS.success, borderWidth: 1, backgroundColor: COLORS.success + '10' }]}>
                <Zap size={18} color={COLORS.success} />
              </View>
              <Text style={[styles.highlightValue, { color: COLORS.success }]}>₹22,400</Text>
              <Text style={styles.highlightLabel}>Monthly Savings</Text>
            </View>

            <View style={styles.highlightDivider} />

            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { borderColor: COLORS.success, borderWidth: 1, backgroundColor: COLORS.success + '10' }]}>
                <Zap size={18} color={COLORS.success} />
              </View>
              <Text style={[styles.highlightValue, { color: COLORS.success }]}>₹2,68,800</Text>
              <Text style={styles.highlightLabel}>25 Years Savings</Text>
            </View>
          </View>

          <View style={styles.resultsList}>
            <View style={styles.resultRow}>
              <View style={styles.resultLabelRow}>
                <View style={[styles.listIconBox, { backgroundColor: COLORS.primary + '20' }]}>
                  <Zap size={12} color={COLORS.primary} />
                </View>
                <Text style={styles.resultListLabel}>System Cost (Approx.)</Text>
              </View>
              <Text style={styles.resultListValue}>{money(estimate?.estimatedProjectCost ?? estimate?.netPayableAmount)}</Text>
            </View>

            <View style={styles.resultRow}>
              <View style={styles.resultLabelRow}>
                <View style={[styles.listIconBox, { backgroundColor: COLORS.warning + '20' }]}>
                  <CalendarDays size={12} color={COLORS.warning} />
                </View>
                <Text style={styles.resultListLabel}>Payback Period</Text>
              </View>
              <Text style={styles.resultListValue}>3 - 4 Years</Text>
            </View>

            <View style={styles.resultRow}>
              <View style={styles.resultLabelRow}>
                <View style={[styles.listIconBox, { backgroundColor: '#8a2be2' + '20' }]}>
                  <PlugZap size={12} color="#8a2be2" />
                </View>
                <Text style={styles.resultListLabel}>Annual Electricity Generation</Text>
              </View>
              <Text style={styles.resultListValue}>4,200 kWh</Text>
            </View>

            <View style={styles.resultRow}>
              <View style={styles.resultLabelRow}>
                <View style={[styles.listIconBox, { backgroundColor: COLORS.success + '20' }]}>
                  <ShieldCheck size={12} color={COLORS.success} />
                </View>
                <Text style={styles.resultListLabel}>CO₂ Offset (Annual)</Text>
              </View>
              <Text style={styles.resultListValue}>3.2 Tonnes</Text>
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Customer type</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {(['Residential', 'Commercial', 'Industrial'] as const).map((type) => (
              <TouchableOpacity key={type} onPress={() => setCustomerType(type)} style={[styles.calculateBtn, { flex: 1, backgroundColor: customerType === type ? COLORS.primaryDeep : COLORS.surface, paddingVertical: 10 }]}>
                <Text style={[styles.calculateBtnText, { color: customerType === type ? COLORS.surface : COLORS.primaryDeep, marginLeft: 0, fontSize: 12 }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {customerType !== 'Residential' ? (
            <Text style={styles.disclaimerText}>Commercial and industrial quotes use the sanctioned load entered above.</Text>
          ) : null}

          <Text style={[styles.resultsTitle, { marginTop: 16 }]}>Get Quote</Text>
          <TextInput style={[styles.input, { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 8, paddingHorizontal: 12 }]} placeholder="Full name" value={quoteName} onChangeText={setQuoteName} placeholderTextColor={COLORS.textTertiary} />
          <TextInput style={[styles.input, { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 8, paddingHorizontal: 12 }]} placeholder="Phone" value={quotePhone} onChangeText={setQuotePhone} keyboardType="phone-pad" placeholderTextColor={COLORS.textTertiary} />
          <TextInput style={[styles.input, { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 8, paddingHorizontal: 12 }]} placeholder="Email (optional)" value={quoteEmail} onChangeText={setQuoteEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textTertiary} />
          <TextInput style={[styles.input, { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 8, paddingHorizontal: 12 }]} placeholder="City" value={quoteCity} onChangeText={setQuoteCity} placeholderTextColor={COLORS.textTertiary} />
          <TextInput style={[styles.input, { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 8, paddingHorizontal: 12 }]} placeholder="State" value={quoteState} onChangeText={setQuoteState} placeholderTextColor={COLORS.textTertiary} />
          <TextInput style={[styles.input, { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 8, paddingHorizontal: 12 }]} placeholder="PIN code" value={quotePin} onChangeText={setQuotePin} keyboardType="number-pad" maxLength={6} placeholderTextColor={COLORS.textTertiary} />
          <TouchableOpacity style={styles.calculateBtn} onPress={handleGetQuote} disabled={quoting}>
            <Text style={styles.calculateBtnText}>{quoting ? 'Saving quote...' : 'Get Quote'}</Text>
          </TouchableOpacity>

          <View style={styles.disclaimerBox}>
            <ShieldCheck size={16} color={COLORS.success} />
            <Text style={styles.disclaimerText}>Estimates are based on average data and may vary.</Text>
          </View>
        </Animated.View>

        {/* Talk to Expert Card */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.expertCard}>
          <LinearGradient
            colors={[COLORS.warning + '10', COLORS.warning + '20']}
            style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.card }]}
          />
          <View style={styles.expertContent}>
            <View style={styles.expertIconBox}>
              <Star size={20} color={COLORS.warning} />
            </View>
            <View style={styles.expertTextContent}>
              <Text style={styles.expertTitle}>Want accurate results?</Text>
              <Text style={styles.expertSub}>Talk to our solar expert for a personalized assessment.</Text>
            </View>
            <TouchableOpacity style={styles.expertBtn} onPress={() => onNavigate?.('home')}>
              <Text style={styles.expertBtnText}>Talk to Expert</Text>
            </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Location Modal */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLocationModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <ScrollView style={styles.modalList}>
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={styles.modalOption}
                  onPress={() => {
                    setLocation(loc);
                    setShowLocationModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, location === loc && { color: COLORS.primaryDeep }]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Roof Type Modal */}
      <Modal visible={showRoofModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowRoofModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Roof Type</Text>
            <ScrollView style={styles.modalList}>
              {ROOF_TYPES.map((roof) => (
                <TouchableOpacity
                  key={roof}
                  style={styles.modalOption}
                  onPress={() => {
                    setRoofType(roof);
                    setShowRoofModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, roofType === roof && { color: COLORS.primaryDeep }]}>
                    {roof}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

    </MainLayout>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 24,
    minHeight: '100%',
    gap: 16,
  },
  subHeaderText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  bannerContainer: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    minHeight: 120,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 120,
  },
  bannerImage: {
    width: 120,
    height: '100%',
  },
  bannerTextContainer: {
    flex: 1,

    padding: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  sectionContainer: {
    gap: 16,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.button,
    paddingHorizontal: 12,
    height: 52,

  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    height: '100%',
  },
  inputSuffix: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  calculateBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: RADIUS.button,
    gap: 8,
    ...SHADOWS.soft,
  },
  calculateBtnText: {
    color: COLORS.surface,
    fontSize: 16,
  },
  resultsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    padding: 16,
    ...SHADOWS.card,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  highlightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  highlightItem: {
    alignItems: 'center',
    flex: 1,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  highlightValue: {
    fontSize: 18,
    color: COLORS.success,
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  highlightDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  resultsList: {
    gap: 12,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listIconBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultListLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  resultListValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success + '10',
    paddingVertical: 12,
    borderRadius: RADIUS.button,
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  expertCard: {
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  expertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  expertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertTextContent: {
    flex: 1,
  },
  expertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  expertSub: {
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  expertBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  expertBtnText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  modalList: {
    marginBottom: 8,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  }
});
