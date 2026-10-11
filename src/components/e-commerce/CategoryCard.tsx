import React from 'react';
import { View, Text, StyleSheet} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../common/AnimatedButton';
import Animated from 'react-native-reanimated';
import { COLORS, RADIUS } from '../../constants/theme';
import { AnimatedButton } from '../common/AnimatedButton';
import { MOTION } from '../../constants/motion';

interface CategoryCardProps {
  title: string;
  icon: React.ReactNode;
  onPress?: () => void;
  index?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ title, icon, onPress, index = 0 }) => {
  return (
    <Animated.View entering={MOTION.listStaggerFade(index)}>
      <AnimatedButton
        onPress={onPress}
        style={styles.cardContainer}
      >
        <View style={styles.iconWrapper}>{icon}</View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </AnimatedButton>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 86,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  iconWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    textAlign: 'center',
  },
});
