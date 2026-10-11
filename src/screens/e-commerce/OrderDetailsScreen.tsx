import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Headphones,
  CheckCircle2,
  MapPin,
  ChevronRight,
  CreditCard,
  Clock,
  Truck,
  XCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';

import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ordersApi from '../../api/orders';
import { ApiError } from '../../api/client';
import { formatInr, getRetailPrice, productImageSource } from '../../api/catalog';
import { ProductImage } from '../../components/common/ProductImage';
import type { Order } from '../../api/types';

const STEPS = ['Pending', 'Confirmed', 'Delivered'] as const;

function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrderDetailsScreen({ onBack, onNavigate, orderId }: { onBack?: () => void, onNavigate?: (step: any, params?: any) => void, orderId?: string }) {
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackImage = require('../../../assets/solar_panel_product.png');

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order not found.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setOrder(await ordersApi.getOrder(orderId));
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load this order.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    const backAction = () => {
      if (onNavigate) {
        onNavigate('orderHistory');
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
  }, [onBack, onNavigate]);

  const simple = order ? ordersApi.simpleStatus(order.status) : null;
  const cancelled = simple?.label === 'Cancelled';
  const tone = cancelled ? COLORS.error : simple?.label === 'Delivered' ? COLORS.success : simple?.label === 'Confirmed' ? COLORS.primary : COLORS.warning;
  const items = order?.items ?? [];
  const itemCount = items.reduce((sum, i) => sum + ordersApi.toNumber(i.quantity), 0);
  const mrpTotal = items.reduce((sum, i) => {
    const product = i.product;
    const mrp = product?.prices ? getRetailPrice(product).mrp : ordersApi.toNumber(i.unitPrice);
    return sum + Math.max(mrp, ordersApi.toNumber(i.unitPrice)) * ordersApi.toNumber(i.quantity);
  }, 0);
  const subtotal = ordersApi.toNumber(order?.subtotal);
  const tax = ordersApi.toNumber(order?.taxAmount);
  const total = ordersApi.toNumber(order?.totalAmount);
  const cgst = ordersApi.toNumber(order?.cgstAmount);
  const sgst = ordersApi.toNumber(order?.sgstAmount);
  const igst = ordersApi.toNumber(order?.igstAmount);
  const lastTx = order?.transactions?.[order.transactions.length - 1];
  const payment = order ? ordersApi.paymentLabel(order) : '';
  const ship = order?.shippingAddress;

  const bannerCopy: Record<string, [string, string]> = {
    Pending: order?.status === 'PAYMENT_FAILED'
      ? ['Payment failed', 'Complete the payment to confirm this order.']
      : ['Awaiting payment', 'Your order will be confirmed once payment is complete.'],
    Confirmed: order?.status === 'DISPATCHED'
      ? ['Order shipped', order?.deliveryTrackingNo ? `Courier tracking #${order.deliveryTrackingNo}` : 'Your order is on the way.']
      : ['Order confirmed', 'We are preparing your order for delivery.'],
    Delivered: ['Delivered', `Delivered on ${formatDateTime(order?.updatedAt)}`],
    Cancelled: [order?.status === 'REFUNDED' ? 'Refunded' : 'Order cancelled', 'This order was cancelled.'],
  };

  if (loading || error || !order || !simple) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            <Text style={[styles.cardTitle, { textAlign: 'center' }]}>{error ?? 'Order not found.'}</Text>
            <TouchableOpacity style={[styles.actionBtn, { marginTop: 16, paddingHorizontal: 24 }]} onPress={() => onNavigate?.('orderHistory')}>
              <Text style={styles.actionBtnText}>Back to My Orders</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={() => {
          if (onNavigate) onNavigate('orderHistory');
          else if (onBack) onBack();
        }}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={[COMMON_STYLES.headerTitle, { flex: 1, textAlign: 'center' }]}>Order Details</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => onNavigate?.('help_center')}>
          <Headphones size={20} color={COLORS.primaryDeep} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={loadOrder} colors={[COLORS.primaryDeep]} />}
      >

        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[styles.statusBanner, { backgroundColor: tone + '12', borderColor: tone + '33' }]}
        >
          <View style={[styles.statusIconBox, { backgroundColor: tone + '22' }]}>
            {cancelled ? <XCircle size={24} color={tone} /> : simple.step === 0 ? <Clock size={24} color={tone} /> : <CheckCircle2 size={24} color={tone} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusBannerTitle, { color: tone }]}>{bannerCopy[simple.label][0]}</Text>
            <Text style={styles.statusBannerSub}>{bannerCopy[simple.label][1]}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.label}>Order Number</Text>
              <Text style={styles.valueBold} numberOfLines={1}>{order.orderNumber}</Text>
              <Text style={styles.subText}>{formatDateTime(order.createdAt)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Total Amount</Text>
              <Text style={styles.valueBold}>{formatInr(total)}</Text>
              <Text style={[styles.subText, { color: lastTx?.status === 'SUCCESS' || lastTx?.gateway === 'COD' ? COLORS.success : COLORS.warning, fontWeight: '700' }]}>
                {payment}
              </Text>
            </View>
          </View>
        </Animated.View>

        {!cancelled ? (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
            <Text style={styles.cardTitle}>Order Status</Text>

            <View style={styles.horizontalTimeline}>
              {STEPS.map((label, index) => {
                const done = simple.step >= index;
                return (
                  <View key={label} style={styles.htItem}>
                    <View style={[styles.htIcon, done && styles.htIconActive]}>
                      {done ? <CheckCircle2 size={16} color="#FFF" /> : <Text style={{ color: COLORS.textTertiary, fontWeight: '700' }}>{index + 1}</Text>}
                    </View>
                    <Text style={styles.htTitle}>{label}</Text>
                    <Text style={styles.htSub}>
                      {index === 0 ? ordersApi.formatOrderDate(order.createdAt) : done && index === simple.step ? ordersApi.formatOrderDate(order.updatedAt) : done ? '✓' : '—'}
                    </Text>
                    {index < STEPS.length - 1 ? <View style={[styles.htLine, simple.step > index && styles.htLineActive]} /> : null}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={styles.trackMapLink} onPress={() => onNavigate?.('trackOrder', { orderId: order.id })}>
              <Truck size={16} color={COLORS.primary} />
              <Text style={styles.trackMapLinkText}>View Full Tracking</Text>
              <ChevronRight size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Order Items ({itemCount})</Text>
          {items.map((item, index) => (
            <View key={item.id} style={[styles.productRow, index > 0 && { marginTop: 12 }]}>
              <View style={styles.productImageBg}>
                <ProductImage source={item.product ? productImageSource(item.product, fallbackImage) : fallbackImage} />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>{item.product?.name ?? 'Product'}</Text>
                <Text style={styles.productSub}>
                  {formatInr(ordersApi.toNumber(item.unitPrice))} each  •  GST {ordersApi.toNumber(item.gstRatePercent)}%
                </Text>
                <View style={styles.qtyPriceRow}>
                  <View style={styles.qtyBadge}><Text style={styles.qtyText}>Qty: {ordersApi.toNumber(item.quantity)}</Text></View>
                  <Text style={styles.priceText}>{formatInr(ordersApi.toNumber(item.totalAmount))}</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Price Details</Text>
          {mrpTotal > subtotal ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>MRP ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})</Text>
                <Text style={styles.priceValue}>{formatInr(mrpTotal)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, { color: COLORS.success }]}>- {formatInr(mrpTotal - subtotal)}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{formatInr(subtotal)}</Text>
          </View>
          {igst > 0 ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>IGST</Text>
              <Text style={styles.priceValue}>{formatInr(igst)}</Text>
            </View>
          ) : (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>CGST</Text>
                <Text style={styles.priceValue}>{formatInr(cgst)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>SGST</Text>
                <Text style={styles.priceValue}>{formatInr(sgst)}</Text>
              </View>
            </>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={[styles.priceValue, { color: COLORS.success }]}>FREE</Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalSub}>Includes {formatInr(tax)} GST</Text>
            </View>
            <Text style={styles.totalValue}>{formatInr(total)}</Text>
          </View>
        </Animated.View>

        {ship ? (
          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.card}>
            <View style={styles.iconHeaderRow}>
              <View style={styles.iconCircleBlue}><MapPin size={18} color={COLORS.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressName}>{String(ship.fullName ?? '')}</Text>
                <Text style={styles.addressText}>
                  {String(ship.address ?? ship.street ?? '')}
                  {'\n'}
                  {[ship.city, ship.state].filter(Boolean).join(', ')}{ship.pinCode ? ` - ${ship.pinCode}` : ''}
                </Text>
                {ship.phone ? <Text style={styles.addressText}>Phone: {String(ship.phone)}</Text> : null}
              </View>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.card}>
          <View style={styles.iconHeaderRow}>
            <View style={styles.iconCircleBlue}><CreditCard size={18} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleSm}>Payment Details</Text>
              <View style={styles.priceRowSmall}>
                <Text style={styles.addressText}>Payment Method</Text>
                <Text style={styles.paymentValue}>
                  {lastTx?.gateway === 'COD' ? 'Cash on Delivery' : lastTx ? 'Online (Razorpay)' : '—'}
                </Text>
              </View>
              {lastTx?.gatewayTxId ? (
                <View style={styles.priceRowSmall}>
                  <Text style={styles.addressText}>Transaction ID</Text>
                  <Text style={styles.paymentValue}>{lastTx.gatewayTxId}</Text>
                </View>
              ) : null}
              <View style={styles.priceRowSmall}>
                <Text style={styles.addressText}>Status</Text>
                <Text style={styles.paymentValue}>{payment}</Text>
              </View>
              {order.invoice?.invoiceNumber ? (
                <View style={styles.priceRowSmall}>
                  <Text style={styles.addressText}>Invoice</Text>
                  <Text style={styles.paymentValue}>{order.invoice.invoiceNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.actionFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24 }]}>
        <View style={styles.actionRowContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.surface }]}
            onPress={() => onNavigate?.('create_ticket')}
          >
            <Headphones size={14} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Need Help</Text>
          </TouchableOpacity>

          {simple.step === 0 && !cancelled ? (
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
              onPress={() => onNavigate?.('paymentReview', { orderId: order.id, status: 'pending' })}
            >
              <CreditCard size={14} color={COLORS.surface} />
              <Text style={[styles.actionBtnText, { color: COLORS.surface }]}>Complete Payment</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
              onPress={() => onNavigate?.('trackOrder', { orderId: order.id })}
            >
              <Truck size={14} color={COLORS.surface} />
              <Text style={[styles.actionBtnText, { color: COLORS.surface }]}>Track Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statusIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 4,
  },
  statusBannerSub: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 16,
    ...SHADOWS.soft,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  valueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  copyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 20,
  },
  horizontalTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  htItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  htLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.borderDark,
    top: 11,
    left: '50%',
    right: '-50%',
    zIndex: 0,
  },
  htLineActive: {
    backgroundColor: COLORS.success,
  },
  htIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginBottom: 8,
  },
  htIconActive: {
    backgroundColor: COLORS.success,
  },
  htTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  htSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  trackMapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  trackMapLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  productImageBg: {
    width: 70,
    height: 70,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  productSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  qtyPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  priceDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  totalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  iconHeaderRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconCircleBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleSm: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addressName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    zIndex: 10,
  },
  actionRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 24,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  reviewInput: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.input,
    height: 120,
    padding: 16,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  modalBtnCancelText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnSubmit: {
    backgroundColor: COLORS.primary,
  },
  modalBtnSubmitText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
