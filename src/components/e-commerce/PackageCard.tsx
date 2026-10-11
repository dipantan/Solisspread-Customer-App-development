import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductImage } from '../common/ProductImage';
import { AnimatedButton as TouchableOpacity } from '../common/AnimatedButton';
import { ShoppingCart, Zap, Heart } from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { COLORS, SHADOWS } from '../../constants/theme';
import { AnimatedButton } from '../common/AnimatedButton';
import { MOTION } from '../../constants/motion';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface PackageCardProps {
  name: string;
  price: string;
  discount: string;
  image: any;
  tag?: string;
  tagColor?: string;
  desc?: string;
  output?: string;
  oldPrice?: string;
  onPress?: () => void;
  onCartPress?: () => void;
  index?: number;
  mode?: 'grid' | 'scroll';
}

export const PackageCard: React.FC<PackageCardProps> = ({ 
  name, price, discount, image, tag, tagColor, desc, output, oldPrice, onPress, onCartPress, index = 0, mode = 'scroll' 
}) => {
  const isGrid = mode === 'grid';
  
  return (
    <Animated.View 
      style={[styles.packageCard, isGrid ? styles.gridCard : styles.scrollCard]} 
      entering={MOTION.listStaggerFade(index)}
    >
      <View style={[styles.pkgImageWrapper, isGrid && { height: 110 }]}>
        <ProductImage source={image} />
        {tag && (
          <View style={[styles.pkgTag, tagColor && { backgroundColor: tagColor }]}>
            <Text style={styles.pkgTagText}>{tag}</Text>
          </View>
        )}
      </View>
      <View style={[styles.pkgInfo, isGrid && { padding: 10 }]}>
        <Text style={[styles.pkgName, isGrid && { fontSize: 12, lineHeight: 16 }]} numberOfLines={2}>{name}</Text>
        
        {desc && <Text style={[styles.pkgDesc, isGrid && { fontSize: 9 }]} numberOfLines={1}>{desc}</Text>}
        
        {output && (
          <View style={styles.outputRow}>
            <Zap size={12} color="#EAB308" />
            <Text style={styles.outputText}>{output}</Text>
          </View>
        )}

        <View style={styles.priceContainer}>
          <View style={styles.oldPriceRow}>
            {oldPrice && <Text style={styles.oldPrice}>{oldPrice}</Text>}
            <Text style={[styles.discountText, isGrid && { fontSize: 9 }]}>{discount}</Text>
          </View>
          <Text style={[styles.pkgPrice, isGrid && { fontSize: 16 }]}>{price}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.detailsBtn} onPress={onPress}>
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartBtn} onPress={onCartPress}>
            <ShoppingCart size={14} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  packageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
    overflow: 'hidden',
  },
  scrollCard: {
    width: 240,
    marginRight: 16,
  },
  gridCard: {
    width: (width - 40 - 12) / 2, // 2 columns
    marginBottom: 4,
  },
  pkgImageWrapper: {
    height: 120,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pkgTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 2,
  },
  pkgTagText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  pkgInfo: {
    padding: 16,
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  pkgDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  outputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  outputText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#CA8A04',
    marginLeft: 4,
  },
  priceContainer: {
    marginTop: 4,
  },
  oldPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oldPrice: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  pkgPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  detailsBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primaryDeep,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  cartBtn: {
    backgroundColor: COLORS.primaryDeep,
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
