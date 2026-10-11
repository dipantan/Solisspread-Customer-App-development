import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ProductImage } from '../common/ProductImage';
import { Heart, Star, ShoppingCart } from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { AnimatedButton } from '../common/AnimatedButton';
import { MOTION } from '../../constants/motion';

const { width } = Dimensions.get('window');

interface ProductCardProps {
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  savings?: string; // Keep this just in case they want it later or it doesn't break ProductsScreen
  image: any;
  isBestSeller?: boolean;
  rating?: string;
  reviews?: string;
  onPress?: () => void;
  onCartPress?: () => void;
  index?: number;
  mode?: 'grid' | 'scroll';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  originalPrice,
  discount,
  savings,
  image,
  isBestSeller = false,
  rating = '4.5',
  reviews = '50',
  onPress,
  onCartPress,
  index = 0,
  mode = 'scroll'
}) => {
  const isGrid = mode === 'grid';
  return (
    <AnimatedButton 
      style={[styles.productCard, isGrid ? styles.gridCard : styles.scrollCard]} 
      onPress={onPress}
      entering={MOTION.listStaggerFade(index)}
    >
      {isBestSeller && (
        <View style={styles.bestSellerBadge}>
          <Text style={styles.bestSellerText}>BEST SELLER</Text>
        </View>
      )}

      <View style={styles.productImageWrapper}>
        <ProductImage source={image} />
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{name}</Text>
        <View style={styles.ratingRow}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{rating} <Text style={styles.reviewCount}>({reviews})</Text></Text>
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>{price}</Text>
            {originalPrice && discount && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.originalPrice}>{originalPrice}</Text>
                <Text style={styles.discount}>{discount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.addToCartBtn} onPress={onCartPress}>
            <ShoppingCart size={16} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedButton>
  );
};

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.card,
    overflow: 'hidden', // To ensure image stays inside rounded corners
    paddingBottom: 12,
  },
  scrollCard: {
    width: 160,
    marginRight: 16,
    marginBottom: 12,
  },
  gridCard: {
    width: (width - 40 - 12) / 2, // 2 columns
    marginBottom: 12,
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
    zIndex: 2,
  },
  bestSellerText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  productImageWrapper: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    marginBottom: 12,
  },
  productInfo: {
    gap: 4,
    paddingHorizontal: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  reviewCount: {
    color: COLORS.textTertiary,
    fontWeight: '400',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  discount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  addToCartBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primaryDeep,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
