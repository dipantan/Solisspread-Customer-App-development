import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

interface SearchBarWithFilterProps {
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
}

export const SearchBarWithFilter: React.FC<SearchBarWithFilterProps> = ({
  onSearchPress,
  onFilterPress,
  placeholder = 'Search category or products...'
}) => {
  return (
    <View style={styles.searchRow}>
      <TouchableOpacity 
        style={styles.searchContainer} 
        activeOpacity={0.8}
        onPress={onSearchPress}
      >
        <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>{placeholder}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.filterBtn}
        onPress={onFilterPress}
      >
        <SlidersHorizontal size={20} color={COLORS.primaryDeep} />
        <Text style={styles.filterText}>Filter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    height: 44,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginLeft: 6,
  },
});
