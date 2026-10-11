import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, X } from 'lucide-react-native';
import { AnimatedButton as TouchableOpacity } from '../common/AnimatedButton';
import { InputField } from '../common/InputField';
import { COLORS, RADIUS } from '../../constants/theme';
import * as usersApi from '../../api/users';
import * as serviceabilityApi from '../../api/serviceability';
import { ApiError } from '../../api/client';
import type { Address } from '../../api/types';
import { normalizeIndianPhone } from '../../utils/phone';
import { displayPhone, formatPhone, realName } from '../../utils/userDisplay';
import { useAuthStore } from '../../store/useAuthStore';
import { showToast } from '../../store/useAlertStore';

const ADDRESS_TYPES = ['Home', 'Office', 'Other'];

interface AddressFormSheetProps {
  visible: boolean;
  /** Existing address to edit; omit to add a new one. */
  address?: Address | null;
  /** Pre-tick "make default" for new addresses (e.g. the first one). */
  defaultChecked?: boolean;
  onClose: () => void;
  onSaved: (address: Address) => void;
}

type PinState = { status: 'idle' | 'checking' | 'ok' | 'blocked' | 'error'; message?: string };

export default function AddressFormSheet({
  visible,
  address,
  defaultChecked,
  onClose,
  onSaved,
}: AddressFormSheetProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line, setLine] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [pin, setPin] = useState<PinState>({ status: 'idle' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const pinRequest = useRef(0);

  useEffect(() => {
    if (!visible) return;
    setTitle(address?.title && ADDRESS_TYPES.includes(address.title) ? address.title : address?.title ? 'Other' : 'Home');
    setFullName(address?.fullName || realName(user));
    setPhone((address?.phone ? formatPhone(address.phone) : displayPhone(user)) ?? '');
    setLine(address?.address ?? '');
    setCity(address?.city ?? '');
    setStateName(address?.state ?? '');
    setIsDefault(Boolean(address?.isDefault ?? defaultChecked));
    setErrors({});
    setPin({ status: 'idle' });
    setPinCode('');
    if (address?.pinCode) checkPin(address.pinCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, address?.id]);

  const checkPin = async (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setPinCode(digits);
    setErrors((e) => ({ ...e, pinCode: '' }));
    if (digits.length !== 6) {
      setPin({ status: 'idle' });
      return;
    }
    const requestId = ++pinRequest.current;
    setPin({ status: 'checking' });
    try {
      const result = await serviceabilityApi.checkPincode(digits);
      if (requestId !== pinRequest.current) return;
      if (result.state) setStateName(result.state);
      if (result.district) setCity((c) => c || result.district || '');
      const deliverable = result.isServiceable && result.isDeliveryAvailable;
      setPin(
        deliverable
          ? { status: 'ok', message: `Delivery available${result.standardDeliveryDays ? ` in ${result.standardDeliveryDays} days` : ''}` }
          : {
              status: 'blocked',
              message: result.isServiceable
                ? 'We serve this area, but product delivery is not available yet. You can still save it.'
                : 'We do not deliver to this PIN code yet. You can still save it.',
            },
      );
    } catch (e: any) {
      if (requestId !== pinRequest.current) return;
      setPin({ status: 'error', message: e instanceof ApiError ? e.message : 'Could not check this PIN code.' });
    }
  };

  const handleSave = async () => {
    const next: Record<string, string> = {};
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!fullName.trim()) next.fullName = 'Enter the receiver name.';
    if (!normalizedPhone) next.phone = 'Enter a valid 10-digit mobile number.';
    if (!/^[1-9]\d{5}$/.test(pinCode)) next.pinCode = 'Enter a valid 6-digit PIN code.';
    if (line.trim().length < 5) next.address = 'Enter house no., street and landmark.';
    if (!city.trim()) next.city = 'Enter the city.';
    if (!stateName.trim()) next.state = 'Enter the state.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      title,
      fullName: fullName.trim(),
      phone: normalizedPhone as string,
      address: line.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pinCode,
      isDefault,
    };

    setSaving(true);
    try {
      const editing = Boolean(address?.id && !address.local);
      const saved = editing
        ? await usersApi.updateAddress(address!.id, payload)
        : await usersApi.createAddress(payload);
      showToast(editing ? 'Address updated' : saved.local ? 'Address added for this order' : 'Address saved');
      onSaved(saved);
    } catch (e: any) {
      setErrors({ form: e instanceof ApiError ? e.message : e?.message || 'Could not save the address.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{address?.id ? 'Edit Address' : 'Add New Address'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Save as</Text>
            <View style={styles.pills}>
              {ADDRESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pill, title === type && styles.pillActive]}
                  onPress={() => setTitle(type)}
                >
                  <Text style={[styles.pillText, title === type && styles.pillTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <InputField label="Receiver Name" placeholder="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} />
            <InputField
              label="Mobile Number"
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={14}
              error={errors.phone}
            />
            <InputField
              label="PIN Code"
              placeholder="6-digit PIN code"
              value={pinCode}
              onChangeText={checkPin}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pinCode}
              rightIcon={
                pin.status === 'checking' ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : pin.status === 'ok' ? (
                  <CheckCircle2 size={18} color={COLORS.success} />
                ) : undefined
              }
            />
            {pin.message && !errors.pinCode ? (
              <Text style={[styles.pinNote, { color: pin.status === 'ok' ? COLORS.success : COLORS.warning }]}>
                {pin.message}
              </Text>
            ) : null}
            <InputField
              label="Address"
              placeholder="House no., street, area, landmark"
              value={line}
              onChangeText={setLine}
              error={errors.address}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField label="City" placeholder="City" value={city} onChangeText={setCity} error={errors.city} />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="State" placeholder="State" value={stateName} onChangeText={setStateName} error={errors.state} />
              </View>
            </View>

            <View style={styles.defaultRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.defaultTitle}>Make this my default address</Text>
                <Text style={styles.defaultSub}>Used first at checkout</Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                disabled={Boolean(address?.isDefault)}
                trackColor={{ true: COLORS.primary, false: COLORS.border }}
                thumbColor={COLORS.surface}
              />
            </View>

            {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
          </ScrollView>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.saveText}>Save Address</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(7, 24, 56, 0.5)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.bottomSheet,
    borderTopRightRadius: RADIUS.bottomSheet,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flexGrow: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.surface,
  },
  pinNote: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -10,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  defaultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  defaultSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formError: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  saveBtn: {
    height: 52,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
