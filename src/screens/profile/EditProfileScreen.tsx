import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, BackHandler, Modal, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  BadgeCheck,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import { OtpVerificationModal } from '../../components/auth/OtpVerificationModal';
import * as usersApi from '../../api/users';
import { ApiError } from '../../api/client';
import { normalizeIndianPhone } from '../../utils/phone';
import { useAuthStore } from '../../store/useAuthStore';
import { displayPhone } from '../../utils/userDisplay';
import { showAlert, showToast } from '../../store/useAlertStore';

interface EditProfileScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function EditProfileScreen({ onBack, onNavigate }: EditProfileScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  useEffect(() => {
    (async () => {
      await refreshUser();
      const me = useAuthStore.getState().user;
      if (me) {
        setName(me.fullName || '');
        setEmail(me.email || '');
        setPhone(displayPhone(me) ?? '');
      }
      setLoadingProfile(false);
    })();
  }, [refreshUser]);

  const [phoneError, setPhoneError] = useState('');

  const handleSaveProfile = async () => {
    setPhoneError('');
    const normalizedPhone = phone.trim() ? normalizeIndianPhone(phone) : null;
    if (phone.trim() && !normalizedPhone) {
      setPhoneError('Enter a valid 10-digit mobile number.');
      return;
    }
    setSaving(true);
    try {
      await usersApi.updateProfile({
        fullName: name.trim(),
        email: email.trim() || undefined,
        phoneNumber: normalizedPhone || undefined,
      });
      await refreshUser();
      showToast('Profile updated successfully.');
      onBack?.();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'Failed to update profile';
      if (msg.toLowerCase().includes('phone') || msg.toLowerCase().includes('mobile') || msg.toLowerCase().includes('number')) {
        setPhoneError(msg);
      } else {
        showAlert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [verifyingType, setVerifyingType] = useState<'email' | 'phone'>('email');

  useEffect(() => {
    const backAction = () => {
      if (otpModalVisible) {
        setOtpModalVisible(false);
        return true;
      }
      if (imageModalVisible) {
        setImageModalVisible(false);
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack, otpModalVisible, imageModalVisible]);

  const handleVerifyClick = (type: 'email' | 'phone') => {
    setVerifyingType(type);
    setOtpModalVisible(true);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    setImageModalVisible(false);
    
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    }

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const renderInput = (
    icon: React.ReactNode,
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    isVerified?: boolean,
    onVerify?: () => void,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={`Enter your ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.textTertiary}
          keyboardType={keyboardType}
        />

        {isVerified !== undefined && (
          isVerified ? (
            <View style={styles.verifiedBadge}>
              <BadgeCheck size={16} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={onVerify}
              activeOpacity={0.7}
            >
              <Text style={styles.verifyBtnText}>Verify</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={COMMON_STYLES.headerTitle}>Profile Information</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
                ) : (
                  <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8} onPress={() => setImageModalVisible(true)}>
                <Camera size={16} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.formContainer}>
            {renderInput(
              <User size={20} color={COLORS.textSecondary} />,
              'Full Name',
              name,
              setName
            )}

            {renderInput(
              <Mail size={20} color={COLORS.textSecondary} />,
              'Email Address',
              email,
              setEmail,
              isEmailVerified,
              () => handleVerifyClick('email'),
              'email-address'
            )}

            {renderInput(
              <Phone size={20} color={COLORS.textSecondary} />,
              'Phone Number',
              phone,
              (value) => {
                setPhone(value);
                setPhoneError('');
              },
              isPhoneVerified,
              () => handleVerifyClick('phone'),
              'phone-pad'
            )}
            {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSaveProfile} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
      </Animated.View>

      <OtpVerificationModal
        visible={otpModalVisible}
        type={verifyingType}
        contactValue={verifyingType === 'email' ? email : phone}
        onClose={() => setOtpModalVisible(false)}
        onSuccess={() => {
          setOtpModalVisible(false);
          if (verifyingType === 'email') setIsEmailVerified(true);
          if (verifyingType === 'phone') setIsPhoneVerified(true);
        }}
      />

      {/* Image Picker Modal */}
      <Modal
        transparent={true}
        visible={imageModalVisible}
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setImageModalVisible(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            
            <View style={styles.sheetOptions}>
              <TouchableOpacity style={styles.sheetOption} onPress={() => pickImage('camera')}>
                <View style={[styles.sheetIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
                  <Camera size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.sheetOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.sheetOption} onPress={() => pickImage('gallery')}>
                <View style={[styles.sheetIconWrap, { backgroundColor: COLORS.success + '15' }]}>
                  <ImageIcon size={24} color={COLORS.success} />
                </View>
                <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
    ...SHADOWS.soft,
  },
  formContainer: {
    gap: 20,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  inputGroup: {
    gap: 8,
  },
  phoneError: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginTop: -8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    height: 52,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  verifyBtnText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  saveBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.bottomSheet,
    borderTopRightRadius: RADIUS.bottomSheet,
    padding: 24,
    ...SHADOWS.card,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  sheetOption: {
    alignItems: 'center',
    gap: 12,
  },
  sheetIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});
