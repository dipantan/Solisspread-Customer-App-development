import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler, TextInput, Image, KeyboardAvoidingView, Platform, Share, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, MapPin, Gift, Copy, Share2, Send, ChevronDown, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as Clipboard from 'expo-clipboard';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';
import * as usersApi from '../../api/users';
import * as leadsApi from '../../api/leads';
import { ApiError } from '../../api/client';

interface ReferAndEarnScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const PRODUCT_TYPES = ['Solar Panel', 'Solar Inverter', 'Solar Battery', 'Complete Solar System', 'Accessories'];

export default function ReferAndEarnScreen({ onBack, onNavigate }: ReferAndEarnScreenProps) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [product, setProduct] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    usersApi
      .getMe()
      .then((u) => setReferralCode(u.referralCode || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const shareMessage = `Use my SolisSpread referral code ${referralCode || ''} to get started with solar!`;

  const handleCopy = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async (channel: 'whatsapp' | 'generic') => {
    if (!referralCode) return;
    if (channel === 'whatsapp') {
      const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    }
    await Share.share({ message: shareMessage });
  };

  const handleSubmit = async () => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!name.trim() || cleanMobile.length < 10) {
      setFeedback({ type: 'error', text: 'Please enter a name and a valid 10-digit mobile number.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await leadsApi.createLead({
        fullName: name.trim(),
        phone: cleanMobile.length > 10 ? `+${cleanMobile}` : `+91${cleanMobile}`,
        pinCode: pinCode.trim() || undefined,
        state: 'Other',
        source: 'REFERRAL',
        notes: `Referral via app. Product: ${product || 'Not specified'}. Referred by code ${referralCode || 'N/A'}.`,
      });
      setFeedback({ type: 'success', text: 'Referral submitted! You earn rewards once they complete a purchase.' });
      setName('');
      setMobile('');
      setPinCode('');
      setProduct('');
    } catch (e: any) {
      setFeedback({
        type: 'error',
        text: e instanceof ApiError ? e.message : e?.message || 'Could not submit the referral.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Refer & Earn</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner Section */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.bannerCard}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Refer Your Friends</Text>
              <Text style={styles.bannerHighlight}>Earn Rewards!</Text>
              <Text style={styles.bannerDesc}>Help your friends go solar and earn exciting coins.</Text>
            </View>
            <LottieView
              source={require('../../../assets/animations/coin.json')}
              autoPlay
              loop
              style={styles.bannerImage}
            />
          </Animated.View>

          {/* Form Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={styles.formIconBox}>
                <Gift size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.formTitle}>Refer a New Customer</Text>
                <Text style={styles.formSubtitle}>Fill in the details below to refer someone.</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <User size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10 digit mobile number"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Interested In <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                activeOpacity={0.7}
                onPress={() => setProductPickerOpen((v) => !v)}
              >
                <Gift size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <Text style={[styles.inputText, !product && styles.inputPlaceholder]}>
                  {product || 'Select product type'}
                </Text>
                <ChevronDown size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
              {productPickerOpen &&
                PRODUCT_TYPES.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.pickerOption}
                    onPress={() => {
                      setProduct(opt);
                      setProductPickerOpen(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location (Pin Code) <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter pin code"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pinCode}
                  onChangeText={setPinCode}
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIconDot}>
                  <Text style={styles.infoIconText}>i</Text>
                </View>
                <Text style={styles.infoTitle}>Important</Text>
              </View>
              <Text style={styles.infoDesc}>
                Please ensure the details provided are correct. You will earn coins once the referred customer completes the purchase.
              </Text>
            </View>

            {feedback && (
              <Text style={[styles.feedbackText, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
                {feedback.text}
              </Text>
            )}
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmit} disabled={submitting}>
              <Send size={18} color={COLORS.surface} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit Referral'}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* How It Works */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.howItWorksCard}>
            <View style={styles.howItWorksHeader}>
              <View style={styles.howItWorksIconBox}>
                <Gift size={20} color={COLORS.success} />
              </View>
              <Text style={styles.howItWorksTitle}>How It Works</Text>
            </View>
            <View style={styles.stepsContainer}>
              <Text style={styles.stepText}>1. Refer your friends and family.</Text>
              <Text style={styles.stepText}>2. They buy solar products.</Text>
              <Text style={styles.stepText}>3. You earn coins & exciting rewards!</Text>
            </View>
          </Animated.View>

          {/* Share Code Section */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.shareCard}>
            <Text style={styles.shareTitle}>Your Referral Code</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{referralCode || '—'}</Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
                {isCopied ? <CheckCircle2 size={20} color={COLORS.success} /> : <Copy size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            </View>
            <Text style={styles.shareDesc}>Share your code and start earning!</Text>

            <Text style={styles.shareViaText}>Share via</Text>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleShare('whatsapp')}>
                <View style={[styles.socialIcon, { backgroundColor: '#25D366' }]}>
                  <Text style={styles.socialIconText}>W</Text>
                </View>
                <Text style={styles.socialName}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleShare('generic')}>
                <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                  <Text style={styles.socialIconText}>F</Text>
                </View>
                <Text style={styles.socialName}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleShare('generic')}>
                <View style={[styles.socialIcon, { backgroundColor: '#34D399' }]}>
                  <Text style={styles.socialIconText}>M</Text>
                </View>
                <Text style={styles.socialName}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconBtn} onPress={() => handleShare('generic')}>
                <View style={[styles.socialIcon, { backgroundColor: COLORS.border }]}>
                  <Text style={[styles.socialIconText, { color: COLORS.textPrimary }]}>•••</Text>
                </View>
                <Text style={styles.socialName}>More</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerCard: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  bannerContent: { flex: 1, zIndex: 2 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  bannerHighlight: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  bannerDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, width: '60%' },
  bannerImage: {
    width: 200,
    height: 200,
    position: 'absolute',
    right: -50,
    bottom: '-30%',
    zIndex: 1,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  formIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  formSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  required: { color: COLORS.error },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.button,
    height: 50,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 14, color: COLORS.textPrimary },
  inputText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  inputPlaceholder: { color: COLORS.textTertiary },
  infoBox: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.input,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIconDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  infoIconText: { color: COLORS.surface, fontSize: 10, fontWeight: '700' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.primaryDeep },
  infoDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: '600' },
  howItWorksCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  howItWorksHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  howItWorksIconBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.success + '15',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  howItWorksTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  stepsContainer: { paddingLeft: 8 },
  stepText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10 },
  shareCard: {
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  shareTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: RADIUS.button,
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  codeText: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 1 },
  copyBtn: { padding: 4 },
  shareDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  shareViaText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  socialIconsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  socialIconBtn: { alignItems: 'center' },
  socialIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  socialIconText: { color: COLORS.surface, fontSize: 20, fontWeight: 'bold' },
  socialName: { fontSize: 11, color: COLORS.textSecondary },
  feedbackText: { fontSize: 13, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  feedbackSuccess: { color: COLORS.success },
  feedbackError: { color: COLORS.error },
  pickerOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 6,
    backgroundColor: COLORS.surface,
  },
  pickerOptionText: { fontSize: 14, color: COLORS.textPrimary },
});
