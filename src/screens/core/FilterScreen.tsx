import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, COMMON_STYLES } from '../../constants/theme';
import { AnimatedButton } from '../../components/common/AnimatedButton';

export default function FilterScreen({ onBack, onApply }: { onBack: () => void; onApply: () => void }) {
  const insets = useSafeAreaInsets();
  
  const [activeCategory, setActiveCategory] = useState('Solar Panels');
  const [activeBrands, setActiveBrands] = useState<string[]>(['Waaree (120)']);
  const [activeSort, setActiveSort] = useState('Popular');

  const categories = ['Solar Panels', 'Inverters', 'Batteries', 'Accessories', 'Solar Packages'];
  const brands = [
    'Waaree (120)',
    'Luminous (80)',
    'Vikram (45)',
    'Tata (40)',
    'Adani (30)',
  ];
  const sortOptions = [
    'Popular',
    'Price: Low to High',
    'Price: High to Low',
    'Newest First',
  ];

  const handleReset = () => {
    setActiveCategory('Solar Panels');
    setActiveBrands(['Waaree (120)']);
    setActiveSort('Popular');
  };

  const toggleBrand = (brand: string) => {
    if (activeBrands.includes(brand)) {
      setActiveBrands(activeBrands.filter((b) => b !== brand));
    } else {
      setActiveBrands([...activeBrands, brand]);
    }
  };

  return (
    <View style={[COMMON_STYLES.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={COMMON_STYLES.header}>
        <TouchableOpacity onPress={onBack} style={COMMON_STYLES.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft color={COLORS.primaryDeep} size={24} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[COMMON_STYLES.scrollContent, { paddingHorizontal: 20 }]}>
        
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.tagsContainer}>
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.tagBtn, isActive && styles.tagBtnActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.tagText, isActive && styles.tagTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Brands */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brands</Text>
          {brands.map((brand, idx) => {
            const isActive = activeBrands.includes(brand);
            return (
              <TouchableOpacity key={idx} style={styles.brandRow} onPress={() => toggleBrand(brand)}>
                <View style={styles.brandRowLeft}>
                  <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                    {isActive && <Check size={14} color={COLORS.surface} />}
                  </View>
                  <Text style={styles.brandText}>{brand}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.viewMoreBtn}>
            <Text style={styles.viewMoreText}>View More</Text>
            <ChevronRight size={14} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Range</Text>
          <View style={styles.sliderContainer}>
            {/* Visual Custom Slider */}
            <View style={styles.sliderTrack}>
              <View style={styles.sliderFill} />
            </View>
            <View style={[styles.sliderThumb, { left: '15%' }]} />
            <View style={[styles.sliderThumb, { right: '15%' }]} />
          </View>
          <View style={styles.priceLabels}>
            <Text style={styles.priceLabel}>₹5,000</Text>
            <Text style={styles.priceLabel}>₹50,000+</Text>
          </View>
        </View>

        {/* Sort By */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          {sortOptions.map((opt, idx) => {
            const isActive = activeSort === opt;
            return (
              <TouchableOpacity key={idx} style={styles.sortRow} onPress={() => setActiveSort(opt)}>
                <View style={styles.sortRowLeft}>
                  <View style={[styles.radio, isActive && styles.radioActive]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.sortText}>{opt}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* Footer Buttons */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AnimatedButton style={styles.footerCancelBtn} onPress={onBack}>
          <Text style={styles.footerCancelText}>Cancel</Text>
        </AnimatedButton>
        <AnimatedButton style={styles.footerApplyBtn} onPress={onApply}>
          <Text style={styles.footerApplyText}>Apply Filter</Text>
        </AnimatedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  tagBtnActive: {
    backgroundColor: COLORS.primaryDeep,
    borderColor: COLORS.primaryDeep,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  tagTextActive: {
    color: COLORS.surface,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  brandRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryDeep,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 10,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: COLORS.borderDark,
    borderRadius: 2,
    width: '100%',
  },
  sliderFill: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    top: 10,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  sortRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryDeep,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
  },
  footerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  footerCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  footerApplyBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryDeep,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerApplyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
