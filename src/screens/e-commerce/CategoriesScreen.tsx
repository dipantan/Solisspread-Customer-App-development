import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, Dimensions, BackHandler, RefreshControl, ActivityIndicator } from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  ChevronRight,
  ShieldCheck,
  Percent,
  Truck,
  Headphones,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import { SearchBarWithFilter } from '../../components/common/SearchBarWithFilter';
import { MOTION } from '../../constants/motion';
import { AnimatedButton } from '../../components/common/AnimatedButton';
import * as catalogApi from '../../api/catalog';
import { ApiError } from '../../api/client';

interface CategoriesScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 40 - 24) / 4;

export default function CategoriesScreen({ onBack, onNavigate }: CategoriesScreenProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const MARQUEE_BRANDS = brands;
  const DUPLICATED_BRANDS = [...MARQUEE_BRANDS, ...MARQUEE_BRANDS, ...MARQUEE_BRANDS, ...MARQUEE_BRANDS];
  const [loading, setLoading] = useState(true);
  const fallbackImage = require('../../../assets/cat_solar_panel.png');

  useEffect(() => {
    (async () => {
      try {
        const [cats, brandList] = await Promise.all([
          catalogApi.listCategories(),
          catalogApi.listBrands(),
        ]);
        setCategories(
          cats.map((c) => ({
            id: c.id,
            title: c.name,
            count: c.level ? `(${c.level})` : '',
            image: c.imageUrl ? { uri: c.imageUrl } : fallbackImage,
          })),
        );
        setBrands(brandList.map((b) => b.name).filter(Boolean));
      } catch (e) {
        // keep fallback mocks
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    })();
  }, []);

  const [visibleRows, setVisibleRows] = useState(2);
  const visibleCount = visibleRows * 4;
  const visibleCategories = categories.slice(0, visibleCount);
  const canShowMore = visibleCount < categories.length;

  const handleShowMore = () => {
    setVisibleRows(prev => prev + 2);
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const marqueeTranslateX = useSharedValue(0);

  useEffect(() => {
    marqueeTranslateX.value = withRepeat(
      withTiming(-width * 2, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const marqueeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: marqueeTranslateX.value }],
      flexDirection: 'row',
    };
  });

  return (
    <SafeAreaView style={COMMON_STYLES.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={COMMON_STYLES.header}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ChevronLeft size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Shop by Category</Text>
        <View style={{ width: 40 }} />{/* Placeholder to balance the header */}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={COMMON_STYLES.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primaryDeep]} />
        }
      >

        {/* Search & Filter */}
        <SearchBarWithFilter
          onSearchPress={() => onNavigate && onNavigate('search')}
          onFilterPress={() => onNavigate && onNavigate('filter')}
        />

        {/* Category Grid */}
        <View style={styles.gridContainer}>
          {!loading && categories.length === 0 && (
            <Text style={{ width: '100%', textAlign: 'center', color: COLORS.textSecondary, paddingVertical: 32 }}>
              No categories available yet.
            </Text>
          )}
          {visibleCategories.map((item, index) => (
            <AnimatedButton
              key={index}
              style={styles.gridItem}
              entering={MOTION.listStaggerFade(index % 8)}
              onPress={() => onNavigate && onNavigate('shop')}
            >
              <Image source={item.image} style={styles.gridImage} resizeMode="contain" />
              <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.gridCount}>{item.count}</Text>
            </AnimatedButton>
          ))}
        </View>

        {/* View More Button */}
        {canShowMore && (
          <TouchableOpacity style={styles.viewMoreBtn} onPress={handleShowMore}>
            <LayoutGrid size={16} color={COLORS.primaryDeep} style={{ marginRight: 8 }} />
            <Text style={styles.viewMoreText}>View More Categories</Text>
            <ChevronRight size={16} color={COLORS.textSecondary} style={{ position: 'absolute', right: 16 }} />
          </TouchableOpacity>
        )}

        {/* Top Brands Marquee */}
        {MARQUEE_BRANDS.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Brands</Text>
            </View>
            <View style={styles.marqueeContainer}>
              <Animated.View style={marqueeStyle}>
                {DUPLICATED_BRANDS.map((brand, i) => (
                  <View key={i} style={styles.brandCard}>
                    <Text style={styles.brandPlaceholder}>{brand}</Text>
                  </View>
                ))}
              </Animated.View>
            </View>
          </>
        )}

        {/* Trust Badges Grid */}
        <View style={styles.trustBannerContainer}>
          <View style={styles.trustGrid}>
            <View style={styles.trustCard}>
              <View style={[styles.trustIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <ShieldCheck size={24} color="#3B82F6" />
              </View>
              <Text style={styles.trustTitle}>100% Genuine</Text>
              <Text style={styles.trustSub}>Original & trusted</Text>
            </View>

            <View style={styles.trustCard}>
              <View style={[styles.trustIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Percent size={24} color="#10B981" />
              </View>
              <Text style={styles.trustTitle}>Best Price</Text>
              <Text style={styles.trustSub}>Get best deals</Text>
            </View>

            <View style={styles.trustCard}>
              <View style={[styles.trustIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Truck size={24} color="#F59E0B" />
              </View>
              <Text style={styles.trustTitle}>Fast Delivery</Text>
              <Text style={styles.trustSub}>Pan India delivery</Text>
            </View>

            <View style={styles.trustCard}>
              <View style={[styles.trustIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <Headphones size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.trustTitle}>Expert Support</Text>
              <Text style={styles.trustSub}>24x7 assistance</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  gridImage: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    textAlign: 'center',
    minHeight: 28,
  },
  gridCount: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  marqueeContainer: {
    overflow: 'hidden',
    width: '100%',
    paddingVertical: 4,
  },
  brandCard: {
    width: 110,
    height: 60,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandPlaceholder: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primaryDeep,
    opacity: 0.8,
  },
  trustBannerContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: COLORS.borderDark,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  trustCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  trustIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    textAlign: 'center',
    marginBottom: 4,
  },
  trustSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
