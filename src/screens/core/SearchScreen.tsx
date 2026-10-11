import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Clock, ArrowUpRight } from 'lucide-react-native';
import { COLORS, COMMON_STYLES } from '../../constants/theme';

export default function SearchScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const popularSearches = [
    '550Wp Solar Panel',
    'Luminous Inverter',
    'Solar Battery',
    'UTL Inverter',
    'Solar Package',
    'ACDB Box',
  ];

  const recentSearches = [
    'inverter',
    '550Wp solar panel',
    'luminous battery',
    'solar package 3kw',
    'acdb box',
  ];

  return (
    <View style={[COMMON_STYLES.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={COMMON_STYLES.header}>
        <TouchableOpacity onPress={onBack} style={COMMON_STYLES.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft color={COLORS.primaryDeep} size={24} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Search</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products, brands and more..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[COMMON_STYLES.scrollContent, { paddingHorizontal: 20 }]}>
        {/* Popular Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Search</Text>
          <View style={styles.popularTags}>
            {popularSearches.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tagBtn} onPress={() => setSearchQuery(tag)}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Search</Text>
          {recentSearches.map((item, index) => (
            <TouchableOpacity key={index} style={styles.recentItem} onPress={() => setSearchQuery(item)}>
              <View style={styles.recentLeft}>
                <Clock size={16} color={COLORS.textTertiary} style={styles.recentIcon} />
                <Text style={styles.recentText}>{item}</Text>
              </View>
              <ArrowUpRight size={18} color={COLORS.primaryDeep} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primaryDeep,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
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
  popularTags: {
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
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIcon: {
    marginRight: 12,
  },
  recentText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primaryDeep,
  },
});
