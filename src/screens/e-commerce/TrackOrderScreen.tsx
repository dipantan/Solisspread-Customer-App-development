import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Package,
  Clock,
  XCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ordersApi from '../../api/orders';
import { ApiError } from '../../api/client';
import { formatInr, productImageSource } from '../../api/catalog';
import { ProductImage } from '../../components/common/ProductImage';
import type { Order, OrderTracking } from '../../api/types';

function pickTime(tracking: OrderTracking | null, label: string): string | undefined {
  const step = tracking?.timeline.find((s) => s.label === label);
  return step?.done ? step.time : undefined;
}

export default function TrackOrderScreen({ onBack, onNavigate, orderId }: { onBack?: () => void, onNavigate?: (step: any, params?: any) => void, orderId?: string }) {
  const insets = useSafeAreaInsets();
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallbackImage = require('../../../assets/solar_panel_product.png');

  const load = useCallback(async () => {
    if (!orderId) {
      setError('Order not found.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const [t, o] = await Promise.all([ordersApi.getOrderTracking(orderId), ordersApi.getOrder(orderId)]);
      setTracking(t);
      setOrder(o);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load tracking for this order.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const simple = ordersApi.simpleStatus(tracking?.status ?? order?.status ?? 'PENDING_PAYMENT');
  const cancelled = simple.label === 'Cancelled';
  const tone = cancelled ? COLORS.error : simple.label === 'Delivered' ? COLORS.success : simple.label === 'Confirmed' ? COLORS.primary : COLORS.warning;
  const shipped = tracking?.status === 'DISPATCHED';
  const steps = [
    {
      label: 'Pending',
      title: 'Order Placed',
      time: pickTime(tracking, 'Order Placed') ?? ordersApi.formatOrderDate(order?.createdAt),
      note: simple.step === 0 && !cancelled ? 'Waiting for payment confirmation.' : undefined,
    },
    {
      label: 'Confirmed',
      title: shipped ? 'Confirmed & Shipped' : 'Order Confirmed',
      time: pickTime(tracking, 'Order Confirmed'),
      note: shipped
        ? tracking?.deliveryTrackingNo
          ? `Courier tracking #${tracking.deliveryTrackingNo}`
          : 'Your order is on the way.'
        : simple.step === 1
          ? 'We are preparing your order for delivery.'
          : undefined,
    },
    {
      label: 'Delivered',
      title: 'Delivered',
      time: pickTime(tracking, 'Delivered'),
      note: simple.step === 2
        ? 'Your order has been delivered.'
        : !cancelled && tracking?.estimatedDeliveryDate
          ? `Estimated by ${tracking.estimatedDeliveryDate}`
          : undefined,
    },
  ];
  const items = order?.items ?? [];
  const ship = order?.shippingAddress;
  const total = ordersApi.toNumber(order?.totalAmount);

  if (loading || error) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            <Text style={[styles.cardTitle, { textAlign: 'center' }]}>{error}</Text>
            <TouchableOpacity style={[styles.trackMapBtn, { marginTop: 16 }]} onPress={load}>
              <Text style={styles.trackMapText}>Try again</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <MainLayout hideHeader={true} activeTab="orderHistory" onTabChange={onNavigate}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Custom Header */}
        <View style={COMMON_STYLES.header}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={24} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={[COMMON_STYLES.headerTitle, { flex: 1, textAlign: 'center' }]}>Track Order</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => onNavigate?.('create_ticket')}>
            <Headphones size={20} color={COLORS.primaryDeep} />
            <Text style={styles.helpText}>Help</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[COLORS.primaryDeep]}
            />
          }
        >

          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={[styles.statusBanner, { backgroundColor: tone + '12', borderColor: tone + '33' }]}
          >
            <View style={[styles.statusIconBox, { backgroundColor: tone + '22' }]}>
              {cancelled ? <XCircle size={24} color={tone} /> : simple.step === 0 ? <Clock size={24} color={tone} /> : <CheckCircle2 size={24} color={tone} />}
            </View>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={[styles.statusBannerTitle, { color: tone }]}>{simple.label}</Text>
              <Text style={styles.statusBannerSub}>Pending → Confirmed → Delivered</Text>
              {!cancelled && tracking?.estimatedDeliveryDate && simple.step < 2 ? (
                <Text style={styles.statusBannerDate}>Estimated delivery: {tracking.estimatedDeliveryDate}</Text>
              ) : null}
            </View>
            <View style={styles.statusBannerImageWrapper}>
              <Package size={32} color={tone} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.label}>Order Number</Text>
                <Text style={styles.valueBold} numberOfLines={1}>{tracking?.orderNumber ?? order?.orderNumber}</Text>
                <Text style={styles.subText}>Placed on {ordersApi.formatOrderDate(order?.createdAt)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>Total Amount</Text>
                <Text style={styles.valueBold}>{formatInr(total)}</Text>
                {order ? (
                  <Text style={[styles.subText, { color: simple.step >= 1 ? COLORS.success : COLORS.warning, fontWeight: '700' }]}>
                    {ordersApi.paymentLabel(order)}
                  </Text>
                ) : null}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
            <Text style={styles.cardTitle}>Order Tracking</Text>

            {cancelled ? (
              <Text style={styles.timelineSub}>This order was cancelled{tracking?.status === 'REFUNDED' ? ' and refunded' : ''}.</Text>
            ) : (
              steps.map((step, index) => {
                const done = simple.step >= index;
                const last = index === steps.length - 1;
                return (
                  <View key={step.label} style={[styles.timelineItem, last && { marginBottom: 0 }]}>
                    {!last ? <View style={[styles.timelineLine, simple.step <= index && styles.timelineLineInactive]} /> : null}
                    <View style={[styles.timelineIcon, done ? styles.timelineIconActive : styles.timelineIconInactive]}>
                      {done ? <CheckCircle2 size={16} color="#FFF" /> : null}
                    </View>
                    <View style={[styles.timelineContent, last && { paddingBottom: 0 }]}>
                      <Text style={[styles.timelineTitle, !done && { color: COLORS.textTertiary }]}>
                        {step.label} · {step.title}
                      </Text>
                      {done && step.time ? <Text style={styles.timelineSub}>{step.time}</Text> : null}
                      {step.note ? <Text style={styles.timelineSub}>{step.note}</Text> : null}
                    </View>
                  </View>
                );
              })
            )}
          </Animated.View>

          {items.length ? (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.card}>
              {items.map((item, index) => (
                <View key={item.id} style={[styles.productRow, index > 0 && { marginTop: 12 }]}>
                  <View style={styles.productImageBg}>
                    <ProductImage source={item.product ? productImageSource(item.product, fallbackImage) : fallbackImage} />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={2}>{item.product?.name ?? 'Product'}</Text>
                    {item.product?.brand ? <Text style={styles.productSub}>{item.product.brand}</Text> : null}
                    <View style={styles.qtyPriceRow}>
                      <View style={styles.qtyBadge}><Text style={styles.qtyText}>Qty: {ordersApi.toNumber(item.quantity)}</Text></View>
                      <Text style={styles.priceText}>{formatInr(ordersApi.toNumber(item.totalAmount))}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          ) : null}

          {ship ? (
            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.card}>
              <View style={styles.iconHeaderRow}>
                <View style={styles.iconCircleBlue}><MapPin size={18} color={COLORS.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitleSm}>Delivery Address</Text>
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

          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.card}>
            <View style={styles.iconHeaderRow}>
              <View style={styles.iconCircleBlue}><Headphones size={18} color={COLORS.primary} /></View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitleSm}>Need Help?</Text>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => onNavigate?.('create_ticket')}>
                    <Text style={styles.linkText}>Contact Support</Text>
                    <ChevronRight size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.addressText}>Raise a request and our team will get back to you.</Text>
              </View>
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </MainLayout>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 4,
  },
  statusBannerSub: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statusBannerDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBannerImageWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBannerImage: {
    width: 40,
    height: 40,
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
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -32,
    width: 2,
    backgroundColor: COLORS.success,
  },
  timelineLineInactive: {
    backgroundColor: COLORS.borderDark,
    borderStyle: 'dashed',
  },
  timelineIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineIconActive: {
    backgroundColor: COLORS.success,
  },
  timelineIconInactive: {
    backgroundColor: COLORS.surface,
    borderWidth: 4,
    borderColor: COLORS.successLight,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
    paddingBottom: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  timelineSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  courierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  courierTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  courierAwb: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  courierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  courierBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trackMapBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.soft,
  },
  trackMapText: {
    fontSize: 14,
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
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  courierBtnSm: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  courierBtnTextSm: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  }
});
