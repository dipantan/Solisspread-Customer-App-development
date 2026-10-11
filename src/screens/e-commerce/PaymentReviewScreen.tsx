import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  CreditCard,
  ShoppingBag,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Award,
  ThumbsUp,
  AlertCircle,
  HeadphonesIcon,
  RefreshCw,
  ClipboardList,
  Maximize
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import * as ordersApi from '../../api/orders';
import { ApiError } from '../../api/client';
import { formatInr, productImageSource } from '../../api/catalog';
import { ProductImage } from '../../components/common/ProductImage';
import type { Order } from '../../api/types';
import { showAlert } from '../../store/useAlertStore';

interface PaymentReviewScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
  status?: 'success' | 'pending' | 'failed';
  orderId?: string;
  message?: string;
}

const COD_LIMIT = 5000;

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentReviewScreen({ onBack, onNavigate, status = 'success', orderId, message }: PaymentReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [retrying, setRetrying] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setOrder(await ordersApi.getOrder(orderId));
    } catch {
      // keep the status passed from checkout
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const confirmed = order ? ordersApi.simpleStatus(order.status).step >= 1 : status === 'success';
  const effective: 'success' | 'pending' | 'failed' = confirmed ? 'success' : status === 'failed' ? 'failed' : 'pending';
  const isSuccess = effective === 'success';
  const tone = isSuccess ? COLORS.success : effective === 'pending' ? COLORS.warning : COLORS.error;
  const toneLight = isSuccess ? COLORS.successLight : effective === 'pending' ? '#FEF3C7' : '#FEE2E2';
  const background = isSuccess ? '#FAFFF5' : effective === 'pending' ? '#FFFBEB' : '#FFF5F5';

  const lastTx = order?.transactions?.[order.transactions.length - 1];
  const total = ordersApi.toNumber(order?.totalAmount);
  const itemCount = (order?.items ?? []).reduce((sum, i) => sum + ordersApi.toNumber(i.quantity), 0);
  const firstProduct = order?.items?.[0]?.product;
  const ship = order?.shippingAddress;
  const canPayCod = !isSuccess && order && total <= COD_LIMIT;

  const title = isSuccess
    ? lastTx?.gateway === 'COD' ? 'Order Confirmed!' : 'Payment Successful!'
    : effective === 'pending' ? 'Order Placed – Payment Pending' : 'Payment Failed';
  const subtitle = isSuccess
    ? lastTx?.gateway === 'COD'
      ? 'Your order is confirmed. Pay in cash when it is delivered.'
      : 'Your order has been placed successfully.'
    : effective === 'pending'
      ? 'Your order is saved. Complete the payment to confirm it.'
      : message || "We couldn't complete your payment.";

  const payWithCod = async () => {
    if (!order) return;
    setRetrying(true);
    try {
      await ordersApi.initiatePayment({ orderId: order.id, gateway: 'COD' });
      await loadOrder();
    } catch (e: any) {
      showAlert('Payment', e instanceof ApiError ? e.message : e?.message || 'Could not switch to Cash on Delivery.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]} edges={['top']}>
      {/* Header */}
      <View style={[COMMON_STYLES.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16 }]}>Order Status</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={styles.statusSection}>
          <View style={[styles.iconOuterRing, { backgroundColor: toneLight }]}>
            <View style={[styles.iconInnerCircle, { backgroundColor: tone }]}>
              {isSuccess ? <Check size={40} color="#FFF" /> : effective === 'pending' ? <Clock size={40} color="#FFF" /> : <X size={40} color="#FFF" />}
            </View>
          </View>
          <Text style={[styles.statusTitle, { color: tone }]}>{title}</Text>
          <Text style={styles.statusSubtitle}>{subtitle}</Text>
        </View>

        {order ? (
          <>
            <View style={styles.card}>
              <View>
                <Text style={styles.label}>Order Number</Text>
                <Text style={styles.valueLarge}>{order.orderNumber}</Text>
              </View>
              <View style={styles.divider} />
              <View>
                <Text style={styles.label}>Order Date & Time</Text>
                <Text style={styles.valueSmall}>{formatDateTime(order.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: toneLight }]}>
                  <CreditCard size={16} color={tone} />
                </View>
                <Text style={styles.cardTitle}>Payment Details</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Payment Method</Text>
                <Text style={styles.detailsValueBold}>
                  {lastTx?.gateway === 'COD' ? 'Cash on Delivery' : lastTx ? 'Online (Razorpay)' : '—'}
                </Text>
              </View>
              {lastTx?.gatewayTxId ? (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Transaction ID</Text>
                  <Text style={styles.detailsValue}>{lastTx.gatewayTxId}</Text>
                </View>
              ) : null}
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>{isSuccess && lastTx?.gateway !== 'COD' ? 'Paid Amount' : 'Amount Payable'}</Text>
                <Text style={[styles.detailsValueBold, { color: COLORS.primaryDeep }]}>{formatInr(total)}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Payment Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: toneLight }]}>
                  <Text style={[styles.statusBadgeText, { color: tone }]}>{ordersApi.paymentLabel(order)}</Text>
                </View>
              </View>
            </View>

            {!isSuccess ? (
              <View style={[styles.errorBanner, effective === 'pending' && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <AlertCircle size={20} color={tone} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.errorBannerTitle, { color: tone }]}>
                    {effective === 'pending' ? 'Payment not completed' : 'Payment failed'}
                  </Text>
                  <Text style={styles.errorBannerText}>
                    {canPayCod
                      ? 'You can switch this order to Cash on Delivery, or contact support to pay online.'
                      : 'Contact support to complete the payment for this order.'}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.cardHeaderBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.backgroundLight }]}>
                    <ShoppingBag size={16} color={COLORS.primaryDeep} />
                  </View>
                  <Text style={styles.cardTitle}>Order Summary</Text>
                </View>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => onNavigate?.('orderDetails', { orderId: order.id })}>
                  <Text style={styles.actionText}>View Details</Text>
                  <ChevronRight size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.orderSummaryItemRow}>
                <View style={styles.itemImageBg}>
                  <ProductImage source={firstProduct ? productImageSource(firstProduct, require('../../../assets/solar_panel_product.png')) : require('../../../assets/solar_panel_product.png')} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{firstProduct?.name ?? 'Order items'}</Text>
                  <Text style={styles.actionTextSmall}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{formatInr(total)}</Text>
              </View>
            </View>

            {ship ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: COLORS.backgroundLight }]}>
                    <MapPin size={16} color={COLORS.primaryDeep} />
                  </View>
                  <Text style={styles.cardTitle}>Delivery Address</Text>
                </View>
                <View style={styles.addressInfo}>
                  {ship.fullName ? <Text style={styles.addressName}>{String(ship.fullName)}</Text> : null}
                  {ship.phone ? <Text style={styles.addressText}>{String(ship.phone)}</Text> : null}
                  <Text style={styles.addressText}>{String(ship.address ?? ship.street ?? '')}</Text>
                  <Text style={styles.addressText}>
                    {[ship.city, ship.state].filter(Boolean).join(', ')}{ship.pinCode ? ` - ${ship.pinCode}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {!isSuccess && (
          <View style={styles.helpBanner}>
            <HeadphonesIcon size={20} color={COLORS.error} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.helpBannerTitle}>Need Help?</Text>
              <Text style={styles.helpBannerText}>
                If money was deducted from your account, it will be refunded within 5-7 working days.
              </Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }} onPress={() => onNavigate?.('create_ticket')}>
                <Text style={[styles.actionText, { color: COLORS.error }]}>Contact Support</Text>
                <ChevronRight size={14} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Success Trust Badges */}
        {isSuccess && (
          <View style={styles.trustBadgesRow}>
            <View style={styles.trustBadgeItem}>
              <ShieldCheck size={24} color={COLORS.success} />
              <Text style={styles.trustBadgeText}>Secure{'\n'}Payments</Text>
            </View>
            <View style={styles.trustBadgeDivider} />
            <View style={styles.trustBadgeItem}>
              <Award size={24} color={COLORS.success} />
              <Text style={styles.trustBadgeText}>1 Year{'\n'}Warranty</Text>
            </View>
            <View style={styles.trustBadgeDivider} />
            <View style={styles.trustBadgeItem}>
              <ThumbsUp size={24} color={COLORS.success} />
              <Text style={styles.trustBadgeText}>Best After-Sales{'\n'}Support</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Fixed Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: background }]}>
        {canPayCod ? (
          <TouchableOpacity
            style={[styles.footerBtnOutlined, { borderColor: tone }, retrying && { opacity: 0.6 }]}
            disabled={retrying}
            onPress={payWithCod}
          >
            {retrying ? <ActivityIndicator size="small" color={tone} style={{ marginRight: 8 }} /> : <RefreshCw size={18} color={tone} style={{ marginRight: 8 }} />}
            <Text style={[styles.footerBtnOutlinedText, { color: tone }]}>Pay with COD</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.footerBtnOutlined, { borderColor: COLORS.primary }]}
            onPress={() => onNavigate?.('shop')}
          >
            <Maximize size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.footerBtnOutlinedText, { color: COLORS.primary }]}>Continue Shopping</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.footerBtnSolid, { backgroundColor: COLORS.primary }]}
          onPress={() => onNavigate?.('orderHistory')}
        >
          <ClipboardList size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.footerBtnSolidText}>My Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  valueLarge: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  valueSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailsValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  detailsValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  orderSummaryItemRow: {
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
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addressInfo: {
    marginLeft: 44,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 6,
  },
  addressName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  errorBannerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  helpBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  helpBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  helpBannerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  trustBadgeItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustBadgeDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#DCFCE7',
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    ...SHADOWS.soft,
    gap: 12,
  },
  footerBtnOutlined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
  },
  footerBtnOutlinedText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footerBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  footerBtnSolidText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
