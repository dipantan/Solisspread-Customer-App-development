import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Dimensions, BackHandler, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  Filter,
  Search,
  ChevronRight,
  CheckCircle2,
  Truck,
  Clock,
  Package,
  XCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';

import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ordersApi from '../../api/orders';
import { ApiError } from '../../api/client';
import { formatInr, productImageSource } from '../../api/catalog';
import { ProductImage } from '../../components/common/ProductImage';
import type { Order } from '../../api/types';

const { width } = Dimensions.get('window');

const TABS = ['All Orders', 'Pending', 'Confirmed', 'Delivered', 'Cancelled'] as const;
type Tab = (typeof TABS)[number];

const STATUS_META: Record<'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled', { color: string; icon: any }> = {
  Pending: { color: COLORS.warning, icon: Clock },
  Confirmed: { color: COLORS.primary, icon: Truck },
  Delivered: { color: COLORS.success, icon: CheckCircle2 },
  Cancelled: { color: COLORS.error, icon: XCircle },
};

interface OrderRow {
  orderId: string;
  orderNumber: string;
  status: keyof typeof STATUS_META;
  date: string;
  time: string;
  total: string;
  paymentStatus: string;
  paymentColor: string;
  image: any;
  title: string;
  itemCount: number;
  statusTitle: string;
  statusSub: string;
}

function toRow(order: Order, fallbackImage: any): OrderRow {
  const simple = ordersApi.simpleStatus(order.status);
  const created = order.createdAt ? new Date(order.createdAt) : null;
  const items = order.items ?? [];
  const first = items[0]?.product;
  const payment = ordersApi.paymentLabel(order);
  const paid = payment === 'Paid online' || payment === 'Cash on Delivery';
  const statusCopy: Record<OrderRow['status'], [string, string]> = {
    Pending: order.status === 'PAYMENT_FAILED'
      ? ['Payment failed', 'Complete the payment to confirm this order.']
      : ['Awaiting payment', 'Your order will be confirmed once payment is complete.'],
    Confirmed: order.status === 'DISPATCHED'
      ? ['Order shipped', order.deliveryTrackingNo ? `Tracking #${order.deliveryTrackingNo}` : 'Your order is on the way.']
      : ['Order confirmed', 'We are preparing your order.'],
    Delivered: ['Delivered', `Delivered on ${ordersApi.formatOrderDate(order.updatedAt)}`],
    Cancelled: [order.status === 'REFUNDED' ? 'Refunded' : 'Order cancelled', 'This order was cancelled.'],
  };
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: simple.label,
    date: created ? ordersApi.formatOrderDate(order.createdAt) : '',
    time: created ? created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    total: formatInr(ordersApi.toNumber(order.totalAmount)),
    paymentStatus: payment,
    paymentColor: paid ? COLORS.success : COLORS.warning,
    image: first ? productImageSource(first, fallbackImage) : fallbackImage,
    title: items.length > 1 ? `${first?.name ?? 'Item'} + ${items.length - 1} more` : first?.name ?? 'Order items',
    itemCount: items.reduce((sum, i) => sum + ordersApi.toNumber(i.quantity), 0),
    statusTitle: statusCopy[simple.label][0],
    statusSub: statusCopy[simple.label][1],
  };
}

interface OrderHistoryScreenProps {
  onBack?: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function OrderHistoryScreen({ onBack, onNavigate }: OrderHistoryScreenProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const fallbackImage = require('../../../assets/solar_panel_product.png');

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await ordersApi.listOrders();
      setOrders(data.map((o) => toRow(o, fallbackImage)));
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not load your orders.');
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  }, [fallbackImage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('All Orders');

  const q = query.trim().toLowerCase();
  const visibleOrders = orders.filter(
    (o) =>
      (activeTab === 'All Orders' || o.status === activeTab) &&
      (!q || o.orderNumber.toLowerCase().includes(q) || o.title.toLowerCase().includes(q)),
  );

  useEffect(() => {
    const backAction = () => {
      if (onNavigate) {
        onNavigate('home');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onNavigate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={() => onNavigate && onNavigate('home')}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={[COMMON_STYLES.headerTitle, { flex: 1, marginLeft: 16, textAlign: 'center', marginRight: 44 }]}>My Orders</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: COLORS.surface }]}>
        <View style={styles.searchBox}>
          <Search size={20} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order number, product..."
            placeholderTextColor={COLORS.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
        </View>
      </View>

      {/* Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            colors={[COLORS.primaryDeep]}
          />
        }
      >
        {loadingOrders ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : null}
        {!loadingOrders && error ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={styles.emptyTitle}>{error}</Text>
            <TouchableOpacity style={[styles.actionBtn, { marginTop: 12 }]} onPress={loadOrders}>
              <Text style={styles.actionBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {!loadingOrders && !error && visibleOrders.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 24 }}>
            <Package size={40} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>
              {orders.length === 0 ? 'No orders yet' : 'No orders match this filter'}
            </Text>
            {orders.length === 0 ? (
              <TouchableOpacity style={[styles.actionBtn, { marginTop: 12 }]} onPress={() => onNavigate?.('products', { brand: null })}>
                <Text style={styles.actionBtnText}>Start shopping</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {visibleOrders.map((order, index) => {
          const meta = STATUS_META[order.status];
          const Icon = meta.icon;
          return (
            <Animated.View key={order.orderId} entering={FadeInDown.delay(Math.min(index, 6) * 80).springify()} style={styles.orderCard}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onNavigate?.('orderDetails', { orderId: order.orderId })}
              >
                {/* Card Header */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderIdLabel}>Order Number</Text>
                    <Text style={styles.orderId} numberOfLines={1}>{order.orderNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: meta.color + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: meta.color }]}>{order.status}</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textPrimary} style={{ marginLeft: 8 }} />
                </View>

                {/* Date & Total */}
                <View style={styles.dateTotalRow}>
                  <Text style={styles.dateText}>{order.date}  •  {order.time}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.totalLabel}>Total  <Text style={styles.totalValue}>{order.total}</Text></Text>
                    <Text style={[styles.paymentStatusText, { color: order.paymentColor }]}>{order.paymentStatus}</Text>
                  </View>
                </View>

                {/* Product Info */}
                <View style={styles.productRow}>
                  <View style={styles.productImageBg}>
                    <ProductImage source={order.image} />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={2}>{order.title}</Text>
                    <Text style={styles.productQtyPrice}>
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.textTertiary} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Status & Action */}
              <View style={styles.actionRow}>
                <View style={styles.actionStatusBox}>
                  <View style={[styles.iconCircle, { backgroundColor: meta.color + '15' }]}>
                    <Icon size={14} color={meta.color} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.actionStatusTitle}>{order.statusTitle}</Text>
                    <Text style={styles.actionStatusSub}>{order.statusSub}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    order.status === 'Pending'
                      ? onNavigate?.('paymentReview', { orderId: order.orderId, status: 'pending' })
                      : onNavigate?.('trackOrder', { orderId: order.orderId })
                  }
                >
                  <Text style={styles.actionBtnText}>{order.status === 'Pending' ? 'Complete Payment' : 'Track Order'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingHorizontal: 12,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    paddingBottom: 0,
  },
  tabItem: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 16,
    ...SHADOWS.soft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderIdLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImageBg: {
    width: 60,
    height: 60,
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
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  productQtyPrice: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionStatusBox: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStatusTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  actionStatusSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginTop: 12,
    textAlign: 'center',
  },
});
