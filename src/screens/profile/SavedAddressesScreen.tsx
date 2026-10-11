import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Home,
  Briefcase,
  Edit3,
  Trash2,
  ShieldCheck,
  Star,
  Circle,
  Phone,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as usersApi from '../../api/users';
import { ApiError } from '../../api/client';
import type { Address } from '../../api/types';
import AddressFormSheet from '../../components/e-commerce/AddressFormSheet';
import { formatPhone } from '../../utils/userDisplay';
import { showAlert, showToast } from '../../store/useAlertStore';

const iconFor = (title?: string) =>
  title === 'Home' ? Home : title === 'Office' ? Briefcase : MapPin;

export default function SavedAddressesScreen({ onBack }: any) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ visible: boolean; address: Address | null }>({ visible: false, address: null });

  const loadAddresses = useCallback(async () => {
    setError(null);
    try {
      setAddresses(await usersApi.listAddresses());
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load your addresses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const backAction = () => {
      onBack?.();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const handleSetDefault = async (address: Address) => {
    if (address.isDefault || busyId) return;
    setBusyId(address.id);
    try {
      await usersApi.setDefaultAddress(address);
      showToast(`${address.title || 'Address'} is now your default address`);
      await loadAddresses();
    } catch (e: any) {
      showAlert('Could not update address', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (address: Address) => {
    showAlert(
      'Delete address?',
      `${address.title || 'This address'} will be removed from your saved addresses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusyId(address.id);
            try {
              await usersApi.deleteAddress(address.id);
              showToast('Address deleted');
              await loadAddresses();
            } catch (e: any) {
              showAlert('Could not delete address', e instanceof ApiError ? e.message : 'Please try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'left' }]}>My Addresses</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={() => setSheet({ visible: true, address: null })}>
          <Plus size={16} color={COLORS.info} />
          <Text style={styles.addBtnHeaderText}>Add Address</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAddresses();
            }}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.bannerCard}>
          <View style={styles.bannerIconBox}>
            <MapPin size={24} color={COLORS.info} />
          </View>
          <View style={styles.bannerTextContent}>
            <Text style={styles.bannerTitle}>Manage your saved addresses</Text>
            <Text style={styles.bannerSub}>Choose a saved address at checkout for faster delivery.</Text>
          </View>
          <View style={styles.bannerIllustration}>
            <MapPin size={40} color={COLORS.info} opacity={0.1} />
          </View>
        </Animated.View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 32 }} />
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>{error}</Text>
            <TouchableOpacity style={styles.stateBtn} onPress={() => { setLoading(true); loadAddresses(); }}>
              <Text style={styles.stateBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.stateCard}>
            <MapPin size={36} color={COLORS.textTertiary} />
            <Text style={styles.stateTitle}>No saved addresses yet</Text>
            <Text style={styles.stateSub}>Add an address to check out faster.</Text>
            <TouchableOpacity style={styles.stateBtn} onPress={() => setSheet({ visible: true, address: null })}>
              <Text style={styles.stateBtnText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((item, index) => {
            const Icon = iconFor(item.title);
            const isSelected = Boolean(item.isDefault);
            const busy = busyId === item.id;
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(150 + index * 50).springify()}
                style={[styles.addressCard, isSelected && styles.addressCardSelected, busy && { opacity: 0.6 }]}
              >
                {isSelected && (
                  <View style={styles.defaultBadge}>
                    <Star size={12} color={COLORS.surface} fill={COLORS.surface} />
                    <Text style={styles.defaultBadgeText}>Default Address</Text>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleSetDefault(item)}
                  style={[styles.cardTop, !isSelected && { paddingTop: 16 }]}
                >
                  <View style={[styles.typeIconBox, isSelected && { borderColor: COLORS.info, backgroundColor: COLORS.info + '10' }]}>
                    <Icon size={24} color={isSelected ? COLORS.info : COLORS.textSecondary} />
                  </View>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressType}>{item.title || 'Home'}</Text>
                    {item.fullName ? <Text style={styles.addressName}>{item.fullName}</Text> : null}
                    <Text style={styles.addressText}>{usersApi.formatAddressLine(item)}</Text>
                    {formatPhone(item.phone) ? (
                      <View style={styles.phoneRow}>
                        <Phone size={13} color={COLORS.textSecondary} />
                        <Text style={styles.phoneText}>{formatPhone(item.phone)}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.radioBtn}>
                    {busy ? (
                      <ActivityIndicator size="small" color={COLORS.info} />
                    ) : isSelected ? (
                      <View style={styles.radioSelectedOuter}>
                        <View style={styles.radioSelectedInner} />
                      </View>
                    ) : (
                      <Circle size={24} color={COLORS.textTertiary} />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setSheet({ visible: true, address: item })}>
                    <Edit3 size={16} color={COLORS.info} />
                    <Text style={[styles.actionBtnText, { color: COLORS.info }]}>Edit Address</Text>
                  </TouchableOpacity>
                  <View style={styles.actionDivider} />
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)} disabled={busy}>
                    <Trash2 size={16} color={COLORS.error} />
                    <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })
        )}

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.secureCard}>
          <View style={styles.secureIconBox}>
            <ShieldCheck size={24} color={COLORS.success} />
          </View>
          <View style={styles.secureTextContent}>
            <Text style={styles.secureTitle}>Safe & Secure</Text>
            <Text style={styles.secureSub}>Your address details are secure and will only be used for delivery.</Text>
          </View>
          <View style={styles.secureIllustration}>
            <ShieldCheck size={40} color={COLORS.success} opacity={0.2} />
          </View>
        </Animated.View>
      </ScrollView>

      <AddressFormSheet
        visible={sheet.visible}
        address={sheet.address}
        defaultChecked={addresses.length === 0}
        onClose={() => setSheet({ visible: false, address: null })}
        onSaved={() => {
          setSheet({ visible: false, address: null });
          loadAddresses();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnHeaderText: {
    color: COLORS.info,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.info + '20',
    overflow: 'hidden',
  },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  bannerTextContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bannerIllustration: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ scale: 1.5 }],
  },
  addressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  addressCardSelected: {
    borderColor: COLORS.info,
  },
  defaultBadge: {
    position: 'absolute',
    top: 0,
    left: 16,
    backgroundColor: COLORS.info,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1,
  },
  defaultBadgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  cardTop: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 32,
    gap: 16,
  },
  typeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressInfo: {
    flex: 1,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  addressName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    textAlign: 'center',
  },
  stateSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  stateBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
  },
  stateBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  radioBtn: {
    padding: 4,
  },
  radioSelectedOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelectedInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.info,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  secureCard: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
    overflow: 'hidden',
  },
  secureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  secureTextContent: {
    flex: 1,
  },
  secureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.successAlt,
    marginBottom: 2,
  },
  secureSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  secureIllustration: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ scale: 1.5 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.bottomSheet,
    borderTopRightRadius: RADIUS.bottomSheet,
    padding: 24,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typePillActive: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  typePillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  typePillTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBtnCancelText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnSaveText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
