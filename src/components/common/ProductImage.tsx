import React, { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '../../constants/theme';

const DEFAULT_FALLBACK = require('../../../assets/solar_panel_product.png');

interface ProductImageProps {
  source?: ImageSourcePropType | null;
  fallback?: ImageSourcePropType;
  /** Inset for bundled placeholder art, which has its own whitespace. */
  placeholderScale?: number;
  style?: StyleProp<ViewStyle>;
}

const isRemote = (source?: ImageSourcePropType | null): source is { uri: string } =>
  Boolean(source && typeof source === 'object' && !Array.isArray(source) && (source as { uri?: string }).uri);

/**
 * Fills its parent completely. Remote product photos are cropped to cover the
 * box so there is no letterboxing; bundled placeholders stay fully visible.
 * The parent must have a fixed size and `overflow: 'hidden'` for rounded corners.
 */
export function ProductImage({ source, fallback = DEFAULT_FALLBACK, placeholderScale = 0.8, style }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const remoteUri = isRemote(source) ? source.uri : undefined;

  useEffect(() => {
    setFailed(false);
  }, [remoteUri]);

  const showRemote = Boolean(remoteUri) && !failed;
  const localSource = !showRemote ? (source && !isRemote(source) ? source : fallback) : undefined;
  const inset = `${Math.round(placeholderScale * 100)}%` as const;

  return (
    <View style={[styles.fill, style]}>
      {showRemote ? (
        <Image
          source={{ uri: remoteUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Image source={localSource!} style={{ width: inset, height: inset }} resizeMode="contain" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
});
