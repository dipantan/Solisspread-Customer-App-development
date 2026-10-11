import React, { useState, useEffect } from 'react';
import { ActivityIndicator, BackHandler, Dimensions, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
//
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ShoppingCart,
  Search,
  Heart,
  Mic,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Tag,
  Flame,
  Clock,
  Bell,
  LayoutGrid,
  List,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Truck,
  Headphones,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import { ProductCard } from '../../components/e-commerce/ProductCard';
import { SearchBarWithFilter } from '../../components/common/SearchBarWithFilter';
import { NotificationsPanel } from '../../components/common/NotificationsPanel';
import { CategoryCard } from '../../components/e-commerce/CategoryCard';
import * as catalogApi from '../../api/catalog';
import { quickAddToCart } from '../../utils/cartActions';
import { useCartStore } from '../../store/useCartStore';
import * as cartApi from '../../api/cart';
import { ApiError } from '../../api/client';

const { width } = Dimensions.get('window');

interface Props {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
  brand?: string;
}

const normalizeBrand = (value?: string | null) => (value ?? '').trim().toLowerCase();

const CATEGORIES = [
  { id: 'panels', label: 'Solar Panels', icon: <LayoutGrid size={24} color={COLORS.primaryDeep} /> },
  { id: 'inverters', label: 'Inverters', icon: <Zap size={24} color={COLORS.primaryDeep} /> },
  { id: 'batteries', label: 'Batteries', icon: <Zap size={24} color={COLORS.primaryDeep} /> }, // Ideally battery icon
  { id: 'packages', label: 'Solar Packages', icon: <CheckCircle2 size={24} color={COLORS.primaryDeep} /> },
  { id: 'accessories', label: 'Accessories', icon: <ShoppingCart size={24} color={COLORS.primaryDeep} /> },
  { id: 'all', label: 'View All', icon: <LayoutGrid size={24} color={COLORS.primaryDeep} /> },
];

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'sale', label: 'On Sale', icon: <Tag size={12} color="#EF4444" /> },
  { id: 'best', label: 'Best Selling', icon: <Flame size={12} color="#F59E0B" /> },
  { id: 'new', label: 'New Arrivals', icon: <Clock size={12} color="#10B981" /> },
  { id: 'stock', label: 'In Stock', icon: <CheckCircle2 size={12} color="#16A34A" /> },
];


export default function ProductsScreen({ onBack, onNavigate, brand }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const [isNotifVisible, setIsNotifVisible] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cartCount = useCartStore((s) => s.totals.itemCount);
  const [brandFilter, setBrandFilter] = useState<string | undefined>(brand);

  useEffect(() => {
    setBrandFilter(brand);
  }, [brand]);

  const visibleProducts = brandFilter
    ? products.filter((p) => normalizeBrand(p.raw?.brand) === normalizeBrand(brandFilter))
    : products;

  const fallbackImage = require('../../../assets/splash_house_solar.png');

  const mapProduct = (prod: any) => {
    const { base, mrp } = catalogApi.getRetailPrice(prod);
    const discount = catalogApi.discountPercent(base, mrp);
    return {
      id: prod.id,
      name: prod.name,
      discount: discount || '',
      rating: '4.5',
      reviews: '—',
      price: base > 0 ? catalogApi.formatInr(base) : 'Price on request',
      originalPrice: mrp > base ? catalogApi.formatInr(mrp) : undefined,
      isBestSeller: prod.type === 'COMPLETE_PACKAGE',
      savings: mrp > base ? `You Save ${catalogApi.formatInr(mrp - base)}` : undefined,
      image: catalogApi.productImageSource(prod, fallbackImage),
      raw: prod,
    };
  };

  const loadProducts = async () => {
    try {
      setError(null);
      const data = await catalogApi.listProducts();
      setProducts(data.map(mapProduct));
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);


  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  useEffect(() => {
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
          <ChevronLeft size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <View>
          <Text style={COMMON_STYLES.headerTitle}>{brandFilter || 'All Products'}</Text>
          <Text style={styles.headerSubtitle}>
            {loading && !products.length ? 'Loading…' : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'Product' : 'Products'}`}
          </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsNotifVisible(true)}>
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

  const renderSearchBar = () => (
    <SearchBarWithFilter
      onSearchPress={() => onNavigate && onNavigate('search')}
      onFilterPress={() => onNavigate && onNavigate('filter')}
    />
  );

  const renderHeroBanner = () => (
    <View style={styles.heroContainer}>
      <ImageBackground
        source={require('../../../assets/splash_house_solar.png')}
        style={styles.heroBg}
        imageStyle={{ borderRadius: RADIUS.card }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroOverlay}
        >
          <Text style={styles.heroSubtitle}>Premium Quality</Text>
          <Text style={styles.heroTitle}>Solar Products</Text>
          <Text style={styles.heroDesc}>High Efficiency • Best Price • Long Life</Text>

          <View style={styles.heroBadgesRow}>
            <View style={styles.heroBadge}>
              <ShieldCheck size={12} color={COLORS.primaryDeep} />
              <Text style={styles.heroBadgeText}>Genuine{'\n'}Products</Text>
            </View>
            <View style={styles.heroBadge}>
              <BadgeCheck size={12} color={COLORS.primaryDeep} />
              <Text style={styles.heroBadgeText}>Best Price{'\n'}Guarantee</Text>
            </View>
            <View style={styles.heroBadge}>
              <Truck size={12} color={COLORS.primaryDeep} />
              <Text style={styles.heroBadgeText}>Fast & Safe{'\n'}Delivery</Text>
            </View>
            <View style={styles.heroBadge}>
              <Headphones size={12} color={COLORS.primaryDeep} />
              <Text style={styles.heroBadgeText}>Easy{'\n'}Returns</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  const renderCategories = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
      {CATEGORIES.map((cat, index) => (
        <CategoryCard
          key={cat.id}
          title={cat.label}
          icon={cat.icon}
          index={index}
          onPress={() => { }}
        />
      ))}
    </ScrollView>
  );

  const renderFilterTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsScroll}>
      {FILTER_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <SafeAreaView style={COMMON_STYLES.container} edges={['top', 'bottom']}>
      {renderHeader()}
      {renderSearchBar()}

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[COMMON_STYLES.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryDeep]} />
        }
      >
        {renderHeroBanner()}
        {renderCategories()}
        {renderFilterTabs()}

        {brandFilter ? (
          <View style={styles.brandChipRow}>
            <View style={styles.brandChip}>
              <Text style={styles.brandChipText}>Brand: {brandFilter}</Text>
              <TouchableOpacity onPress={() => setBrandFilter(undefined)} hitSlop={8} accessibilityLabel="Clear brand filter">
                <X size={14} color={COLORS.primaryDeep} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {visibleProducts.length} {visibleProducts.length === 1 ? 'Product' : 'Products'} Found
          </Text>
          <TouchableOpacity style={styles.actionBtn}>
            <ArrowUpDown size={16} color={COLORS.primaryDeep} />
            <Text style={styles.actionBtnText}>Sort</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {loading && !products.length ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 24 }} />
          ) : null}
          {error ? <Text style={{ color: COLORS.error, textAlign: "center", margin: 16 }}>{error}</Text> : null}
          {!loading && !error && brandFilter && !visibleProducts.length ? (
            <View style={styles.emptyBrand}>
              <Text style={styles.emptyBrandTitle}>No {brandFilter} products yet</Text>
              <Text style={styles.emptyBrandText}>Check back soon, or browse all products.</Text>
              <TouchableOpacity style={styles.emptyBrandBtn} onPress={() => setBrandFilter(undefined)}>
                <Text style={styles.emptyBrandBtnText}>View all products</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {visibleProducts.map((prod, index) => (
            <ProductCard
              key={prod.id}
              name={prod.name}
              price={prod.price}
              originalPrice={prod.originalPrice}
              discount={prod.discount}
              savings={prod.savings}
              image={prod.image}
              isBestSeller={prod.isBestSeller}
              reviews={prod.reviews}
              index={index}
              mode="grid"
              onPress={() => onNavigate?.('productDetails', { id: prod.id, type: prod.raw?.type === 'COMPLETE_PACKAGE' ? 'package' : 'product' })}
              onCartPress={() => quickAddToCart(prod.id, prod.name, onNavigate)}
            />
          ))}
        </View>

        {/* Bottom Trust Row */}
        <View style={styles.bottomTrustRow}>
          <View style={styles.bottomTrustItem}>
            <ShieldCheck size={20} color={COLORS.primaryDeep} />
            <Text style={styles.bottomTrustText}>100% Genuine{'\n'}Products</Text>
          </View>
          <View style={styles.bottomTrustItem}>
            <BadgeCheck size={20} color={COLORS.primaryDeep} />
            <Text style={styles.bottomTrustText}>Best Price{'\n'}Guarantee</Text>
          </View>
          <View style={styles.bottomTrustItem}>
            <Truck size={20} color={COLORS.primaryDeep} />
            <Text style={styles.bottomTrustText}>Fast & Safe{'\n'}Delivery</Text>
          </View>
          <View style={styles.bottomTrustItem}>
            <Headphones size={20} color={COLORS.primaryDeep} />
            <Text style={styles.bottomTrustText}>24x7 Customer{'\n'}Support</Text>
          </View>
        </View>
      </ScrollView>

      <NotificationsPanel visible={isNotifVisible} onClose={() => setIsNotifVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandChipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.infoLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  emptyBrand: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyBrandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    textAlign: 'center',
  },
  emptyBrandText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyBrandBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyBrandBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  iconBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  heroBg: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.card,
  },
  heroOverlay: {
    flex: 1,
    borderRadius: RADIUS.card,
    padding: 16,
    justifyContent: 'center',
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  catScroll: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterTabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    borderColor: COLORS.primaryDeep,
    backgroundColor: '#EFF6FF',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.primaryDeep,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  bottomTrustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomTrustItem: {
    alignItems: 'center',
    flex: 1,
  },
  bottomTrustText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  }
});
