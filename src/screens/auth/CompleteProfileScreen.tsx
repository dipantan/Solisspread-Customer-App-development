import { COLORS } from '../../constants/theme';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, MapPin, Hash } from 'lucide-react-native';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

interface CompleteProfileScreenProps {
  onSave: () => void;
  onBack?: () => void;
}

export default function CompleteProfileScreen({ onSave, onBack }: CompleteProfileScreenProps) {
  const draft = useAuthStore((s) => s.draft);
  const user = useAuthStore((s) => s.user);
  const submitProfile = useAuthStore((s) => s.submitProfile);
  const [name, setName] = useState(draft.fullName || user?.fullName || '');
  const [phone] = useState(draft.phoneNumber || user?.phoneNumber || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSave = async () => {
    setFormError('');
    if (!address.trim() || !city.trim() || !stateName.trim() || pinCode.trim().length !== 6) {
      setFormError('Enter address, city, state, and a 6-digit pincode.');
      return;
    }
    setLoading(true);
    try {
      await submitProfile({
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pinCode: pinCode.trim(),
      });
      onSave();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'Could not save your profile';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Navigation Arrow */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.primaryNavy} />
        </TouchableOpacity>

        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>We need a few more details</Text>
        </View>

        {/* Profile Details Form */}
        <View style={styles.form}>
          <InputField
            label="Full Name"
            placeholder="enter full name"
            value={name}
            onChangeText={setName}
            icon={<User size={20} color={COLORS.textSecondary} />}
          />

          <InputField
            label="Phone Number"
            placeholder="enter phone number"
            value={phone}
            editable={false}
            keyboardType="phone-pad"
            icon={<Phone size={20} color={COLORS.textSecondary} />}
          />

          <InputField
            label="Address"
            placeholder="enter address"
            value={address}
            onChangeText={setAddress}
            icon={<MapPin size={20} color={COLORS.textSecondary} />}
          />

          <InputField
            label="City"
            placeholder="enter city"
            value={city}
            onChangeText={setCity}
          />

          <InputField
            label="State"
            placeholder="enter state"
            value={stateName}
            onChangeText={setStateName}
          />

          <InputField
            label="Pincode"
            placeholder="enter pincode"
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="number-pad"
            icon={<Hash size={20} color={COLORS.textSecondary} />}
            error={formError}
          />

        </View>
      </ScrollView>
      <View style={styles.actions}>
        <PrimaryButton title="Save & Continue" onPress={handleSave} loading={loading} style={styles.saveBtn} />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  flex: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    flexGrow: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 10,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryNavy,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '400',
  },
  form: {
    width: '100%',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: 14,
    marginTop: 16,
    marginBottom: 20,
  },
});
