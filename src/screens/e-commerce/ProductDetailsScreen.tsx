import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TextInput, RefreshControl, BackHandler, ActivityIndicator } from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  ShoppingCart,
  BadgeCheck,
  Zap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MapPin,
  Truck,
  Banknote,
  Plus,
  Minus,
  ChevronDown,
  Layers,
  Package,
  Sun,
  MessageCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import { NotificationsPanel } from '../../components/common/NotificationsPanel';
import * as catalogApi from '../../api/catalog';
import * as serviceabilityApi from '../../api/serviceability';
import type { Product } from '../../api/types';
import { useCartStore } from '../../store/useCartStore';
import { ApiError } from '../../api/client';
import { showAlert, showToast } from '../../store/useAlertStore';
import { getProductContent } from '../../utils/productContent';
import { ProductImage } from '../../components/common/ProductImage';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = require('../../../assets/solar_panel_product.png');
const TABS = ['Details', 'Features', 'Specifications'] as const;
type Tab = (typeof TABS)[number];

export default function ProductDetailsScreen({ onBack, onNavigate, type = 'product', productId }: { onBack: () => void, onNavigate?: (step: any, params?: any) => void, type?: 'product' | 'package', productId?: string }) {
  const insets = useSafeAreaInsets();
  const [activeImage, setActiveImage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const [isExpanded, setIsExpanded] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setLoadingProduct(false);
      setLoadError('This product is no longer available.');
      return;
    }
    setLoadError(null);
    try {
      setProduct(await catalogApi.getProduct(productId));
    } catch (e: any) {
      setLoadError(e instanceof ApiError ? e.message : 'Could not load this product.');
    } finally {
      setLoadingProduct(false);
      setRefreshing(false);
    }
  }, [productId]);

  useEffect(() => {
    setLoadingProduct(true);
    setProduct(null);
    setActiveImage(0);
    setActiveTab('Details');
    loadProduct();
  }, [loadProduct]);

  const [pincode, setPincode] = useState('');
  const [pincodeOk, setPincodeOk] = useState<boolean | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeOk(null);
      setPincodeStatus(null);
      return;
    }
    let cancelled = false;
    serviceabilityApi
      .checkPincode(pincode)
      .then((res) => {
        if (cancelled) return;
        setPincodeOk(res.isServiceable && res.isDeliveryAvailable);
        setDeliveryDays(res.standardDeliveryDays);
        setPincodeStatus(res.message);
      })
      .catch((e) => {
        if (cancelled) return;
        setPincodeOk(null);
        setPincodeStatus(e instanceof ApiError ? e.message : 'Unable to check pincode');
      });
    return () => {
      cancelled = true;
    };
  }, [pincode]);

  const carouselRef = useRef<ScrollView>(null);
  const [slideWidth, setSlideWidth] = useState(width - 42);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const firstImageUri = product?.images?.[0];

  useEffect(() => {
    setImageRatio(null);
    if (!firstImageUri) return;
    let cancelled = false;
    Image.getSize(
      firstImageUri,
      (w, h) => {
        if (!cancelled && w > 0 && h > 0) setImageRatio(w / h);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [firstImageUri]);

  // Frame follows the photo's aspect ratio (clamped) so it fills without letterboxing.
  const carouselHeight = imageRatio ? Math.round(slideWidth / Math.min(Math.max(imageRatio, 0.8), 1.6)) : 300;

  const content = getProductContent(product);
  const isPackage = type === 'package' || product?.type === 'COMPLETE_PACKAGE';
  const images = product?.images?.length ? product.images.map((uri) => ({ uri })) : [FALLBACK_IMAGE];
  const price = product ? catalogApi.getRetailPrice(product) : { base: 0, mrp: 0 };
  const purchasable = product ? catalogApi.isPurchasable(product) : false;
  const discountLabel = purchasable ? catalogApi.discountPercent(price.base, price.mrp) : undefined;

  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.totals.itemCount);

  const handleAddToCart = async (buyNow = false) => {
    const id = product?.id ?? productId;
    if (!id || !purchasable) {
      showAlert('Not available online', 'This item cannot be bought online right now. Contact us for a quote.');
      return;
    }
    setAdding(true);
    try {
      await addItem(id, quantity);
      if (buyNow) {
        onNavigate?.('cart');
      } else {
        showToast(`${product?.name ?? 'Item'} added to cart`, 'success', {
          action: { label: 'View cart', onPress: () => onNavigate?.('cart') },
        });
      }
    } catch (e: any) {
      showAlert('Could not add to cart', e?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProduct();
  }, [loadProduct]);

  React.useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const renderHeader = () => (
    <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>{isPackage ? 'Package Details' : 'Product Details'}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsNotificationsOpen(true)}>
          <Bell size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate?.('cart')}>
          <ShoppingCart size={20} color={COLORS.primaryDeep} />
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );

  const goToImage = (idx: number) => {
    setActiveImage(idx);
    carouselRef.current?.scrollTo({ x: idx * slideWidth, animated: true });
  };

  const renderImageSection = () => (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.imageSection}>
      <View
        style={[styles.imageContainer, { height: carouselHeight }]}
        onLayout={(e) => {
          const inner = Math.round(e.nativeEvent.layout.width) - 2;
          if (inner > 0 && inner !== slideWidth) setSlideWidth(inner);
        }}
      >
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            setActiveImage(Math.round(e.nativeEvent.contentOffset.x / slideWidth));
          }}
        >
          {images.map((img: any, idx: number) => (
            <View key={idx} style={{ width: slideWidth, height: '100%' }}>
              <ProductImage source={img} fallback={FALLBACK_IMAGE} placeholderScale={0.85} />
            </View>
          ))}
        </ScrollView>

        {discountLabel ? (
          <View style={styles.discountBadgeTop}>
            <Text style={styles.discountBadgeTopText}>{discountLabel}</Text>
          </View>
        ) : null}
        {content.badge ? (
          <View style={styles.bestSellerBadgeTop}>
            <Text style={styles.bestSellerBadgeText}>{content.badge}</Text>
          </View>
        ) : null}

        {images.length > 1 ? (
          <View style={styles.carouselControls} pointerEvents="none">
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>{activeImage + 1} / {images.length}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
          {images.map((img: any, idx: number) => (
            <TouchableOpacity
              key={idx}
              style={[styles.thumbnail, activeImage === idx && styles.activeThumbnail]}
              onPress={() => goToImage(idx)}
            >
              <ProductImage source={img} fallback={FALLBACK_IMAGE} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </Animated.View>
  );

  const renderProductInfo = () => (
    <View style={styles.productInfoContainer}>
      <Text style={styles.productTypeText}>
        {[content.typeLabel, content.category, content.subCategory].filter(Boolean).join(' • ')}
      </Text>
      <Text style={styles.productTitle}>{product?.name}</Text>

      <View style={styles.ratingRow}>
        <BadgeCheck size={16} color={COLORS.primary} />
        <Text style={styles.verifiedProductText}>{product?.brand || 'SolAssist Verified'}</Text>
        {product?.modelNumber ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.ratingText}>Model {product.modelNumber}</Text>
          </>
        ) : null}
      </View>

      {content.shortDescription ? <Text style={styles.shortDescription}>{content.shortDescription}</Text> : null}

      {content.tags.length ? (
        <View style={styles.chipRow}>
          {content.tags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {purchasable ? (
        <>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{catalogApi.formatInr(price.base)}</Text>
            {price.mrp > price.base ? <Text style={styles.originalPrice}>{catalogApi.formatInr(price.mrp)}</Text> : null}
            {discountLabel ? <Text style={styles.discountText}>{discountLabel}</Text> : null}
          </View>
          <Text style={styles.taxText}>
            + GST {product?.gstRatePercent && Number(product.gstRatePercent) > 0 ? `@ ${Number(product.gstRatePercent)}%` : 'as applicable'}
            {content.unit ? `  •  Price per ${content.unit.replace(/s$/i, '').toLowerCase()}` : ''}
          </Text>
          {price.mrp > price.base ? (
            <View style={styles.savingsBanner}>
              <Banknote size={16} color={COLORS.successAlt} />
              <Text style={styles.savingsText}>You save {catalogApi.formatInr(price.mrp - price.base)}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.priceOnRequest}>
          <Text style={styles.priceOnRequestTitle}>Price on request</Text>
          <Text style={styles.priceOnRequestSub}>This item isn't sold online yet. Contact us for a quote.</Text>
        </View>
      )}
    </View>
  );

  const renderHighlights = () => {
    const items = [
      content.power ? { icon: Zap, bg: COLORS.infoLight, color: COLORS.info, title: content.power, sub: isPackage ? 'System Capacity' : 'Power Rating' } : null,
      content.warranty ? { icon: ShieldCheck, bg: COLORS.infoLight, color: COLORS.info, title: content.warranty, sub: 'Warranty' } : null,
      product?.brand ? { icon: BadgeCheck, bg: COLORS.successLight, color: COLORS.successAlt, title: product.brand, sub: 'Brand' } : null,
      isPackage && content.package?.components.length
        ? { icon: Layers, bg: COLORS.warningLight, color: COLORS.warning, title: `${content.package.components.length} Components`, sub: 'In this package' }
        : content.origin
          ? { icon: Sun, bg: COLORS.warningLight, color: COLORS.warning, title: content.origin, sub: 'Country of Origin' }
          : { icon: CheckCircle2, bg: COLORS.successLight, color: COLORS.successAlt, title: '100% Genuine', sub: 'Original Product' },
    ].filter((i): i is NonNullable<typeof i> => Boolean(i));

    return (
      <View style={styles.highlightsGrid}>
        {items.map((item) => (
          <View key={item.sub} style={styles.highlightItem}>
            <View style={[styles.highlightIconBox, { backgroundColor: item.bg }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.highlightTextContainer}>
              <Text style={styles.highlightTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.highlightSub}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPackageContents = () => {
    const pkg = content.package;
    if (!pkg || (!pkg.components.length && !pkg.systemInfo.length && !pkg.warranties.length)) return null;
    return (
      <View style={styles.sectionBlock}>
        {pkg.components.length ? (
          <>
            <View style={styles.sectionHeadingRow}>
              <Package size={18} color={COLORS.primaryDeep} />
              <Text style={styles.sectionHeading}>What's included</Text>
            </View>
            {pkg.components.map((c, index) => (
              <View key={c.id} style={[styles.componentRow, index > 0 && styles.componentRowBorder]}>
                <View style={styles.componentImageBox}>
                  <ProductImage source={c.image ? { uri: c.image } : FALLBACK_IMAGE} fallback={FALLBACK_IMAGE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.componentName} numberOfLines={2}>{c.name}</Text>
                  <Text style={styles.componentMeta}>{[c.type, c.brand].filter(Boolean).join(' • ')}</Text>
                </View>
                <Text style={styles.componentQty}>× {c.quantity}{c.unit ? ` ${c.unit}` : ''}</Text>
              </View>
            ))}
          </>
        ) : null}

        {pkg.systemInfo.length ? (
          <>
            <View style={[styles.sectionHeadingRow, { marginTop: pkg.components.length ? 20 : 0 }]}>
              <Sun size={18} color={COLORS.primaryDeep} />
              <Text style={styles.sectionHeading}>System performance</Text>
            </View>
            <View style={styles.infoGrid}>
              {pkg.systemInfo.map(([label, value]) => (
                <View key={label} style={styles.infoTile}>
                  <Text style={styles.infoValue}>{value}</Text>
                  <Text style={styles.infoLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {pkg.warranties.length ? (
          <>
            <View style={[styles.sectionHeadingRow, { marginTop: 20 }]}>
              <ShieldCheck size={18} color={COLORS.primaryDeep} />
              <Text style={styles.sectionHeading}>Warranty coverage</Text>
            </View>
            <View style={styles.specTable}>
              {pkg.warranties.map(([label, value]) => (
                <View key={label} style={styles.specRow}>
                  <Text style={styles.specKey}>{label}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>
    );
  };

  const isDeliveryAvailable = pincode.length === 6 ? pincodeOk : null;

  const renderDeliveryCheck = () => (
    <View style={styles.deliveryContainer}>
      <View style={styles.deliveryHeaderRow}>
        <MapPin size={20} color={COLORS.primaryDeep} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.deliveryTitle}>Check Delivery Availability</Text>
          <Text style={styles.deliverySub}>Enter pincode to check delivery & installation</Text>
        </View>
      </View>
      <View style={styles.pincodeRow}>
        <View style={[styles.pincodeInputBox, isDeliveryAvailable === false && { borderColor: COLORS.error }]}>
          <TextInput
            style={styles.pincodeInput}
            value={pincode}
            onChangeText={(v) => setPincode(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Pincode"
            placeholderTextColor={COLORS.textTertiary}
          />
          {isDeliveryAvailable === true && <CheckCircle2 size={20} color={COLORS.successAlt} />}
          {isDeliveryAvailable === false && <XCircle size={20} color={COLORS.error} />}
        </View>
        <View style={[
          styles.deliveryStatusBox,
          isDeliveryAvailable === false && { backgroundColor: COLORS.errorLight, borderColor: COLORS.error }
        ]}>
          {isDeliveryAvailable !== false ? (
            <Truck size={20} color={COLORS.primaryDeep} />
          ) : (
            <XCircle size={20} color={COLORS.error} />
          )}
          <View style={{ marginLeft: 8 }}>
            {isDeliveryAvailable === true ? (
              <>
                <Text style={styles.deliveryStatusTitle}>{deliveryDays ? `${deliveryDays} Days` : '3 - 5 Days'}</Text>
                <Text style={styles.deliveryStatusSub}>Free Delivery</Text>
              </>
            ) : isDeliveryAvailable === false ? (
              <>
                <Text style={[styles.deliveryStatusTitle, { color: COLORS.error }]}>Not Available</Text>
                <Text style={styles.deliveryStatusSub}>At this pincode</Text>
              </>
            ) : (
              <>
                <Text style={styles.deliveryStatusTitle}>Standard Delivery</Text>
                <Text style={styles.deliveryStatusSub}>Check availability</Text>
              </>
            )}
          </View>
        </View>
      </View>
      {isDeliveryAvailable === true && (
        <Text style={styles.deliveryAvailableText}>{pincodeStatus || 'Delivery available'}</Text>
      )}
      {isDeliveryAvailable === false && (
        <Text style={[styles.deliveryAvailableText, { color: COLORS.error }]}>{pincodeStatus || 'Delivery not available'}</Text>
      )}
    </View>
  );

  const renderQuantity = () => (
    <View style={styles.quantityContainer}>
      <Text style={styles.quantityLabel}>Quantity</Text>
      <View style={styles.quantityControls}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
          <Minus size={16} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.min(99, quantity + 1))}>
          <Plus size={16} color={COLORS.primaryDeep} />
        </TouchableOpacity>
      </View>
      {purchasable && quantity > 1 ? (
        <Text style={styles.quantityTotal}>{catalogApi.formatInr(price.base * quantity)}</Text>
      ) : null}
    </View>
  );

  const description =
    content.description ??
    (content.shortDescription
      ? undefined
      : `${product?.name ?? 'This product'}${product?.brand ? ` by ${product.brand}` : ''} is a ${content.typeLabel.toLowerCase()} for solar installations${content.warranty ? `, backed by a ${content.warranty.toLowerCase()} warranty` : ''}.`);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Details':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>{isPackage ? 'About this package' : 'About this product'}</Text>
            {description ? (
              <>
                <Text style={styles.tabContentText} numberOfLines={isExpanded ? undefined : 6}>{description}</Text>
                {description.length > 280 || description.split('\n').length > 6 ? (
                  <TouchableOpacity style={styles.readMoreBtn} onPress={() => setIsExpanded(!isExpanded)}>
                    <Text style={styles.readMoreText}>{isExpanded ? 'Read Less' : 'Read More'}</Text>
                    <ChevronDown size={16} color={COLORS.primary} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <Text style={styles.tabContentText}>{content.shortDescription}</Text>
            )}
            {content.segment ? <Text style={styles.segmentText}>Best suited for: {content.segment}</Text> : null}
          </View>
        );
      case 'Features':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Key Features</Text>
            {content.features.length ? (
              content.features.map((feature, index) => {
                const [head, ...rest] = feature.split(':');
                const hasHead = rest.length > 0 && head.length <= 60;
                return (
                  <View key={`${index}-${feature.slice(0, 20)}`} style={styles.featureItem}>
                    <CheckCircle2 size={16} color={COLORS.successAlt} style={styles.featureIcon} />
                    <Text style={styles.featureText}>
                      {hasHead ? <Text style={styles.featureHead}>{head.trim()}: </Text> : null}
                      {hasHead ? rest.join(':').trim() : feature}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.tabContentText}>No features have been listed for this item yet.</Text>
            )}
          </View>
        );
      case 'Specifications':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Specifications</Text>
            {content.specs.length ? (
              <View style={styles.specTable}>
                {content.specs.map(([key, value], index) => (
                  <View key={`${key}-${index}`} style={[styles.specRow, index === content.specs.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specValue}>{value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.tabContentText}>No specifications listed.</Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const renderTabsAndContent = () => (
    <>
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => {
              setActiveTab(tab);
              setIsExpanded(false);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
              {tab === 'Features' && content.features.length ? ` (${content.features.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {renderTabContent()}
    </>
  );

  const renderBottomBar = () => {
    if (!product) return null;
    if (!purchasable) {
      return (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.bottomPriceBox}>
            <Text style={styles.bottomPrice}>Price on request</Text>
          </View>
          <TouchableOpacity style={styles.buyNowBtn} onPress={() => onNavigate?.('create_ticket')}>
            <MessageCircle size={18} color={COLORS.surface} style={{ marginRight: 8 }} />
            <Text style={styles.buyNowText}>Request a Quote</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomPriceBox}>
          <Text style={styles.bottomPrice}>{catalogApi.formatInr(price.base * quantity)}</Text>
          {price.mrp > price.base ? (
            <View style={styles.bottomPriceSubRow}>
              <Text style={styles.bottomOriginalPrice}>{catalogApi.formatInr(price.mrp * quantity)}</Text>
              {discountLabel ? <Text style={styles.bottomDiscount}>{discountLabel}</Text> : null}
            </View>
          ) : null}
        </View>
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.addToCartBtn, adding && { opacity: 0.6 }]}
            disabled={adding}
            onPress={() => handleAddToCart()}
          >
            {adding ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
            ) : (
              <ShoppingCart size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyNowBtn, adding && { opacity: 0.6 }]}
            disabled={adding}
            onPress={() => handleAddToCart(true)}
          >
            <Zap size={18} color={COLORS.surface} fill={COLORS.surface} style={{ marginRight: 8 }} />
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loadingProduct || (!product && !loadError)) {
    return (
      <SafeAreaView style={COMMON_STYLES.container} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerStateText}>Loading details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={COMMON_STYLES.container} edges={['top', 'bottom']}>
        {renderHeader()}
        <View style={styles.centerState}>
          <XCircle size={40} color={COLORS.error} />
          <Text style={styles.centerStateTitle}>Couldn't load this item</Text>
          <Text style={styles.centerStateText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoadingProduct(true);
              loadProduct();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={COMMON_STYLES.container} edges={['top', 'bottom']}>
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primaryDeep]}
          />
        }
        contentContainerStyle={[COMMON_STYLES.scrollContent, { paddingBottom: 110 + insets.bottom }]}
      >
        {renderImageSection()}
        {renderProductInfo()}
        {renderHighlights()}
        {renderPackageContents()}
        {purchasable ? renderDeliveryCheck() : null}
        {purchasable ? renderQuantity() : null}
        {renderTabsAndContent()}
      </ScrollView>

      {renderBottomBar()}

      <NotificationsPanel
        visible={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  productTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.info,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  shortDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: COLORS.infoLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.info,
  },
  priceOnRequest: {
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.button,
    padding: 12,
  },
  priceOnRequestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  priceOnRequestSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionBlock: {
    backgroundColor: COLORS.surface,
    padding: 20,
    marginBottom: 8,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  componentRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  componentImageBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  componentName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  componentMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  componentQty: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoTile: {
    width: '48%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quantityTotal: {
    marginLeft: 'auto',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.info,
  },
  featureIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  featureHead: {
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  centerStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  centerStateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
  },
  retryText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  imageSection: {
    backgroundColor: COLORS.surface,
    paddingBottom: 20,
  },
  imageContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.soft,
  },
  discountBadgeTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.successAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  discountBadgeTopText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  bestSellerBadgeTop: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  bestSellerBadgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  carouselControls: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  navCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  pageIndicator: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  thumbnailRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  thumbnail: {
    width: 64,
    height: 52,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  productInfoContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  verifiedProductText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.successAlt,
  },
  taxText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.successLightBorder,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.successAlt,
    marginLeft: 8,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.surface,
    padding: 20,
    marginBottom: 8,
    gap: 12,
  },
  highlightItem: {
    width: '48%',
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 12,
    alignItems: 'center',
  },
  highlightIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  highlightTextContainer: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  highlightSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  deliveryContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    marginBottom: 8,
  },
  deliveryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  deliverySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  pincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pincodeInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    height: 48,
    marginRight: 12,
  },
  pincodeInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primaryDeep,
    fontWeight: '600',
  },
  deliveryStatusBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.input,
    padding: 12,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  deliveryStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.successAlt,
  },
  deliveryStatusSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  deliveryAvailableText: {
    fontSize: 12,
    color: COLORS.successAlt,
    fontWeight: '500',
  },
  offersScroll: {
    padding: 20,
    paddingRight: 8,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.card,
    marginRight: 12,
    width: 250,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  offerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  offerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  quantityContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginRight: 20,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: RADIUS.button,
  },
  qtyBtn: {
    padding: 10,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    paddingVertical: 16,
    marginRight: 24,
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  tabContent: {
    backgroundColor: COLORS.surface,
    padding: 20,
  },
  tabContentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 8,
  },
  tabContentText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.card,
  },
  bottomPriceBox: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  bottomPriceSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomOriginalPrice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  bottomDiscount: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.successAlt,
  },
  bottomActions: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'flex-end',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 8,
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.primary,
    ...SHADOWS.card,
  },
  buyNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.surface,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryDeep,
    marginRight: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  specTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  specKey: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    padding: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  specValue: {
    flex: 1.4,
    padding: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  askBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.accent,
  },
  askBtnText: {
    color: COLORS.primaryDeep,
    fontWeight: '600',
    fontSize: 13,
  },
  reviewsContainer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    marginBottom: 16,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },

  ratingSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingOverallBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    marginRight: 20,
  },
  ratingOverallScore: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingTotalText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  ratingBarsBox: {
    flex: 1,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingBarLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginRight: 4,
    width: 10,
  },
  ratingBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginLeft: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  userReviewCard: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  userReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userReviewStars: {
    flexDirection: 'row',
    backgroundColor: COLORS.successAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 10,
  },
  userReviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  userReviewText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  userReviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userReviewAuthor: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});
