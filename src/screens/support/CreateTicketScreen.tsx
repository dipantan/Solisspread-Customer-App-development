import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  BackHandler,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  ShoppingBag,
  ChevronDown,
  UploadCloud,
  Mail,
  Phone,
  Info,
  X,
  CheckCircle2,
  PlayCircle,
  Send,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import * as amcApi from '../../api/amc';
import * as storageApi from '../../api/storage';
import * as ordersApi from '../../api/orders';
import { ApiError } from '../../api/client';
import { showAlert, showToast } from '../../store/useAlertStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateTicketScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const CATEGORIES = ['Technical Issue', 'General Query', 'Account & Billing', 'Installation', 'Other'];
const SUB_CATEGORIES = ['Inverter', 'Solar Panels', 'Battery', 'Registration', 'Payment', 'AMC'];

export default function CreateTicketScreen({ onBack, onNavigate }: CreateTicketScreenProps) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  
  // Selection State
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [relatedTo, setRelatedTo] = useState('');
  const [relatedItems, setRelatedItems] = useState<string[]>([]);
  
  // Modal State
  const [isSelectModalVisible, setIsSelectModalVisible] = useState(false);
  const [selectType, setSelectType] = useState<'category' | 'subCategory' | 'relatedTo'>('category');
  
  // Images State
  const [mediaItems, setMediaItems] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    ordersApi.listOrders().then((orders) => {
      const names = new Set<string>();
      orders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const n = it.product?.name;
          if (n) names.add(n);
        });
      });
      setRelatedItems(Array.from(names));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isSelectModalVisible) {
        setIsSelectModalVisible(false);
        return true;
      }
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
  }, [onBack, isSelectModalVisible]);

  const openSelectModal = (type: 'category' | 'subCategory' | 'relatedTo') => {
    setSelectType(type);
    setIsSelectModalVisible(true);
  };

  const handleSelectOption = (option: string) => {
    if (selectType === 'category') setCategory(option);
    else if (selectType === 'subCategory') setSubCategory(option);
    else if (selectType === 'relatedTo') setRelatedTo(option);
    setIsSelectModalVisible(false);
  };

  const getOptionsList = () => {
    if (selectType === 'category') return CATEGORIES;
    if (selectType === 'subCategory') return SUB_CATEGORIES;
    return relatedItems.length ? relatedItems : ['No purchased products found'];
  };

  const getModalTitle = () => {
    if (selectType === 'category') return 'Select Category';
    if (selectType === 'subCategory') return 'Select Sub Category';
    return 'Select Related Item';
  };
  
  const getSelectedValue = () => {
    if (selectType === 'category') return category;
    if (selectType === 'subCategory') return subCategory;
    return relatedTo;
  };

  const pickImage = async () => {
    if (mediaItems.length >= 5) {
      alert('You can only upload up to 5 files.');
      return;
    }
    
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - mediaItems.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newAssets = [...mediaItems, ...result.assets].slice(0, 5);
      setMediaItems(newAssets);
    }
  };
  
  const removeImage = (indexToRemove: number) => {
    setMediaItems(mediaItems.filter((_, index) => index !== indexToRemove));
  };

  const renderDropdown = (label: string, placeholder: string, value: string, type: 'category' | 'subCategory' | 'relatedTo') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.dropdownInput} 
        activeOpacity={0.8}
        onPress={() => openSelectModal(type)}
      >
        <Text style={[styles.dropdownText, value && { color: COLORS.textPrimary }]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <MainLayout hideHeader={true} onTabChange={onNavigate}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Custom Header */}
        <View style={COMMON_STYLES.header}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={24} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'center', marginRight: 16 }]}>
            Create New Ticket
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            {/* Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerIconBox}>
                <ShoppingBag size={24} color={COLORS.success} />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>We're here to help!</Text>
                <Text style={styles.bannerSub}>
                  Please provide details about your issue and we will get back to you as soon as possible.
                </Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formCard}>
              {renderDropdown('Select Category', 'Select Category', category, 'category')}
              {renderDropdown('Select Sub Category', 'Select Sub Category', subCategory, 'subCategory')}
              {renderDropdown('Related To (Optional)', 'Select Related To', relatedTo, 'relatedTo')}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Briefly describe your issue"
                    placeholderTextColor={COLORS.textTertiary}
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Describe Your Issue</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Please provide more details about your issue..."
                    placeholderTextColor={COLORS.textTertiary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={1000}
                  />
                  <Text style={styles.charCount}>{description.length}/1000</Text>
                </View>
              </View>

              {/* Upload */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Upload Photos / Videos (Optional)</Text>
                
                {mediaItems.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                    {mediaItems.map((item, index) => (
                      <View key={index} style={styles.imagePreviewContainer}>
                        <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                        {item.type === 'video' && (
                          <View style={styles.videoOverlay}>
                            <PlayCircle size={24} color={COLORS.surface} />
                          </View>
                        )}
                        <TouchableOpacity 
                          style={styles.removeImageBtn}
                          onPress={() => removeImage(index)}
                          activeOpacity={0.8}
                        >
                          <X size={12} color={COLORS.surface} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {mediaItems.length < 5 && (
                      <TouchableOpacity style={styles.addMoreImageBtn} onPress={pickImage} activeOpacity={0.7}>
                        <UploadCloud size={24} color={COLORS.primary} />
                        <Text style={styles.addMoreImageText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                )}
                
                {mediaItems.length === 0 && (
                  <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7} onPress={pickImage}>
                    <UploadCloud size={28} color={COLORS.primary} style={{ marginBottom: 12 }} />
                    <Text style={styles.uploadTitle}>Tap to upload</Text>
                    <Text style={styles.uploadSub}>You can upload up to 5 files</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Contact Method */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Contact Method</Text>
                <View style={styles.contactRow}>
                  <TouchableOpacity
                    style={[styles.contactBtn, contactMethod === 'email' && styles.contactBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setContactMethod('email')}
                  >
                    <Mail size={18} color={contactMethod === 'email' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.contactBtnText, contactMethod === 'email' && styles.contactBtnTextActive]}>Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.contactBtn, contactMethod === 'phone' && styles.contactBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setContactMethod('phone')}
                  >
                    <Phone size={18} color={contactMethod === 'phone' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.contactBtnText, contactMethod === 'phone' && styles.contactBtnTextActive]}>Phone</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={styles.submitBtn}
                  activeOpacity={0.8}
                  onPress={async () => {
                    if (!description.trim()) {
                      showAlert('Help', 'Describe the problem before submitting.');
                      return;
                    }
                    try {
                      const photoUrls: string[] = [];
                      for (const m of mediaItems) {
                        try {
                          const up = await storageApi.uploadFile({
                            uri: m.uri,
                            fileName: m.fileName,
                            mimeType: m.mimeType,
                          });
                          photoUrls.push(up.url);
                        } catch {
                          // continue without this photo
                        }
                      }
                      await amcApi.createDocket({
                        priority: 'TIER_3_ROUTINE',
                        docketKind: 'SUPPORT_TICKET',
                        subject: subject.trim() || category || 'Support Ticket',
                        issueCategory: category || 'General',
                        subCategory: subCategory || undefined,
                        relatedTo: relatedTo || undefined,
                        preferredContact: contactMethod === 'phone' ? 'Phone' : 'Email',
                        description: description.trim(),
                        photos: photoUrls.length ? photoUrls : undefined,
                      });
                      showToast('Help request sent. Our team will get back to you.');
                      onNavigate?.('support_tickets');
                    } catch (e: any) {
                      showAlert('Help', e instanceof ApiError ? e.message : e?.message || 'Could not submit the form.');
                    }
                  }}
                >
                  <Text style={styles.submitBtnText}>Submit Ticket</Text>
                  <Send size={18} color={COLORS.surface} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Info size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>Our support team usually responds within 24-48 hours.</Text>
            </View>

          </Animated.View>
        </ScrollView>

        {/* Selection Modal */}
        <Modal
          visible={isSelectModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsSelectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setIsSelectModalVisible(false)} 
            />
            <Animated.View 
              entering={FadeInDown.duration(300)} 
              style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                <TouchableOpacity onPress={() => setIsSelectModalVisible(false)} style={styles.modalCloseBtn}>
                  <X size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {getOptionsList().map((option, index) => {
                  const isSelected = getSelectedValue() === option;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                      onPress={() => handleSelectOption(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                        {option}
                      </Text>
                      {isSelected && (
                        <CheckCircle2 size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>

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
  banner: {
    backgroundColor: COLORS.successLight, // Light green BG to match UI
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.successLightBorder,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...SHADOWS.soft,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 6,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  bannerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginBottom: 8,
  },
  dropdownInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.input,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  textAreaContainer: {
    minHeight: 120,
    padding: 16,
  },
  textArea: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
  uploadBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.card,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  uploadSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  imagesScroll: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  imagePreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    ...SHADOWS.soft,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  addMoreImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  addMoreImageText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
  },
  contactBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.infoLight,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  contactBtnTextActive: {
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    padding: 16,
    borderRadius: RADIUS.card,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.bottomSheet,
    borderTopRightRadius: RADIUS.bottomSheet,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionSelected: {
    borderBottomColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  modalOptionTextSelected: {
    color: COLORS.primaryDeep,
    fontWeight: '600',
  },
});
