import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ImageBackground,
  RefreshControl
} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sun,
  Zap,
  Battery,
  Shield,
  ArrowRight,
  Wrench,
  Leaf,
  CheckCircle,
  ShieldCheck,
  IndianRupee,
  Headphones,
  Award,
  Truck,
  ChevronRight,
} from 'lucide-react-native';
import { ProductCard } from '../../components/e-commerce/ProductCard';
import { CategoryCard } from '../../components/e-commerce/CategoryCard';
import { DynamicSkyHeader } from '../../components/DynamicSky/DynamicSkyHeader';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedScrollHandler,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, GRADIENTS } from '../../constants/theme';
import MainLayout from '../../layouts/MainLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { firstName } from '../../utils/userDisplay';
import { quickAddToCart } from '../../utils/cartActions';
import { discountPercent, formatInr, getRetailPrice, listProducts, productImageSource } from '../../api/catalog';
import { getContactInfo } from '../../api/settings';
import type { Product } from '../../api/types';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const HERO_IMAGES = [
  require('../../../assets/banner1.png'),
  require('../../../assets/hero_solar_banner.png'),
  require('../../../assets/splash_solar_bg.png'),
  require('../../../assets/splash_house_solar.png'),
];

export default function HomeScreen({ onNavigate }: { onNavigate?: (step: any, params?: any) => void }) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [heroImages, setHeroImages] = useState<any[]>(HERO_IMAGES);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    getContactInfo().then((c) => {
      if (c.bannerUrls?.length) {
        setHeroImages(c.bannerUrls.map((uri) => ({ uri })));
      }
    }).catch(() => {});
  }, []);

  const loadFeatured = useCallback(async () => {
    try {
      const products = await listProducts();
      setFeatured(products.filter((p) => p.type !== 'COMPLETE_PACKAGE').slice(0, 6));
    } catch {
      // the section simply stays empty when the catalog is unreachable
    }
  }, []);

  useEffect(() => {
    refreshUser();
    loadFeatured();
  }, [refreshUser, loadFeatured]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning ☀️');
    else if (hour < 17) setGreeting('Good Afternoon 🌤️');
    else setGreeting('Good Evening 🌙');
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refreshUser(), loadFeatured()]).finally(() => setRefreshing(false));
  }, [refreshUser, loadFeatured]);

  const gradientProgress = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    gradientProgress.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 6000, easing: Easing.linear }),
      -1,
      false // keep spinning in one direction
    );
  }, [gradientProgress]);

  const animatedGradientProps = useAnimatedProps(() => {
    const angle = gradientProgress.value;
    const radius = 0.8;
    return {
      start: { x: 0.5 + Math.cos(angle) * radius, y: 0.5 + Math.sin(angle) * radius },
      end: { x: 0.5 - Math.cos(angle) * radius, y: 0.5 - Math.sin(angle) * radius },
    };
  });

  return (
    <MainLayout transparentHeader={true} headerScrollY={scrollY} activeTab="home" onTabChange={onNavigate}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.surface}
            colors={[COLORS.primaryDeep]}
            progressViewOffset={80}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 12) + 50,
          paddingTop: 0,
        }}
      >
        <DynamicSkyHeader userName={firstName(user)}>

          {/* Hero Solar Banner Slider */}
          <View style={styles.heroCard}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event: any) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
                setActiveHeroIndex(index);
              }}
            >
              {heroImages.map((img, index) => (
                <View key={index} style={{ width: Dimensions.get('window').width - 40 }}>
                  <Image
                    source={img}
                    style={styles.heroBgImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.paginationDots}>
              {heroImages.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeHeroIndex === idx ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </View>
        </DynamicSkyHeader>

        {/* Main Body Content (White Background) */}
        <View style={styles.bodyContent}>
          {/* Solar Calculator Card Widget */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.calcCard}>
              <View style={styles.calcLeft}>
                <Text style={styles.calcTitle}>Solar Calculator</Text>
                <Text style={styles.calcSub}>
                  Enter your electricity bill{'\n'}and get your estimate
                </Text>

                <TouchableOpacity
                  style={styles.calcButton}
                  activeOpacity={0.85}
                  onPress={() => onNavigate?.('solar_calculator')}
                >
                  <Text style={styles.calcButtonText}>Calculate Now</Text>
                  <ArrowRight size={14} color={COLORS.surface} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              <View style={styles.calcRight}>
                <Image
                  source={require('../../../assets/onboarding_calculator.png')}
                  style={styles.calcImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Animated.View>

          {/* Shop by Category Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate && onNavigate('categories')}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.viewAll}>View All</Text>
                  <ChevronRight size={14} color={COLORS.accent} style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
            >
              <CategoryCard index={0} title="Solar Panels" icon={<Image source={require('../../../assets/cat_solar_panel.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} onPress={() => onNavigate && onNavigate('shop')} />
              <CategoryCard index={1} title="Inverters" icon={<Image source={require('../../../assets/cat_inverter.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} onPress={() => onNavigate && onNavigate('shop')} />
              <CategoryCard index={2} title="Batteries" icon={<Image source={require('../../../assets/cat_battery.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} onPress={() => onNavigate && onNavigate('shop')} />
              <CategoryCard index={3} title="Accessories" icon={<Image source={require('../../../assets/cat_accessories.png')} style={{ width: 70, height: 70 }} resizeMode="contain" />} onPress={() => onNavigate && onNavigate('shop')} />
            </ScrollView>
          </Animated.View>

          {/* Top Products Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Products</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate && onNavigate('products', { brand: null })}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.viewAll}>View All</Text>
                  <ChevronRight size={14} color={COLORS.accent} style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.prodScroll}
            >
              {featured.map((prod, index) => {
                const { base, mrp } = getRetailPrice(prod);
                return (
                  <ProductCard
                    key={prod.id}
                    index={index}
                    name={prod.name}
                    price={formatInr(base)}
                    originalPrice={mrp > base ? formatInr(mrp) : undefined}
                    discount={discountPercent(base, mrp)}
                    image={productImageSource(prod, require('../../../assets/solar_panel_product.png'))}
                    onPress={() => onNavigate?.('productDetails', { id: prod.id, type: 'product' })}
                    onCartPress={() => quickAddToCart(prod.id, prod.name, onNavigate)}
                  />
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Services Carousel */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.servicesScroll}
              contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 36 }}
              snapToInterval={Dimensions.get('window').width * 0.85 + 16}
              decelerationRate="fast"
            >
              {/* AMC Request Card */}
              <TouchableOpacity activeOpacity={0.9} style={[styles.amcCardWrapper, { width: Dimensions.get('window').width * 0.85, marginRight: 16, marginBottom: 0 }]} onPress={() => onNavigate?.('buy_amc')}>
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.amcCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.amcLeft}>
                    <Text style={styles.amcTitle}>Annual Maintenance</Text>
                    <Text style={styles.amcSub}>Keep your solar setup running at peak efficiency.</Text>
                    <View style={styles.amcButton}>
                      <Text style={styles.amcButtonText}>Request AMC</Text>
                      {/* @ts-ignore */}
                      <ArrowRight size={14} color={COLORS.primaryDeep} />
                    </View>
                  </View>
                  <View style={styles.amcRight}>
                    <View style={styles.amcIconBg}>
                      {/* @ts-ignore */}
                      <Wrench size={32} color={COLORS.surface} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Book Installation Card */}
              <TouchableOpacity activeOpacity={0.9} style={[styles.amcCardWrapper, { width: Dimensions.get('window').width * 0.85, marginBottom: 0 }]} onPress={() => onNavigate?.('solar_calculator')}>
                <LinearGradient
                  colors={['#FF9800', '#F57C00']}
                  style={styles.amcCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.amcLeft}>
                    <Text style={styles.amcTitle}>Book Installation</Text>
                    <Text style={styles.amcSub}>Get expert solar installation at your doorstep.</Text>
                    <View style={styles.amcButton}>
                      <Text style={[styles.amcButtonText, { color: '#E65100' }]}>Book Now</Text>
                      {/* @ts-ignore */}
                      <ArrowRight size={14} color="#E65100" />
                    </View>
                  </View>
                  <View style={styles.amcRight}>
                    <View style={styles.amcIconBg}>
                      {/* @ts-ignore */}
                      <Zap size={32} color={COLORS.surface} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>

          {/* Mega Summer Sale Banner */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <TouchableOpacity activeOpacity={0.9} style={styles.saleBannerWrapper} onPress={() => onNavigate?.('products', { brand: null })}>
              <ImageBackground
                source={require('../../../assets/splash_solar_bg.png')}
                style={styles.saleBanner}
                imageStyle={{ borderRadius: RADIUS.card }}
              >
                <LinearGradient
                  colors={['rgba(13, 47, 95, 0.95)', 'rgba(13, 47, 95, 0.7)']}
                  style={styles.saleOverlay}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.saleContent}>
                    <Text style={styles.saleTitle}>Mega Summer Sale</Text>
                    <Text style={styles.saleSub}>Up to 20% OFF on all solar products</Text>
                    <TouchableOpacity style={styles.saleBtn} onPress={() => onNavigate?.('products', { brand: null })}>
                      <Text style={styles.saleBtnText}>Shop Now</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeUpTo}>UP TO</Text>
                    <Text style={styles.saleBadgeOff}>20%</Text>
                    <Text style={styles.saleBadgeUpTo}>OFF</Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          </Animated.View>

          {/* Why Choose Solar? */}
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <View style={[styles.sectionHeader]}>
              <Text style={styles.sectionTitle}>Why Choose Solar?</Text>
            </View>
            <View style={styles.whyGrid}>
              <View style={styles.whyCard}>
                <View style={[styles.whyIconBg, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <CheckCircle size={24} color="#4CAF50" />
                </View>
                <View style={styles.whyTextWrapper}>
                  <Text style={styles.whyTitle}>Save Up to 80%</Text>
                  <Text style={styles.whySub}>on Electricity Bills</Text>
                </View>
              </View>
              <View style={styles.whyCard}>
                <View style={[styles.whyIconBg, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                  <Leaf size={24} color="#2196F3" />
                </View>
                <View style={styles.whyTextWrapper}>
                  <Text style={styles.whyTitle}>Clean & Green</Text>
                  <Text style={styles.whySub}>Energy for tomorrow</Text>
                </View>
              </View>
              <View style={styles.whyCard}>
                <View style={[styles.whyIconBg, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
                  <ShieldCheck size={24} color="#FFC107" />
                </View>
                <View style={styles.whyTextWrapper}>
                  <Text style={styles.whyTitle}>25 Years</Text>
                  <Text style={styles.whySub}>Performance Warranty</Text>
                </View>
              </View>
              <View style={styles.whyCard}>
                <View style={[styles.whyIconBg, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                  <IndianRupee size={24} color="#9C27B0" />
                </View>
                <View style={styles.whyTextWrapper}>
                  <Text style={styles.whyTitle}>Increase Property</Text>
                  <Text style={styles.whySub}>Value with Solar</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Need Help Banner */}
          <Animated.View entering={FadeInDown.delay(700).springify()}>
            <View style={styles.helpBanner}>
              <View style={styles.helpLeft}>
                <View style={styles.helpIconBg}>
                  <Headphones size={24} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpTitle}>Need Help?</Text>
                  <Text style={styles.helpSub}>Our experts are here for you.</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.helpBtn}>
                <Text style={styles.helpBtnText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer Trust Badges */}
          <Animated.View entering={FadeInDown.delay(800).springify()}>
            <View style={styles.trustContainer}>
              <View style={styles.trustItem}>
                <Shield size={16} color={COLORS.textSecondary} />
                <Text style={styles.trustText}>100% Genuine</Text>
              </View>
              <View style={styles.trustItem}>
                <Award size={16} color={COLORS.textSecondary} />
                <Text style={styles.trustText}>Best Price</Text>
              </View>
              <View style={styles.trustItem}>
                <Truck size={16} color={COLORS.textSecondary} />
                <Text style={styles.trustText}>Fast & Safe</Text>
              </View>
              <View style={styles.trustItem}>
                <Headphones size={16} color={COLORS.textSecondary} />
                <Text style={styles.trustText}>24x7 Support</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  animatedTopSection: {
    paddingTop: 80, // Padding to avoid overlap with absolute sticky header
    paddingBottom: 20,
    marginBottom: -20, // Negative margin to blend with bodyContent border radius
  },
  greetingContainer: {
    marginTop: 5,
    marginBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTimeBg: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  greetingTime: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.surface,
  },
  greetingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  greetingSub: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  bodyContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroCard: {
    height: 150,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 20,
    marginHorizontal: 20,
    ...SHADOWS.card,
  },
  heroBgImage: {
    width: '100%',
    height: '100%',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.accent,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  calcCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  calcLeft: {
    flex: 1,
    paddingRight: 10,
  },
  calcRight: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcImage: {
    width: '100%',
    height: '100%',
  },
  calcTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryNavy,
    marginBottom: 6,
  },
  calcSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDeep,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  calcButtonText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  catScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  prodScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  servicesScroll: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  amcCardWrapper: {
    marginBottom: 24,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  amcCard: {
    borderRadius: RADIUS.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amcLeft: {
    flex: 1,
    paddingRight: 16,
  },
  amcRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  amcIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amcTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.surface,
    marginBottom: 6,
  },
  amcSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 16,
  },
  amcButton: {
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amcButtonText: {
    color: COLORS.primaryDeep,
    fontSize: 13,
    fontWeight: '800',
  },
  saleBannerWrapper: {
    marginBottom: 30,
    marginTop: 10,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  saleBanner: {
    width: '100%',
    minHeight: 120,
  },
  saleOverlay: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.card,
  },
  saleContent: {
    flex: 1,
  },
  saleTitle: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  saleSub: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  saleBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  saleBtnText: {
    color: COLORS.primaryDeep,
    fontSize: 13,
    fontWeight: '700',
  },
  saleBadge: {
    backgroundColor: COLORS.accent,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  saleBadgeUpTo: {
    fontSize: 9,
    color: COLORS.primaryDeep,
    fontWeight: '800',
  },
  saleBadgeOff: {
    fontSize: 22,
    color: COLORS.primaryDeep,
    fontWeight: '900',
    lineHeight: 22,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
  },
  whyCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  whyIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  whyTextWrapper: {
    flex: 1,
  },
  whyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  whySub: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  helpBanner: {
    backgroundColor: COLORS.primaryNavy,
    borderRadius: RADIUS.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    ...SHADOWS.card,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  helpIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.surface,
  },
  helpSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    flexShrink: 1,
  },
  helpBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  trustContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  trustItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
