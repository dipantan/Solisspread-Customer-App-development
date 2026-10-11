import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

interface CelestialBodyProps {
  type: 'sun' | 'moon';
  size?: number;
  top?: number;
  right?: number;
  left?: number;
}

export const CelestialBody = ({ type, size = 80, top = 40, right, left }: CelestialBodyProps) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Gentle floating animation
    translateY.value = withRepeat(
      withTiming(10, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    position: 'absolute',
    top,
    ...(right !== undefined ? { right } : {}),
    ...(left !== undefined ? { left } : {}),
    width: size,
    height: size,
  }));

  const isSun = type === 'sun';

  return (
    <Animated.View style={animatedStyle}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={isSun ? '#FFE082' : '#FFFFFF'} stopOpacity="0.8" />
            <Stop offset="50%" stopColor={isSun ? '#FFCA28' : '#E2E8F0'} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={isSun ? '#FFB300' : '#CBD5E1'} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#glow)" />
        <Circle cx="50" cy="50" r={isSun ? "30" : "25"} fill={isSun ? "#FFC107" : "#F8FAFC"} />
        {!isSun && (
          // Moon crater details
          <>
            <Circle cx="40" cy="40" r="4" fill="#E2E8F0" opacity="0.5" />
            <Circle cx="60" cy="55" r="6" fill="#E2E8F0" opacity="0.4" />
            <Circle cx="45" cy="65" r="3" fill="#E2E8F0" opacity="0.6" />
          </>
        )}
      </Svg>
    </Animated.View>
  );
};
