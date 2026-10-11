import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

const StarLayer = ({ stars, duration, delay }: { stars: any[], duration: number, delay: number }) => {
  const opacity = useSharedValue(0); // Start at 0 so blink is very noticeable

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.6, { // Max opacity 0.6 as requested
          duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // infinite
        true // reverse
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
      <Svg width="100%" height="100%">
        {stars.map((star, i) => (
          <Path 
            key={i} 
            d="M 0 -10 Q 2 -2 10 0 Q 2 2 0 10 Q -2 2 -10 0 Q -2 -2 0 -10 Z" 
            fill="#FFFFFF" 
            // r / 6 makes the paths much smaller as requested
            transform={`translate(${star.cx}, ${star.cy}) scale(${star.r / 6})`} 
          />
        ))}
      </Svg>
    </Animated.View>
  );
};

export const TwinklingStars = () => {
  // To completely eliminate scroll lag, we only animate 3 layers instead of 25 individual stars.
  // This uses 90% less animation resources.
  const layers = useMemo(() => {
    const generateStars = (count: number) => {
      return Array.from({ length: count }).map(() => ({
        cx: Math.random() * width,
        // Kept the offset so they appear a bit lower
        cy: (Math.random() * (HEADER_HEIGHT - 30)) + 30,
        r: Math.random() * 1.0 + 0.5, // Smaller stars
      }));
    };
    
    return [
      { stars: generateStars(8), duration: 1200, delay: 0 },
      { stars: generateStars(8), duration: 1800, delay: 600 },
      { stars: generateStars(8), duration: 2500, delay: 1200 },
    ];
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {layers.map((layer, index) => (
        <StarLayer key={index} stars={layer.stars} duration={layer.duration} delay={layer.delay} />
      ))}
    </View>
  );
};
