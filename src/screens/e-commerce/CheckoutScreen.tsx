import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  ShoppingBag,
  Truck,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Tag,
  Banknote,
  Plus,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import * as ordersApi from '../../api/orders';
import * as serviceabilityApi from '../../api/serviceability';
import * as usersApi from '../../api/users';
import { ApiError } from '../../api/client';
import { formatInr, productImageSource } from '../../api/catalog';
import { ProductImage } from '../../components/common/ProductImage';
import type { Address } from '../../api/types';
import AddressFormSheet from '../../components/e-commerce/AddressFormSheet';
import { normalizeIndianPhone } from '../../utils/phone';
import { formatPhone } from '../../utils/userDisplay';
import { useCartStore } from '../../store/useCartStore';
import { showAlert } from '../../store/useAlertStore';

interface PinCheck {
  status: 'checking' | 'ok' | 'blocked' | 'error';
  message?: string;
  days?: number;
}

const { width } = Dimensions.get('window');

/** Backend rejects COD above this order total (incl. GST). */
const COD_LIMIT = 5000;

interface CheckoutScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function CheckoutScreen({ onBack, onNavigate }: CheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [serverAddresses, setServerAddresses] = useState<Address[]>([]);
  const [localAddresses, setLocalAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pinChecks, setPinChecks] = useState<Record<string, PinCheck>>({});
  const [sheet, setSheet] = useState<{ visible: boolean; address: Address | null }>({ visible: false, address: null });
  const [placing, setPlacing] = useState(false);

  const lines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const cartLoaded = useCartStore((s) => s.loaded);
  const cartLoading = useCartStore((s) => s.loading);
  const cartError = useCartStore((s) => s.error);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fallbackImage = require('../../../assets/solar_panel_product.png');

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      <View style={styles.stepBox}>
        <View style={[styles.stepCircle, styles.stepCircleActive]}>
          <Text style={styles.stepCircleTextActive}>1</Text>
        </View>
        <Text style={[styles.stepText, styles.stepTextActive]}>Address</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepBox}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepCircleText}>2</Text>
        </View>
        <Text style={styles.stepText}>Delivery</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepBox}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepCircleText}>3</Text>
        </View>
        <Text style={styles.stepText}>Payment</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepBox}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepCircleText}>4</Text>
        </View>
        <Text style={styles.stepText}>Review</Text>
      </View>
    </View>
  );

  const checkPin = useCallback(async (pinCode: string) => {
    setPinChecks((m) => ({ ...m, [pinCode]: { status: 'checking' } }));
    try {
      const r = await serviceabilityApi.checkPincode(pinCode);
      const ok = r.isServiceable && r.isDeliveryAvailable;
      setPinChecks((m) => ({
        ...m,
        [pinCode]: {
          status: ok ? 'ok' : 'blocked',
          days: r.standardDeliveryDays,
          message: ok
            ? `Delivery available${r.standardDeliveryDays ? ` in ${r.standardDeliveryDays} days` : ''}`
            : r.isServiceable
              ? 'Product delivery is not available for this PIN code yet.'
              : 'We do not deliver to this PIN code yet.',
        },
      }));
    } catch (e: any) {
      setPinChecks((m) => ({
        ...m,
        [pinCode]: { status: 'error', message: e instanceof ApiError ? e.message : 'Could not check this PIN code.' },
      }));
    }
  }, []);

  const loadAddresses = useCallback(async (preferId?: string) => {
    setAddressesLoading(true);
    setAddressError(null);
    try {
      const list = await usersApi.listAddresses();
      setServerAddresses(list);
      setSelectedId((current) => {
        const keep = preferId ?? current;
        if (keep && (list.some((a) => a.id === keep) || keep.startsWith('local-'))) return keep;
        return (list.find((a) => a.isDefault) ?? list[0])?.id ?? null;
      });
    } catch (e: any) {
      setAddressError(e instanceof ApiError ? e.message : 'Could not load your saved addresses.');
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    loadAddresses();
  }, [fetchCart, loadAddresses]);

  const addresses = [
    ...serverAddresses,
    ...localAddresses.filter(
      (l) => !serverAddresses.some((s) => s.pinCode === l.pinCode && s.address.trim() === l.address.trim()),
    ),
  ];
  const selected = addresses.find((a) => a.id === selectedId) ?? null;
  const selectedCheck = selected ? pinChecks[selected.pinCode] : undefined;

  useEffect(() => {
    if (selected?.pinCode && !pinChecks[selected.pinCode]) checkPin(selected.pinCode);
  }, [selected?.pinCode, pinChecks, checkPin]);

  const estimatedGst = lines.reduce(
    (sum, l) => sum + (l.lineTotal * Number(l.product.gstRatePercent ?? 0)) / 100,
    0,
  );
  const estimatedTotal = totals.subtotal + estimatedGst;
  const codAllowed = estimatedTotal <= COD_LIMIT;

  useEffect(() => {
    if (!codAllowed && paymentMethod === 'cod') setPaymentMethod('online');
  }, [codAllowed, paymentMethod]);

  const blockingReason = (): { title: string; message: string } | null => {
    if (cartError) return { title: 'Cart not loaded', message: cartError };
    if (!cartLoaded || cartLoading) return { title: 'Please wait', message: 'Your cart is still loading.' };
    if (!lines.length) return { title: 'Your cart is empty', message: 'Add a product before checkout.' };
    if (!selected) return { title: 'Add a delivery address', message: 'Add or select an address to deliver your order.' };
    if (!selected.fullName || !selected.phone) {
      return { title: 'Address incomplete', message: 'Add the receiver name and mobile number to this address.' };
    }
    if (!selectedCheck || selectedCheck.status === 'checking') {
      return { title: 'Please wait', message: 'Checking delivery for this PIN code.' };
    }
    if (selectedCheck.status !== 'ok') {
      return {
        title: 'Delivery not available',
        message: `${selectedCheck.message ?? 'We cannot deliver to this PIN code.'} Choose another address.`,
      };
    }
    if (paymentMethod === 'cod' && !codAllowed) {
      return { title: 'COD unavailable', message: `Cash on Delivery is only available for orders up to ${formatInr(COD_LIMIT)}.` };
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    const reason = blockingReason();
    if (reason) {
      if (reason.title === 'Add a delivery address') {
        setSheet({ visible: true, address: null });
        return;
      }
      showAlert(reason.title, reason.message);
      return;
    }
    const address = selected as Address;
    const phone = normalizeIndianPhone(address.phone ?? '') ?? address.phone ?? '';

    setPlacing(true);
    let orderId: string | null = null;
    try {
      const order = await ordersApi.createOrder({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        pinCode: address.pinCode,
        shippingAddress: {
          title: address.title,
          fullName: address.fullName ?? '',
          phone,
          address: address.address,
          street: address.address,
          city: address.city,
          state: address.state,
          pinCode: address.pinCode,
        },
      });
      orderId = order.id;
      await useCartStore.getState().clear().catch(() => {});

      const gateway = paymentMethod === 'cod' ? 'COD' : 'RAZORPAY';
      const payment = await ordersApi.initiatePayment({ orderId: order.id, gateway });
      onNavigate?.('paymentReview', {
        status: gateway === 'COD' ? 'success' : 'pending',
        orderId: order.id,
        method: gateway,
        message: payment.message,
      });
    } catch (e: any) {
      const message = e instanceof ApiError ? e.message : e?.message || 'Could not place the order.';
      if (orderId) {
        onNavigate?.('paymentReview', { status: 'failed', orderId, message });
      } else {
        if (/cart is empty/i.test(message)) fetchCart();
        showAlert('Could not place order', message);
      }
    } finally {
      setPlacing(false);
    }
  };

  const renderAddressSection = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MapPin size={18} color={COLORS.primaryDeep} />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        {addresses.length ? (
          <TouchableOpacity onPress={() => setSheet({ visible: true, address: null })} style={styles.addLink}>
            <Plus size={14} color={COLORS.primary} />
            <Text style={styles.sectionActionText}>Add New</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {addressesLoading && !addresses.length ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
      ) : addressError ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{addressError}</Text>
          <TouchableOpacity onPress={() => loadAddresses()}>
            <Text style={styles.sectionActionText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !addresses.length ? (
        <TouchableOpacity style={styles.addAddressCard} onPress={() => setSheet({ visible: true, address: null })}>
          <View style={styles.addAddressIcon}>
            <Plus size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressName}>Add a delivery address</Text>
            <Text style={styles.addressText}>We will check delivery for your PIN code.</Text>
          </View>
        </TouchableOpacity>
      ) : (
        addresses.map((a) => {
          const active = a.id === selectedId;
          const check = pinChecks[a.pinCode];
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.addressBox, active && styles.addressBoxActive]}
              onPress={() => setSelectedId(a.id)}
              activeOpacity={0.9}
            >
              <View style={styles.radioRow}>
                {active ? (
                  <View style={styles.radioActive}><View style={styles.radioInner} /></View>
                ) : (
                  <View style={styles.radioInactive} />
                )}
                <Text style={styles.addressType}>{a.title || 'Home'}</Text>
                {a.isDefault ? (
                  <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>
                ) : null}
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => setSheet({ visible: true, address: a })} hitSlop={8}>
                  <Text style={styles.sectionActionText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.addressDetails}>
                {a.fullName ? (
                  <Text style={styles.addressName}>
                    {a.fullName}{a.phone ? `  •  ${formatPhone(a.phone) ?? ''}` : ''}
                  </Text>
                ) : null}
                <Text style={styles.addressText}>{usersApi.formatAddressLine(a)}</Text>
                {active && check ? (
                  <View style={styles.pinStatusRow}>
                    {check.status === 'checking' ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : check.status === 'ok' ? (
                      <CheckCircle2 size={14} color={COLORS.success} />
                    ) : (
                      <AlertCircle size={14} color={COLORS.error} />
                    )}
                    <Text
                      style={[
                        styles.pinStatusText,
                        { color: check.status === 'ok' ? COLORS.success : check.status === 'checking' ? COLORS.textSecondary : COLORS.error },
                      ]}
                    >
                      {check.status === 'checking' ? 'Checking delivery…' : check.message}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.secureBadge}>
          <ShieldCheck size={14} color={COLORS.primaryDeep} />
          <Text style={styles.secureText}>100% Secure</Text>
        </View>
      </View>

      {renderStepper()}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchCart();
              loadAddresses();
            }}
          />
        }
      >
        {renderAddressSection()}

        {/* Order Items */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ShoppingBag size={18} color={COLORS.primaryDeep} />
              <Text style={styles.sectionTitle}>Order Items ({totals.itemCount})</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate?.('cart')}>
              <Text style={styles.sectionActionText}>Edit Cart</Text>
            </TouchableOpacity>
          </View>

          {cartLoading && !lines.length ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null}
          {cartError ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{cartError}</Text>
              <TouchableOpacity onPress={() => fetchCart()}>
                <Text style={styles.sectionActionText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {cartLoaded && !cartLoading && !cartError && lines.length === 0 ? (
            <View style={styles.inlineError}>
              <Text style={styles.addressText}>Your cart is empty.</Text>
              <TouchableOpacity onPress={() => onNavigate?.('products', { brand: null })}>
                <Text style={styles.sectionActionText}>Browse products</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {lines.map((line, index) => (
            <React.Fragment key={line.productId}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.itemRow}>
                <View style={styles.itemImageBg}>
                  <ProductImage source={productImageSource(line.product, fallbackImage)} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{line.product.name}</Text>
                  <Text style={styles.itemSubtitle}>{formatInr(line.unitPrice)} each</Text>
                </View>
                <View style={styles.itemPriceBox}>
                  <Text style={styles.itemQty}>Qty: {line.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatInr(line.lineTotal)}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}

          {totals.savings > 0 ? (
            <View style={styles.savingsBannerInline}>
              <ShieldCheck size={16} color={COLORS.success} />
              <Text style={styles.savingsTextInline}>You are saving {formatInr(totals.savings)} on this order</Text>
            </View>
          ) : null}
        </View>

        {/* Delivery */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Truck size={18} color={COLORS.primaryDeep} />
              <Text style={styles.sectionTitle}>Delivery</Text>
            </View>
          </View>
          <View style={[styles.optionRow, styles.optionRowActive]}>
            <View style={styles.radioRowOption}>
              <View style={styles.radioActive}><View style={styles.radioInner} /></View>
              <Text style={styles.optionText}>
                Standard Delivery ({selectedCheck?.days ? `${selectedCheck.days} Days` : '3 - 5 Days'})
              </Text>
            </View>
            <Text style={styles.optionPriceFree}>FREE</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <CreditCard size={18} color={COLORS.primaryDeep} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.paymentRow, paymentMethod === 'online' && styles.paymentRowActive]} onPress={() => setPaymentMethod('online')}>
            <View style={styles.paymentLeft}>
              {paymentMethod === 'online' ? (
                <View style={styles.radioActive}><View style={styles.radioInner} /></View>
              ) : (
                <View style={styles.radioInactive} />
              )}
              <View style={styles.paymentIconBox}>
                <View style={{ width: 32, height: 16, backgroundColor: '#E5E7EB', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.textSecondary }}>UPI</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>Pay Online (Razorpay)</Text>
                <Text style={styles.paymentSubtitle}>UPI, cards, net banking</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === 'cod' && styles.paymentRowActive, !codAllowed && { opacity: 0.5 }]}
            disabled={!codAllowed}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentLeft}>
              {paymentMethod === 'cod' ? (
                <View style={styles.radioActive}><View style={styles.radioInner} /></View>
              ) : (
                <View style={styles.radioInactive} />
              )}
              <View style={styles.paymentIconBox}>
                <Banknote size={20} color={COLORS.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentSubtitle}>
                  {codAllowed ? 'Pay when the order is delivered' : `Available for orders up to ${formatInr(COD_LIMIT)}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Receipt size={18} color={COLORS.primaryDeep} />
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total MRP ({totals.itemCount} {totals.itemCount === 1 ? 'Item' : 'Items'})</Text>
            <Text style={styles.summaryValue}>{formatInr(totals.totalMrp)}</Text>
          </View>
          {totals.savings > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount on MRP</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>- {formatInr(totals.savings)}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (estimated)</Text>
            <Text style={styles.summaryValue}>{formatInr(estimatedGst)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charges</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>FREE</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total Amount <Text style={styles.summaryTotalSub}>(Incl. GST)</Text></Text>
            <Text style={styles.summaryTotalValue}>{formatInr(estimatedTotal)}</Text>
          </View>

          {totals.savings > 0 ? (
            <View style={styles.savingsBannerInline}>
              <Tag size={16} color={COLORS.success} />
              <Text style={styles.savingsTextInline}>You are saving {formatInr(totals.savings)} on this order</Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Fixed Checkout Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Total Amount</Text>
          <Text style={styles.bottomTotal}>{formatInr(estimatedTotal)}</Text>
          {totals.savings > 0 ? <Text style={styles.bottomSavings}>You Save {formatInr(totals.savings)}</Text> : null}
        </View>
        <TouchableOpacity
          style={[styles.payBtn, (placing || blockingReason()) && { opacity: 0.6 }]}
          activeOpacity={0.9}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          {placing ? <ActivityIndicator size="small" color="#FFF" /> : null}
          <Text style={styles.payBtnText}>{placing ? 'Placing...' : paymentMethod === 'cod' ? 'Place COD Order' : 'Place Order & Pay'}</Text>
          {!placing ? <ArrowLeft size={18} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} /> : null}
        </TouchableOpacity>
      </View>

      <AddressFormSheet
        visible={sheet.visible}
        address={sheet.address}
        defaultChecked={!addresses.length}
        onClose={() => setSheet({ visible: false, address: null })}
        onSaved={(saved) => {
          setSheet({ visible: false, address: null });
          setPinChecks((m) => {
            const next = { ...m };
            delete next[saved.pinCode];
            return next;
          });
          if (saved.local) {
            setLocalAddresses((list) => [...list.filter((a) => a.id !== sheet.address?.id), saved]);
            setSelectedId(saved.id);
          } else {
            loadAddresses(saved.id);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    flex: 1,
    marginLeft: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  stepBox: {
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepCircleTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.surface,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  stepTextActive: {
    color: COLORS.primary,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
    marginBottom: 16, // to align with circle
    borderStyle: 'dashed',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 16,
    ...SHADOWS.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addressBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  addressBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundLight,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
  },
  addAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
  },
  pinStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  pinStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  radioActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioInactive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
  },
  addressType: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  defaultBadge: {
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addressDetails: {
    marginLeft: 30,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImageBg: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '80%',
    height: '80%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemPriceBox: {
    alignItems: 'flex-end',
  },
  itemQty: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  itemDiscountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  savingsBannerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  savingsTextInline: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionRowActive: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.primary,
  },
  radioRowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionPriceFree: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentRowActive: {
    backgroundColor: 'transparent',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIcon: {
    width: '100%',
    height: '100%',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  paymentSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardLogosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLogo: {
    width: 24,
    height: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  summaryTotalSub: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    ...SHADOWS.card,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomInfo: {
    flex: 1,
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  bottomSavings: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payBtnText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
