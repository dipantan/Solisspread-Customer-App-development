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
import { ApiError } from '../../api/client';
import { showAlert } from '../../store/useAlertStore';

const { width } = Dimensions.get('window');

export default function RequestServiceScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (step: any, params?: any) => void }) {
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
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);

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
        <TouchableOpacity style={styles.helpBtn} onPress={() => { }}>
          <HeadphonesIcon size={18} color={COLORS.primaryDeep} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleSubmitRequest = async () => {
    if (!issueCategory || !description.trim()) {
      showAlert('Missing details', 'Please select an issue category and add a description.');
      return;
    }
    try {
      await amcApi.createDocket({
        priority: 'TIER_3_ROUTINE',
        issueCategory,
        description: description.trim(),
        photos: photos?.length ? photos : undefined,
      });
      showAlert('Submitted', 'Your service request has been created.', [
        { text: 'OK', onPress: () => onNavigate?.('service_request_list') || onBack?.() },
      ]);
    } catch (e: any) {
      showAlert('Error', e instanceof ApiError ? e.message : e?.message || 'Failed to create service request');
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
          <Text style={styles.sectionTitle}>Select AMC Plan</Text>
          <TouchableOpacity style={styles.planCard} activeOpacity={0.8}>
            <View style={styles.planHeader}>
              <Text style={styles.planId}>AMC2025001</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <View style={styles.planDetailsRow}>
              <Text style={styles.planTitle}>Waaree 5kW Solar System</Text>
            </View>
            <Text style={styles.planValid}>Valid Till: 10 May 2026</Text>
          </TouchableOpacity>
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
               value={description} onChangeText={setDescription} />
              <Text style={styles.charCount}>0/300</Text>
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
              />
              <Text style={styles.charCount}>0/200</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.actionContainer}>
          <TouchableOpacity style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Submit Request</Text>
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
