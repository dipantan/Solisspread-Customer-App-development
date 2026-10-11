import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, Dimensions, RefreshControl, ImageBackground, ActivityIndicator } from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Menu,
  Search,
  Bell,
  ShoppingCart,
  Mic,
  SlidersHorizontal,
  ChevronRight,
  Heart,
  Star,
  Zap,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  Headphones,
  CheckCircle,
  FileText,
  CreditCard,
  RefreshCw,
  Gift,
} from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler, FadeInDown } from 'react-native-reanimated';
import MainLayout from '../../layouts/MainLayout';
import { CategoryCard } from '../../components/e-commerce/CategoryCard';
import { ProductCard } from '../../components/e-commerce/ProductCard';
import { PackageCard } from '../../components/e-commerce/PackageCard';
import { BrandCard } from '../../components/e-commerce/BrandCard';
import { TrustBadge } from '../../components/common/TrustBadge';
import { COLORS, RADIUS, SHADOWS, GRADIENTS, COMMON_STYLES } from '../../constants/theme';
import * as catalogApi from '../../api/catalog';
import { getProductContent } from '../../utils/productContent';
import type { Brand } from '../../api/types';
import { quickAddToCart } from '../../utils/cartActions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShopScreen({ onNavigate }: { onNavigate?: (step: any, params?: any) => void }) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopPackages, setShopPackages] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const fallbackImage = require('../../../assets/splash_house_solar.png');

  const loadBrands = async () => {
    try {
      const list = await catalogApi.listBrands();
      setBrands(list.filter(catalogApi.isActiveBrand).sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      // brand strip is optional; keep whatever was loaded before
    } finally {
      setBrandsLoading(false);
    }
  };

  const loadShopData = async () => {
    loadBrands();
    try {
      const [products, packages] = await Promise.all([
        catalogApi.listProducts(),
        catalogApi.listPackages(),
      ]);
      setShopProducts(
        products.slice(0, 6).map((prod) => {
          const { base, mrp } = catalogApi.getRetailPrice(prod);
          return {
            id: prod.id,
            name: prod.name,
            price: catalogApi.formatInr(base),
            originalPrice: mrp > base ? catalogApi.formatInr(mrp) : undefined,
            discount: catalogApi.discountPercent(base, mrp),
            image: catalogApi.productImageSource(prod, fallbackImage),
            isBestSeller: false,
            rating: '4.5',
            reviews: '—',
          };
        }),
      );
      setShopPackages(
        packages.slice(0, 6).map((pkg, index) => {
          const { base, mrp } = catalogApi.getRetailPrice(pkg);
          const content = getProductContent(pkg);
          return {
            id: pkg.id,
            name: pkg.name,
            price: base > 0 ? catalogApi.formatInr(base) : 'Price on request',
            discount: catalogApi.discountPercent(base, mrp) || '',
            image: catalogApi.productImageSource(pkg, fallbackImage),
            tag: content.badge?.toUpperCase() || (index === 0 ? 'BEST VALUE' : 'PACKAGE'),
            desc: content.shortDescription || pkg.brand || content.typeLabel,
            output: content.power ?? content.package?.systemInfo.find(([label]) => label === 'Energy Generation')?.[1],
            oldPrice: mrp > base ? catalogApi.formatInr(mrp) : undefined,
          };
        }),
      );
    } catch {
      // keep hardcoded cards as visual fallback
    } finally {
      setShopLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, []);


  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadShopData();
  }, []);

  // Auto-slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (activeBannerIndex + 1) % 3; // assuming 3 banners
      setActiveBannerIndex(nextIndex);
      bannerScrollRef.current?.scrollTo({ x: nextIndex * (SCREEN_WIDTH - 40), animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeBannerIndex]);

  return (
    <MainLayout activeTab="shop" onTabChange={onNavigate} headerScrollY={scrollY}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[COMMON_STYLES.scrollContent, { paddingTop: 16, backgroundColor: COLORS.primaryDeep, paddingBottom: Math.max(insets.bottom, 12) + 50 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
      >
        <View style={styles.bodyContent}>
          {/* Search Bar */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchContainer}>
            <TouchableOpacity style={styles.searchInputWrapper} onPress={() => onNavigate && onNavigate('search')}>
              <Search size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
              <View pointerEvents="none" style={{ flex: 1 }}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for products, brands and more..."
                  placeholderTextColor={COLORS.textTertiary}
                  editable={false}
                />
              </View>
              <TouchableOpacity>
                <Mic size={18} color={COLORS.primaryDeep} />
              </TouchableOpacity>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanBtn} onPress={() => onNavigate && onNavigate('filter')}>
              <SlidersHorizontal size={18} color={COLORS.surface} />
            </TouchableOpacity>
          </Animated.View>
          {/* Auto Slider Banner */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.bannerWrapper}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40));
                setActiveBannerIndex(newIndex);
              }}
            >
              {[1, 2, 3].map((item, index) => (
                <View key={index} style={styles.bannerSlide}>
                  <ImageBackground
                    source={require('../../../assets/hero_solar_banner.png')}
                    style={styles.bannerBg}
                    imageStyle={{ borderRadius: RADIUS.card }}
                  >
                    <LinearGradient
                      colors={['rgba(7, 24, 56, 0.9)', 'rgba(7, 24, 56, 0.4)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bannerGradient}
                    >
                      <Text style={styles.bannerTitle}>Power Your Home with{'\n'}Clean Solar Energy</Text>
                      <Text style={styles.bannerHighlight}>UP TO 20% OFF</Text>
                      <Text style={styles.bannerSub}>On All Solar Products</Text>
                      <TouchableOpacity style={styles.bannerBtn}>
                        <Text style={styles.bannerBtnText}>Shop Now</Text>
                        <ChevronRight size={14} color={COLORS.primaryDeep} />
                      </TouchableOpacity>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              ))}
            </ScrollView>
            <View style={styles.pagination}>
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={[styles.dot, activeBannerIndex === index ? styles.activeDot : styles.inactiveDot]} />
              ))}
            </View>
          </Animated.View>

          {/* Shop by Category */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => onNavigate && onNavigate('categories')}>
              <Text style={styles.viewAll}>View All</Text>
              <ChevronRight size={14} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            <CategoryCard title="Solar Panels" icon={<Image source={require('../../../assets/cat_solar_panel.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} />
            <CategoryCard title="Inverters" icon={<Image source={require('../../../assets/cat_inverter.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} />
            <CategoryCard title="Batteries" icon={<Image source={require('../../../assets/cat_battery.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} />
            <CategoryCard title="Solar Packages" icon={<Image source={require('../../../assets/splash_house_solar.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} />
            <CategoryCard title="Accessories" icon={<Image source={require('../../../assets/cat_accessories.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} />
          </ScrollView>
          </Animated.View>

          {brandsLoading || brands.length ? (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Shop by Brand</Text>
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => onNavigate?.('products', { brand: null })}>
                  <Text style={styles.viewAll}>View All</Text>
                  <ChevronRight size={14} color={COLORS.accent} />
                </TouchableOpacity>
              </View>
              {brandsLoading && !brands.length ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginBottom: 24 }} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                  {brands.map((brand, i) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      index={i}
                      onPress={() => onNavigate?.('products', { brand: brand.name })}
                    />
                  ))}
                </ScrollView>
              )}
            </Animated.View>
          ) : null}

          {/* Best Selling Products */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Products</Text>
            <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.8} onPress={() => onNavigate?.('products', { brand: null })}>
              <Text style={styles.viewAll}>View All</Text>
              <ChevronRight size={14} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {shopLoading && shopProducts.length === 0 ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 24, marginHorizontal: 24 }} />
            ) : null}
            {!shopLoading && shopProducts.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, marginVertical: 16 }}>No products available right now.</Text>
            ) : null}
            {shopProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                name={prod.name}
                price={prod.price}
                originalPrice={prod.originalPrice}
                discount={prod.discount}
                image={prod.image}
                reviews={prod.reviews}
                onPress={() => onNavigate?.('productDetails', { id: prod.id, type: 'product' })}
                onCartPress={() => quickAddToCart(prod.id, prod.name, onNavigate)}
              />
            ))}
          </ScrollView>
          </Animated.View>

          {/* Complete Solar Packages */}
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Complete Solar Packages</Text>
            <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.8} onPress={() => onNavigate?.('packages')}>
              <Text style={styles.viewAll}>View All</Text>
              <ChevronRight size={14} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {!shopLoading && shopPackages.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, marginVertical: 16 }}>No packages available right now.</Text>
            ) : null}
            {shopPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                name={pkg.name}
                tag={pkg.tag}
                desc={pkg.desc}
                output={pkg.output}
                oldPrice={pkg.oldPrice}
                price={pkg.price}
                discount={pkg.discount}
                image={pkg.image}
                mode="scroll"
                onPress={() => onNavigate?.('productDetails', { id: pkg.id, type: 'package' })}
                onCartPress={() => quickAddToCart(pkg.id, pkg.name, onNavigate)}
              />
            ))}
          </ScrollView>
          </Animated.View>

          {/* Special Deal Banner */}
          <Animated.View entering={FadeInDown.delay(700).springify()}>
            <LinearGradient
              colors={['#312E81', '#1E1B4B']}
            style={styles.specialDealBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {/* Top Row: Icon + Title & Timer */}
            <View style={styles.dealHeaderRow}>
              <View style={styles.dealTitleWrapper}>
                <Gift size={20} color="#FBBF24" />
                <Text style={styles.dealTitle}>Today's Special Deal</Text>
              </View>
              <View style={styles.dealTimer}>
                <View style={styles.timeBox}><Text style={styles.timeNum}>02</Text><Text style={styles.timeLabel}>HRS</Text></View>
                <View style={styles.timeBox}><Text style={styles.timeNum}>45</Text><Text style={styles.timeLabel}>MINS</Text></View>
                <View style={styles.timeBox}><Text style={styles.timeNum}>30</Text><Text style={styles.timeLabel}>SECS</Text></View>
              </View>
            </View>

            {/* Bottom Row: Text & Button */}
            <View style={styles.dealContentRow}>
              <Text style={styles.dealExtraText}>Extra <Text style={{ color: '#FBBF24' }}>5% OFF</Text>{'\n'}on orders above ₹50k</Text>
              <TouchableOpacity style={styles.grabDealBtn}>
                <Text style={styles.grabDealText}>Grab Deal</Text>
                <ChevronRight size={12} color={COLORS.primaryDeep} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          </Animated.View>

          {/* Why Choose Solisspread */}
          <Animated.View entering={FadeInDown.delay(800).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Why Choose Solisspread</Text>
            </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            <TrustBadge icon={<CheckCircle size={20} color="#3B82F6" />} title={'100% Genuine\nProducts'} color="#3B82F6" />
            <TrustBadge icon={<ShieldCheck size={20} color="#EF4444" />} title={'Manufacturer\nWarranty'} color="#EF4444" />
            <TrustBadge icon={<FileText size={20} color="#10B981" />} title={'GST Invoice\nAvailable'} color="#10B981" />
            <TrustBadge icon={<Zap size={20} color="#8B5CF6" />} title={'Installation\nSupport'} color="#8B5CF6" />
            <TrustBadge icon={<CreditCard size={20} color="#6366F1" />} title={'Secure\nPayments'} color="#6366F1" />
            <TrustBadge icon={<RefreshCw size={20} color="#EC4899" />} title={'Easy Returns\n& Refunds'} color="#EC4899" />
          </ScrollView>
          </Animated.View>

          {/* Financing */}
          <Animated.View entering={FadeInDown.delay(900).springify()}>
          <View style={styles.financingGrid}>
            <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.financeCard}>
              <Text style={styles.financeTitle}>Easy EMI Options</Text>
              <Text style={styles.financeSub}>Starting from ₹1,299/month</Text>
              <TouchableOpacity style={styles.financeBtn}>
                <Text style={styles.financeBtnText}>Explore EMI Plans</Text>
                <ChevronRight size={12} color="#166534" />
              </TouchableOpacity>
            </LinearGradient>
            <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.financeCard}>
              <Text style={styles.financeTitle}>Government Subsidy Available</Text>
              <Text style={styles.financeSub}>Save up to 40% on your installation</Text>
              <TouchableOpacity style={[styles.financeBtn, { backgroundColor: '#1E40AF' }]}>
                <Text style={[styles.financeBtnText, { color: '#FFF' }]}>Check Eligibility</Text>
                <ChevronRight size={12} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
          </Animated.View>

          {/* Support Section */}
          <Animated.View entering={FadeInDown.delay(1000).springify()}>
          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportSub}>Our experts are here to help you choose the right solar solution.</Text>
            <View style={styles.supportBtnsRow}>
              <TouchableOpacity style={styles.supportBtn}>
                <PhoneCall size={16} color="#3B82F6" />
                <Text style={[styles.supportBtnText, { color: '#3B82F6' }]}>Call Us</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportBtn}>
                <MessageCircle size={16} color="#10B981" />
                <Text style={[styles.supportBtnText, { color: '#10B981' }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportBtn}>
                <Headphones size={16} color="#F59E0B" />
                <Text style={[styles.supportBtnText, { color: '#F59E0B' }]}>Live Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
    minHeight: Dimensions.get('window').height,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primaryDeep,
  },
  scanBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primaryDeep,
    borderRadius: RADIUS.input,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  bannerWrapper: {
    marginBottom: 24,
    position: 'relative',
  },
  bannerSlide: {
    width: SCREEN_WIDTH - 40,
    height: 160,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  bannerBg: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  bannerHighlight: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  bannerSub: {
    color: COLORS.surface,
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 12,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginRight: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    width: '100%',
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 16,
    backgroundColor: COLORS.accent,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  hScroll: {
    paddingRight: 36,
    marginBottom: 24,
  },
  specialDealBanner: {
    marginTop: 10,
    marginBottom: 24,
    borderRadius: RADIUS.card,
    padding: 16,
  },
  dealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dealTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealTitle: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  dealTimer: {
    flexDirection: 'row',
    gap: 6,
  },
  timeBox: {
    alignItems: 'center',
  },
  timeNum: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
    marginTop: 4,
  },
  dealContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealExtraText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
    marginRight: 12,
  },
  grabDealBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grabDealText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  financingGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  financeCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  financeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  financeSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  financeBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  financeBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
  },
  supportSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  supportSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  supportBtnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    gap: 6,
  },
  supportBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
