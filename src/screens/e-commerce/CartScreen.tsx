import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, BackHandler, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import {
  ArrowLeft,
  ShieldCheck,
  X,
  Minus,
  Plus,
  MapPin,
  Info,
  BadgeCheck,
  CheckCircle2,
  Truck,
  Headphones,
  HelpCircle,
  ShoppingCart,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { discountPercent, formatInr, productImageSource } from '../../api/catalog';
import { ProductImage } from '../../components/common/ProductImage';
import type { Product } from '../../api/types';
import { useCartStore } from '../../store/useCartStore';
import { showAlert } from '../../store/useAlertStore';

const { width } = Dimensions.get('window');

interface Props {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const TYPE_LABELS: Record<string, string> = {
  SOLAR_PANEL: 'Solar Panel',
  INVERTER: 'Inverter',
  BATTERY: 'Battery',
  COMPLETE_PACKAGE: 'Solar Package',
};

function itemSubtitle(product: Product): string {
  const parts = [product.brand, TYPE_LABELS[product.type] ?? product.type];
  if (product.warrantyMonths) parts.push(`${Math.round(product.warrantyMonths / 12)} yr warranty`);
  return parts.filter(Boolean).join(' • ');
}

export default function CartScreen({ onBack, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const lines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const loading = useCartStore((s) => s.loading);
  const loaded = useCartStore((s) => s.loaded);
  const error = useCartStore((s) => s.error);
  const pendingProductId = useCartStore((s) => s.pendingProductId);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeFromCart = useCartStore((s) => s.removeItem);
  const fallbackImage = require('../../../assets/solar_panel_product.png');

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);


  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const updateQty = async (productId: string, current: number, delta: number) => {
    const next = current + delta;
    if (next < 1) {
      removeItem(productId);
      return;
    }
    try {
      await setQuantity(productId, next);
    } catch (e: any) {
      showAlert('Could not update cart', e?.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
    } catch (e: any) {
      showAlert('Could not remove item', e?.message || 'Failed to remove item');
    }
  };

  const isEmpty = loaded && lines.length === 0;


  return (
    <SafeAreaView style={[styles.container, { paddingBottom: 0 }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({totals.itemCount})</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate?.('help_center')}>
            <HelpCircle size={24} color={COLORS.primaryDeep} />
          </TouchableOpacity>
        </View>
      </View>

      {!loaded && loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : error && lines.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Couldn't load your cart</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={fetchCart}>
            <Text style={styles.emptyBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : isEmpty ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIcon}>
            <ShoppingCart size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add solar panels, inverters or batteries to get started.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate?.('products', { brand: null })}>
            <Text style={styles.emptyBtnText}>Browse products</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && loaded} onRefresh={fetchCart} colors={[COLORS.primaryDeep]} />}
      >

        {totals.savings > 0 ? (
          <View style={styles.savingsBanner}>
            <ShieldCheck size={18} color={COLORS.success} />
            <Text style={styles.savingsText}>You are saving {formatInr(totals.savings)} on this order</Text>
          </View>
        ) : null}

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {lines.map((line, index) => {
            const busy = pendingProductId === line.productId;
            const discount = discountPercent(line.unitPrice, line.unitMrp);
            return (
            <View key={line.productId} style={[styles.cartItem, index === lines.length - 1 && { borderBottomWidth: 0 }, busy && { opacity: 0.6 }]}>
              <TouchableOpacity style={styles.removeItemBtn} onPress={() => removeItem(line.productId)} disabled={busy}>
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.itemImageBg}
                onPress={() => onNavigate?.('productDetails', { id: line.productId, type: line.product.type === 'COMPLETE_PACKAGE' ? 'package' : 'product' })}
              >
                <ProductImage source={productImageSource(line.product, fallbackImage)} fallback={fallbackImage} />
              </TouchableOpacity>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{line.product.name}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>{itemSubtitle(line.product)}</Text>

                <View style={styles.stockRow}>
                  <CheckCircle2 size={12} color={COLORS.success} />
                  <Text style={styles.stockText}>{formatInr(line.unitPrice)} each</Text>
                </View>

                <View style={styles.priceRow}>
                  <View style={{ flex: 1, alignItems: 'flex-start' }}>
                    <View style={styles.oldPriceRow}>
                      <Text style={styles.itemPrice}>{formatInr(line.lineTotal)}</Text>
                      {line.lineMrp > line.lineTotal ? (
                        <Text style={styles.itemOldPrice}>{formatInr(line.lineMrp)}</Text>
                      ) : null}
                    </View>
                    {discount ? <Text style={styles.itemDiscount}>{discount}</Text> : null}
                  </View>

                  <View style={styles.qtyBox}>
                    <TouchableOpacity style={styles.qtyBtn} disabled={busy} onPress={() => updateQty(line.productId, line.quantity, -1)}>
                      <Minus size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{line.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} disabled={busy} onPress={() => updateQty(line.productId, line.quantity, 1)}>
                      <Plus size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.locationIconBox}>
            <MapPin size={20} color={COLORS.primary} />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitleLabel}>Delivery</Text>
            <Text style={styles.sectionTitleVal}>Check your PIN code at checkout</Text>
            <Text style={styles.sectionSubtitle}>We only accept orders for serviceable PIN codes.</Text>
          </View>
        </View>

        {/* Price Details */}
        <View style={styles.priceDetailsCard}>
          <Text style={styles.priceDetailsTitle}>Price Details</Text>

          <View style={styles.priceRowItem}>
            <Text style={styles.priceLabel}>Total MRP ({totals.itemCount} {totals.itemCount === 1 ? 'Item' : 'Items'})</Text>
            <Text style={styles.priceValue}>{formatInr(totals.totalMrp)}</Text>
          </View>

          {totals.savings > 0 ? (
            <View style={styles.priceRowItem}>
              <Text style={styles.priceLabel}>Discount on MRP</Text>
              <Text style={[styles.priceValue, { color: COLORS.success }]}>- {formatInr(totals.savings)}</Text>
            </View>
          ) : null}

          <View style={styles.priceRowItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              <Info size={14} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.priceValue, { color: COLORS.success }]}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalText}>Cart Total</Text>
              <Text style={styles.inclusiveText}>GST is calculated at checkout</Text>
            </View>
            <Text style={styles.totalAmountBig}>{formatInr(totals.subtotal)}</Text>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustRow}>
          {[
            { icon: BadgeCheck, text: '100% Genuine\nProducts', color: '#3B82F6' },
            { icon: ShieldCheck, text: 'Best Price\nGuarantee', color: '#F59E0B' },
            { icon: Truck, text: 'Fast & Safe\nDelivery', color: '#EF4444' },
            { icon: Headphones, text: '24x7 Customer\nSupport', color: '#8B5CF6' },
          ].map((item, idx) => (
            <View key={idx} style={styles.trustBadgeItem}>
              <View style={[styles.trustIconBox, { backgroundColor: item.color + '15' }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text style={styles.trustText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
      )}

      {lines.length > 0 ? (
        <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutLabel}>Cart Total</Text>
            <Text style={styles.checkoutTotal}>{formatInr(totals.subtotal)}</Text>
            {totals.savings > 0 ? (
              <Text style={styles.checkoutSavings}>You Save {formatInr(totals.savings)}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, pendingProductId ? { opacity: 0.6 } : null]}
            activeOpacity={0.9}
            disabled={Boolean(pendingProductId)}
            onPress={() => onNavigate?.('checkout')}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <ArrowLeft size={18} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>
      ) : null}
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
  iconBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.successLightBorder,
    marginBottom: 16,
    gap: 8,
  },
  savingsText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  itemsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  removeItemBtn: {
    position: 'absolute',
    top: 16,
    right: 0,
    zIndex: 10,
    padding: 4,
  },
  itemImageBg: {
    width: 90,
    height: 90,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 20, // make room for close btn
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
    lineHeight: 20,
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  stockText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  oldPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  itemOldPrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  itemDiscount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 6,
    overflow: 'hidden',
    marginLeft: 16,
  },
  qtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 16,
    textAlign: 'center',
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginBottom: 16,
    ...SHADOWS.soft,
    gap: 12,
  },
  locationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitleLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  sectionTitleVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  priceDetailsCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginBottom: 24,
    ...SHADOWS.soft,
  },
  priceDetailsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  priceRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  inclusiveText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  totalAmountBig: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustBadgeItem: {
    alignItems: 'center',
    width: (width - 32) / 4,
  },
  trustIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trustText: {
    fontSize: 10,
    color: COLORS.primaryDeep,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '600',
  },
  checkoutBar: {
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
  checkoutInfo: {
    flex: 1,
  },
  checkoutLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  checkoutTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  checkoutSavings: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.button,
    gap: 8,
  },
  checkoutBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
  },
  emptyBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});
