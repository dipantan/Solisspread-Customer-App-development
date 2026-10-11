import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ImageBackground, Image, BackHandler, RefreshControl, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ShoppingCart,
  Wrench,
  Zap,
  BadgeCheck,
  ShieldCheck,
  ChevronRight,
  Heart,
  PhoneCall,
  ClipboardList,
  Headphones,
  User,
  Scale,
  ChevronDown,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, GRADIENTS, COMMON_STYLES } from '../../constants/theme';
import { PackageCard } from '../../components/e-commerce/PackageCard';
import * as catalogApi from '../../api/catalog';
import { getProductContent } from '../../utils/productContent';
import { quickAddToCart } from '../../utils/cartActions';
import { ApiError } from '../../api/client';
import { showAlert } from '../../store/useAlertStore';

const { width } = Dimensions.get('window');

interface Props {
  onBack: () => void;
  onNavigate: (step: any, params?: any) => void;
}

const CATEGORIES = [
  { id: '1kw', label: '1KW\nPackages', icon: 'zap' },
  { id: '2kw', label: '2KW\nPackages', icon: 'zap' },
  { id: '3kw', label: '3KW\nPackages', icon: 'zap' },
  { id: '5kw', label: '5KW\nPackages', icon: 'zap' },
  { id: '10kw', label: '10KW+\nPackages', icon: 'zap' },
  { id: 'custom', label: 'Custom\nPackages', icon: 'grid' },
];

const PACKAGES_FALLBACK = [
  {
    id: '1',
    name: '2KW On-Grid\nSolar System',
    tag: 'BEST VALUE',
    desc: 'Perfect for Small Homes',
    output: '2-3 Units/Day',
    price: '₹1,75,999',
    oldPrice: '₹1,99,999',
    discount: '12% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
  {
    id: '2',
    name: '3KW On-Grid\nSolar System',
    tag: 'MOST POPULAR',
    tagColor: '#EAB308',
    desc: 'Ideal for Medium Homes',
    output: '3-4 Units/Day',
    price: '₹2,59,999',
    oldPrice: '₹2,99,999',
    discount: '13% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
  {
    id: '3',
    name: '5KW On-Grid\nSolar System',
    tag: 'HIGH PERFORMANCE',
    tagColor: '#3B82F6',
    desc: 'Best for Large Homes',
    output: '5-6 Units/Day',
    price: '₹3,82,499',
    oldPrice: '₹4,49,999',
    discount: '15% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
  {
    id: '4',
    name: '1KW On-Grid\nSolar System',
    tag: 'BUDGET',
    tagColor: '#10B981',
    desc: 'Perfect for Tiny Homes',
    output: '1-2 Units/Day',
    price: '₹85,999',
    oldPrice: '₹99,999',
    discount: '14% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
  {
    id: '5',
    name: '2KW Off-Grid\nSolar System',
    tag: 'WITH BATTERY',
    tagColor: '#8B5CF6',
    desc: 'Areas with power cuts',
    output: '2-3 Units/Day',
    price: '₹2,10,999',
    oldPrice: '₹2,50,999',
    discount: '15% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
  {
    id: '6',
    name: '3KW Off-Grid\nSolar System',
    tag: 'MOST POPULAR',
    tagColor: '#EAB308',
    desc: 'Reliable backup',
    output: '3-4 Units/Day',
    price: '₹3,05,999',
    oldPrice: '₹3,50,999',
    discount: '12% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
  {
    id: '7',
    name: '10KW On-Grid\nSolar System',
    tag: 'COMMERCIAL',
    tagColor: '#EF4444',
    desc: 'Large Buildings',
    output: '10-12 Units/Day',
    price: '₹7,50,000',
    oldPrice: '₹8,50,000',
    discount: '11% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
  {
    id: '8',
    name: '5KW Off-Grid\nSolar System',
    tag: 'HIGH PERFORMANCE',
    tagColor: '#3B82F6',
    desc: 'Ultimate independence',
    output: '5-6 Units/Day',
    price: '₹4,90,499',
    oldPrice: '₹5,60,999',
    discount: '12% OFF',
    image: require('../../../assets/solar_inverter_product.png'),
  },
];

export default function PackagesScreen({ onBack, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [refreshing, setRefreshing] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fallbackImage = require('../../../assets/solar_inverter_product.png');

  const loadPackages = async () => {
    try {
      const data = await catalogApi.listPackages();
      setPackages(
        data.map((pkg, index) => {
          const { base, mrp } = catalogApi.getRetailPrice(pkg);
          const content = getProductContent(pkg);
          const discount = catalogApi.discountPercent(base, mrp);
          return {
            id: pkg.id,
            name: pkg.name,
            tag: content.badge?.toUpperCase() || (index === 0 ? 'BEST VALUE' : 'PACKAGE'),
            desc: content.shortDescription || pkg.brand || content.typeLabel,
            output: content.power ?? content.package?.systemInfo.find(([label]) => label === 'Energy Generation')?.[1],
            price: base > 0 ? catalogApi.formatInr(base) : 'Price on request',
            oldPrice: mrp > base ? catalogApi.formatInr(mrp) : undefined,
            discount: discount || '',
            image: catalogApi.productImageSource(pkg, fallbackImage),
          };
        }),
      );
    } catch (e: any) {
      showAlert('Error', e instanceof ApiError ? e.message : e?.message || 'Failed to load packages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);


  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadPackages();
  }, []);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  // Renders the Hero Banner
  const renderHeroBanner = () => (
    <View style={styles.heroContainer}>
      <ImageBackground
        source={require('../../../assets/splash_house_solar.png')}
        style={styles.heroBg}
        imageStyle={{ borderRadius: RADIUS.card }}
      >
        <LinearGradient
          colors={['rgba(30, 58, 138, 0.9)', 'rgba(30, 58, 138, 0.7)', 'rgba(30, 58, 138, 0.4)']}
          style={styles.heroOverlay}
        >
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>ALL-IN-ONE SOLAR SOLUTION</Text>
          </View>
          <Text style={styles.heroTitle}>Complete Solar Packages for Your Home & Business</Text>
          <Text style={styles.heroSub}>High quality products • Expert installation{'\n'}Great savings • Long term performance</Text>

          <View style={styles.heroFeaturesRow}>
            <View style={styles.heroFeature}>
              <Zap size={14} color="#FFF" />
              <Text style={styles.heroFeatureText}>Save More</Text>
            </View>
            <View style={styles.heroFeature}>
              <Leaf size={14} color="#FFF" />
              <Text style={styles.heroFeatureText}>Go Green</Text>
            </View>
            <View style={styles.heroFeature}>
              <Headphones size={14} color="#FFF" />
              <Text style={styles.heroFeatureText}>24x7 Support</Text>
            </View>
            <View style={styles.heroFeature}>
              <ClipboardList size={14} color="#FFF" />
              <Text style={styles.heroFeatureText}>Easy EMI</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <SafeAreaView style={COMMON_STYLES.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={COMMON_STYLES.header}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ChevronLeft size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Best Complete Solar Packages</Text>
        <View style={{ width: 40 }} />{/* Placeholder to balance the header */}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={COMMON_STYLES.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryDeep]} />
        }
      >
        {renderHeroBanner()}

        {/* Trust Badges Row */}
        <View style={[styles.trustRow]}>
          <View style={styles.trustItem}>
            <View style={[styles.trustIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Wrench size={16} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle} numberOfLines={2}>Complete Installation</Text>
              <Text style={styles.trustSub}>By Expert Technicians</Text>
            </View>
          </View>
          <View style={styles.trustItem}>
            <View style={[styles.trustIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Zap size={16} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle} numberOfLines={2}>High Efficiency</Text>
              <Text style={styles.trustSub}>Premium Products</Text>
            </View>
          </View>
        </View>
        <View style={[styles.trustRow, { marginTop: 12, marginBottom: 10 }]}>
          <View style={styles.trustItem}>
            <View style={[styles.trustIconBox, { backgroundColor: '#FEF9C3' }]}>
              <BadgeCheck size={16} color="#CA8A04" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle} numberOfLines={2}>Up to 40% Subsidy</Text>
              <Text style={styles.trustSub}>Government Support</Text>
            </View>
          </View>
          <View style={styles.trustItem}>
            <View style={[styles.trustIconBox, { backgroundColor: '#F3E8FF' }]}>
              <ShieldCheck size={16} color="#9333EA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle} numberOfLines={2}>25 Years Warranty</Text>
              <Text style={styles.trustSub}>On Performance</Text>
            </View>
          </View>
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catItem, isActive && styles.catItemActive]}
                activeOpacity={0.8}
                onPress={() => {
                  if (cat.id === 'custom') {
                    onNavigate('custom_package');
                  } else {
                    setActiveTab(cat.id);
                  }
                }}
              >
                <View style={[styles.catIconBox, isActive && styles.catIconBoxActive]}>
                  {cat.icon === 'grid' ? (
                    <View style={styles.gridIcon}>
                      <View style={[styles.gridDot, isActive && { backgroundColor: COLORS.surface }]} />
                      <View style={[styles.gridDot, isActive && { backgroundColor: COLORS.surface }]} />
                      <View style={[styles.gridDot, isActive && { backgroundColor: COLORS.surface }]} />
                      <View style={[styles.gridDot, isActive && { backgroundColor: COLORS.surface }]} />
                    </View>
                  ) : (
                    <Zap size={20} color={isActive ? COLORS.surface : COLORS.primaryDeep} />
                  )}
                </View>
                <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Explore Packages */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore All Packages</Text>
        </View>

        <View style={styles.packagesGrid}>
          {packages.slice(0, visibleCount).map((pkg, index) => (
            <PackageCard
              key={pkg.id}
              name={pkg.name}
              price={pkg.price}
              oldPrice={pkg.oldPrice}
              discount={pkg.discount}
              image={pkg.image}
              tag={pkg.tag}
              tagColor={pkg.tagColor}
              desc={pkg.desc}
              output={pkg.output}
              index={index}
              mode="grid"
              onPress={() => onNavigate?.('productDetails', { id: pkg.id, type: 'package' })}
              onCartPress={() => quickAddToCart(pkg.id, pkg.name, onNavigate)}
            />
          ))}
        </View>

        {visibleCount < packages.length && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            activeOpacity={0.8}
            onPress={() => setVisibleCount(prev => prev + 6)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.loadMoreText}>View More Packages</Text>
              <ChevronDown size={16} color={COLORS.primaryDeep} />
            </View>
          </TouchableOpacity>
        )}

        {/* Each Package Includes */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 24, marginBottom: 16 }]}>Each Package Includes</Text>
        <View style={styles.includesGrid}>
          {[
            { img: require('../../../assets/cat_solar_panel.png'), title: 'Solar Panels', sub: 'High Efficiency' },
            { img: require('../../../assets/cat_inverter.png'), title: 'Grid Tie Inverter', sub: 'Premium Quality' },
            { img: require('../../../assets/cat_accessories.png'), title: 'Mounting Structure', sub: 'GI / Aluminum' },
            { img: require('../../../assets/cat_battery.png'), title: 'DC / AC Cables', sub: 'High Quality' },
            { img: require('../../../assets/onboarding_installation.png'), title: 'Installation', sub: 'Expert Team' },
          ].map((item, idx) => (
            <View key={idx} style={styles.includeItemGrid}>
              <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.includeImgBox}>
                <Image source={item.img} style={styles.includeImg} resizeMode="contain" />
              </LinearGradient>
              <Text style={styles.includeTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.includeSub} numberOfLines={1}>{item.sub}</Text>
            </View>
          ))}
        </View>

        {/* Compare Packages Table */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 32, marginBottom: 16 }]}>Compare Packages</Text>
        <View style={styles.compareTableWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 16 }}>
            <View style={styles.compareTable}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.5, minWidth: 100, textAlign: 'left', paddingLeft: 16 }]}>Features</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader, { minWidth: 80 }]}>2KW</Text>
                <LinearGradient colors={[COLORS.accentLight, COLORS.accent]} style={[styles.popularColHeader, { minWidth: 90 }]}>
                  <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>POPULAR</Text></View>
                  <Text style={[styles.tableCell, styles.tableCellHeader, { color: COLORS.primaryDeep }]}>3KW</Text>
                </LinearGradient>
                <Text style={[styles.tableCell, styles.tableCellHeader, { minWidth: 80 }]}>5KW</Text>
              </View>

              {[
                ['Daily Power', '2-3 Units', '3-4 Units', '5-6 Units'],
                ['Best For', 'Small Home', 'Medium Home', 'Large Home'],
                ['Solar Panel', '4 Panels', '8 Panels', '12 Panels'],
                ['Warranty', '25 Yrs', '25 Yrs', '25 Yrs'],
                ['Price', '₹1.75L', '₹2.59L', '₹3.82L'],
              ].map((row, idx) => (
                <View key={idx} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={[styles.tableCell, styles.tableCellFeature, { flex: 1.5, minWidth: 100, textAlign: 'left', paddingLeft: 16 }]}>{row[0]}</Text>
                  <Text style={[styles.tableCell, { minWidth: 80 }]}>{row[1]}</Text>
                  <View style={[styles.popularColCell, { minWidth: 90 }]}>
                    <Text style={[styles.tableCell, { fontWeight: '800', color: COLORS.primaryDeep }]}>{row[2]}</Text>
                  </View>
                  <Text style={[styles.tableCell, { minWidth: 80 }]}>{row[3]}</Text>
                </View>
              ))}
              <View style={styles.tableFooter}>
                <ShieldCheck size={16} color={COLORS.accent} />
                <Text style={styles.tableFooterText}>All packages come with 25 years performance warranty.</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Need Help Banner */}
        <View style={[styles.helpBanner, { borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 12 }]}>
          <View style={styles.helpBannerTop}>
            <LottieView
              source={require('../../../assets/animations/help.json')}
              autoPlay
              loop
              style={styles.helpLottie}
            />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need Help Choosing?</Text>
              <Text style={styles.helpDesc}>Our solar experts are here to help you find the perfect solution.</Text>
            </View>
          </View>
          <View style={styles.helpBannerBottom}>
            <TouchableOpacity style={styles.talkBtn} activeOpacity={0.8}>
              <Text style={styles.talkBtnText}>Talk to Expert</Text>
            </TouchableOpacity>
            <View style={styles.callBox}>
              <Text style={styles.callLabel}>Call Now</Text>
              <View style={styles.callRow}>
                <PhoneCall size={16} color={COLORS.primaryDeep} />
                <Text style={styles.callNumber}>1800-123-4567</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Why Choose */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 32, marginBottom: 16 }]}>Why Choose Solisspread?</Text>
        <View style={styles.whyGrid}>
          {[
            { icon: ShieldCheck, title: 'Quality Assurance', desc: 'Only top quality branded products' },
            { icon: User, title: 'Expert Installation', desc: 'Trained & certified installation team' },
            { icon: Wrench, title: 'End to End Service', desc: 'From consultation to maintenance' },
            { icon: Headphones, title: 'After Sales Support', desc: '24x7 customer support & service' },
          ].map((item, idx) => (
            <View key={idx} style={styles.whyItem}>
              <View style={styles.whyIconBox}>
                <item.icon size={20} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyTitle}>{item.title}</Text>
                <Text style={styles.whyDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Need to create Leaf icon mockup as it's missing from lucide standard
const Leaf = ({ size, color }: any) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2, opacity: 0.8 }} />
)

const styles = StyleSheet.create({
  heroContainer: {
    padding: 20,
  },
  heroBg: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroFeatureText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  catScroll: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  catItem: {
    alignItems: 'center',
    width: 70,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  catItemActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#F0F9FF',
  },
  catIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  catIconBoxActive: {
    backgroundColor: COLORS.accent,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  catLabelActive: {
    color: COLORS.primaryDeep,
    fontWeight: '800',
  },
  gridIcon: {
    width: 16,
    height: 16,
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    alignContent: 'center',
  },
  gridDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: COLORS.primaryDeep,
  },
  trustRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  trustItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    gap: 12,
  },
  trustIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  trustSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
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
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginRight: 2,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    justifyContent: 'space-between',
  },
  pkgCardGrid: {
    width: (width - 40 - 12) / 2, // 2 columns
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
    marginBottom: 4,
    overflow: 'hidden',
  },

  actionRowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  detailsBtnGrid: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primaryDeep,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsBtnTextGrid: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  cartBtnGrid: {
    backgroundColor: COLORS.primaryDeep,
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryDeep,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    color: COLORS.primaryDeep,
    fontSize: 13,
    fontWeight: '700',
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  includeItemGrid: {
    width: (width - 32 - 12) / 2, // 2 columns with 12 gap
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  includeImgBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  includeImg: {
    width: 44,
    height: 44,
  },
  includeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    textAlign: 'center',
  },
  includeSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  compareTableWrapper: {
    paddingHorizontal: 20,
    marginHorizontal: 0,
  },
  compareTable: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    overflow: 'hidden',
    minWidth: width - 40,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: COLORS.surface,
  },
  tableRowOdd: {
    backgroundColor: '#F8FAFC',
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 11,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  tableCellHeader: {
    fontWeight: '800',
    color: COLORS.primaryDeep,
    fontSize: 13,
  },
  tableCellFeature: {
    fontWeight: '600',
    color: COLORS.primaryDeep,
    textAlign: 'left',
    paddingLeft: 16,
  },
  popularColHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  popularBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    position: 'absolute',
    top: 0,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
  },
  popularColCell: {
    flex: 1,
    backgroundColor: COLORS.accentLight + '40', // light transparent
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.accent,
    minWidth: 80,
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  tableFooterText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    flex: 1,
  },
  helpBanner: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: COLORS.surface,
    padding: 16,
  },
  helpBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpBannerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  helpLottie: {
    width: 60,
    height: 60,
    transform: [{ scale: 2.5 }],
    position: 'relative',
    bottom: 0,
    right: 0,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  helpDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  talkBtn: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  talkBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  callBox: {
    alignItems: 'flex-end',
  },
  callLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  whyItem: {
    width: (width - 40 - 16) / 2,
    flexDirection: 'row',
    gap: 10,
  },
  whyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  whyDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
});
