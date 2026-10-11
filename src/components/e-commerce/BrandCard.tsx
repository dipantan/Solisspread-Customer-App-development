import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { AnimatedButton } from '../common/AnimatedButton';
import { COLORS } from '../../constants/theme';
import { MOTION } from '../../constants/motion';
import { brandLogoUri } from '../../api/catalog';
import type { Brand } from '../../api/types';

const MONOGRAM_COLORS = [
  { bg: '#E0F2FE', fg: '#0369A1' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#EDE9FE', fg: '#6D28D9' },
  { bg: '#FFE4E6', fg: '#BE123C' },
];

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function monogramColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}

interface BrandCardProps {
  brand: Pick<Brand, 'name' | 'logoUrl'>;
  onPress?: () => void;
  index?: number;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onPress, index = 0 }) => {
  const uri = brandLogoUri(brand);
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(uri) && !failed;
  const color = monogramColor(brand.name);

  return (
    <Animated.View entering={MOTION.listStaggerFade(index)}>
      <AnimatedButton onPress={onPress} style={styles.card}>
        <View style={styles.logoBox}>
          {showLogo ? (
            <Image
              source={{ uri }}
              style={styles.logo}
              resizeMode="contain"
              onError={() => setFailed(true)}
              accessibilityLabel={`${brand.name} logo`}
            />
          ) : (
            <View style={[styles.monogram, { backgroundColor: color.bg }]}>
              <Text style={[styles.monogramText, { color: color.fg }]}>{initials(brand.name)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>{brand.name}</Text>
      </AnimatedButton>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 96,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    marginRight: 12,
    marginBottom: 10,
  },
  logoBox: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logo: {
    width: '100%',
    height: 48,
  },
  monogram: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    textAlign: 'center',
  },
});
