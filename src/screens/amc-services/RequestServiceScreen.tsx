import React from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, BackHandler, Modal, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CustomWheelDatePicker from '../../components/common/CustomWheelDatePicker';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HeadphonesIcon,
  Wrench,
  ChevronRight,
  ChevronDown,
  Camera,
  Calendar,
  ShieldCheck,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import * as amcApi from '../../api/amc';
import * as storageApi from '../../api/storage';
import { ApiError } from '../../api/client';
import { showAlert } from '../../store/useAlertStore';

const { width } = Dimensions.get('window');

export default function RequestServiceScreen({
  onBack,
  onNavigate,
  amcContractId,
}: {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
  amcContractId?: string;
}) {
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const ISSUE_CATEGORIES = ['Inverter Not Working', 'Panel Cleaning', 'Battery Backup Issue', 'Wiring/Connection Issue', 'Other'];
  const TIME_SLOTS = ['09:00 AM - 12:00 PM', '12:00 PM - 03:00 PM', '03:00 PM - 06:00 PM'];

  const [issueCategory, setIssueCategory] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);

  const [plans, setPlans] = React.useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(amcContractId || null);
  const [showPlanModal, setShowPlanModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    amcApi
      .listMyAmcPlans()
      .then((items) => {
        setPlans(items);
        if (amcContractId) {
          const match = items.find((p) => p.id === amcContractId);
          if (match) setSelectedPlanId(match.id);
          else if (items.length > 0) setSelectedPlanId(items[0].id);
        } else if (items.length > 0) {
          setSelectedPlanId(items[0].id);
        }
      })
      .catch(() => {});
  }, [amcContractId]);

  const selectedContract = plans.find((p) => p.id === selectedPlanId) || (plans.length > 0 ? plans[0] : null);

  const [photos, setPhotos] = React.useState<string[]>([]);

  const [date, setDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const [timeSlot, setTimeSlot] = React.useState('');
  const [showTimeSlotModal, setShowTimeSlotModal] = React.useState(false);

  const handlePickImage = () => {
    showAlert('Upload Photo', 'Choose an option', [
      {
        text: 'Camera', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return showAlert('Permission needed', 'We need camera permission to take pictures.');
          let result = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true });
          if (!result.canceled && photos.length < 5) {
            setPhotos([...photos, result.assets[0].uri]);
          }
        }
      },
      {
        text: 'Gallery', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return showAlert('Permission needed', 'We need gallery permission to select pictures.');
          let result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: true, allowsMultipleSelection: true });
          if (!result.canceled) {
            const newUris = result.assets.map(a => a.uri).slice(0, 5 - photos.length);
            if (newUris.length > 0) setPhotos([...photos, ...newUris]);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const renderHeader = () => (
    <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Request Service</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => onNavigate?.('help_center')}>
          <HeadphonesIcon size={18} color={COLORS.primaryDeep} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleSubmitRequest = async () => {
    if (!issueCategory) {
      showAlert('Missing category', 'Please select an issue category.');
      return;
    }
    if (!description.trim()) {
      showAlert('Missing details', 'Please describe the issue in detail.');
      return;
    }
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const uri of photos) {
        const up = await storageApi.uploadFile({ uri });
        if (up?.url) photoUrls.push(up.url);
      }
      let scheduledAt: string | undefined;
      if (timeSlot) {
        const start = timeSlot.split(' - ')[0]?.trim();
        if (start) {
          const d = new Date(date);
          const [time, meridian] = start.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (meridian === 'PM' && h < 12) h += 12;
          if (meridian === 'AM' && h === 12) h = 0;
          d.setHours(h, m || 0, 0, 0);
          if (!isNaN(d.getTime())) scheduledAt = d.toISOString();
        }
      }
      const fullDescription = [
        description.trim(),
        notes.trim() ? `Additional Notes: ${notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      await amcApi.createDocket({
        docketKind: 'SERVICE_REQUEST',
        priority: 'TIER_3_ROUTINE',
        issueCategory,
        description: fullDescription,
        scheduledAt,
        photos: photoUrls.length ? photoUrls : undefined,
        amcContractId: selectedContract?.id,
      });
      showAlert('Submitted', 'Your service request has been created successfully.', [
        { text: 'View Requests', onPress: () => onNavigate?.('service_request_list') || onBack() },
      ]);
    } catch (e: any) {
      showAlert('Error', e instanceof ApiError ? e.message : e?.message || 'Failed to create service request');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.bannerContainer}>
          <View style={styles.bannerIconBox}>
            <Wrench size={20} color={COLORS.surface} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Need help with your solar system?</Text>
            <Text style={styles.bannerSubtext}>Submit a service request and our team will assist you.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Select AMC Plan</Text>
            {plans.length > 1 && (
              <TouchableOpacity onPress={() => setShowPlanModal(true)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          {selectedContract ? (
            <TouchableOpacity
              style={styles.planCard}
              activeOpacity={plans.length > 1 ? 0.8 : 1}
              onPress={() => {
                if (plans.length > 1) setShowPlanModal(true);
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planId}>
                  {selectedContract.contractNumber || selectedContract.id?.slice(0, 10) || 'AMC Contract'}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{selectedContract.status || 'Active'}</Text>
                </View>
              </View>
              <View style={styles.planDetailsRow}>
                <Text style={styles.planTitle}>
                  {selectedContract.planName || selectedContract.plan?.name || selectedContract.system || 'Solar System'}
                </Text>
              </View>
              <Text style={styles.planValid}>
                Valid Till:{' '}
                {selectedContract.validUpto ||
                  (selectedContract.endDate
                    ? new Date(selectedContract.endDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Active')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.planCard, { borderColor: COLORS.borderDark, backgroundColor: COLORS.surface }]}>
              <View style={styles.planHeader}>
                <Text style={styles.planId}>General Service</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.statusText, { color: COLORS.textSecondary }]}>On-Demand</Text>
                </View>
              </View>
              <View style={styles.planDetailsRow}>
                <Text style={styles.planTitle}>No active AMC plan linked</Text>
              </View>
              <Text style={styles.planValid}>Standard diagnostics and service rates apply.</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Issue Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Issue Category</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.selectText, issueCategory ? { color: COLORS.textPrimary } : {}]}>
                {issueCategory || 'Select Issue Category'}
              </Text>
              <ChevronDown size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Describe the Problem</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Please describe the issue in detail..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                maxLength={300}
              />
              <Text style={styles.charCount}>{description.length}/300</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Photos (Optional)</Text>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {photos.map((uri, index) => (
                <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={styles.deletePhotoBtn}
                    onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                  >
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          {photos.length < 5 && (
            <TouchableOpacity style={styles.uploadContainer} activeOpacity={0.8} onPress={handlePickImage}>
              <Camera size={28} color={COLORS.primary} />
              <Text style={styles.uploadTitle}>Tap to upload photos</Text>
              <Text style={styles.uploadSubtitle}>({photos.length}/5 images)</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Service Date</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.selectText, { color: COLORS.textPrimary }]}>
                {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <Calendar size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Time Slot</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowTimeSlotModal(true)}>
              <Text style={[styles.selectText, timeSlot ? { color: COLORS.textPrimary } : {}]}>
                {timeSlot || 'Select Time Slot'}
              </Text>
              <ChevronDown size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
            <View style={[styles.textAreaContainer, { height: 100 }]}>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional information..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
                maxLength={200}
              />
              <Text style={styles.charCount}>{notes.length}/200</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmitRequest}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.noteContainer}>
          <ShieldCheck size={16} color={COLORS.success} />
          <View style={styles.noteTextContainer}>
            <Text style={[styles.noteTitle, { color: COLORS.success }]}>What happens next?</Text>
            <Text style={styles.noteText}>Our team will review your request and assign a technician. You will receive a confirmation call shortly.</Text>
          </View>
        </Animated.View>

      </Animated.ScrollView>

      {/* Modals */}
      <Modal visible={showPlanModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPlanModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select AMC Contract</Text>
            {plans.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedPlanId(p.id);
                  setShowPlanModal(false);
                }}
              >
                <Text style={[styles.modalItemText, selectedPlanId === p.id && { color: COLORS.primary, fontWeight: '700' }]}>
                  {p.contractNumber || p.id?.slice(0, 8)} - {p.planName || p.system || 'Plan'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCategoryModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {ISSUE_CATEGORIES.map((cat, index) => (
              <TouchableOpacity key={index} style={styles.modalItem} onPress={() => { setIssueCategory(cat); setShowCategoryModal(false); }}>
                <Text style={[styles.modalItemText, issueCategory === cat && { color: COLORS.primary, fontWeight: '700' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTimeSlotModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimeSlotModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time Slot</Text>
            {TIME_SLOTS.map((slot, index) => (
              <TouchableOpacity key={index} style={styles.modalItem} onPress={() => { setTimeSlot(slot); setShowTimeSlotModal(false); }}>
                <Text style={[styles.modalItemText, timeSlot === slot && { color: COLORS.primary, fontWeight: '700' }]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <CustomWheelDatePicker
        visible={showDatePicker}
        value={date}
        onClose={() => setShowDatePicker(false)}
        onSelect={(selectedDate: Date) => {
          setDate(selectedDate);
          setShowDatePicker(false);
        }}
      />
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
  bannerContainer: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  bannerIconBox: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  bannerSubtext: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
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
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  planId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  planDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  planValid: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  selectText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  textAreaContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    padding: 12,
    height: 120,
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  uploadContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '50',
    borderStyle: 'dashed',
    borderRadius: RADIUS.card,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.successLight + '30',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    marginBottom: 24,
  },
  noteTextContainer: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  actionContainer: {
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.soft,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
