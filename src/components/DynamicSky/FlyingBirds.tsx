import React, { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  withDelay,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface FlyingBirdProps {
  startX?: number;
  startY?: number;
  duration?: number;
  delay?: number;
  scale?: number;
}

const Bird = ({ startX = -50, startY = 100, duration = 15000, delay = 0, scale = 1 }: FlyingBirdProps) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);

  useEffect(() => {
    // Move across the screen diagonally
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(width + 100, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(startY - 100, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale },
    ],
    position: 'absolute',
  }));

  return (
    <Animated.View style={animatedStyle}>
      <LottieView
        source={require('../../../assets/animations/birds.json')}
        style={{ width: 120, height: 120, transform: [{ scale: 1.5 }] }}
        autoPlay
        loop
        resizeMode="contain"
      />
    </Animated.View>
  );
};

export const FlyingBirds = () => {
  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }} pointerEvents="none">
      <Bird startX={-50} startY={80} duration={18000} scale={0.8} />
      <Bird startX={-70} startY={95} duration={18000} delay={500} scale={0.6} />
      <Bird startX={-90} startY={70} duration={18000} delay={1000} scale={0.7} />
      
      {/* Another flock later */}
      <Bird startX={-50} startY={120} duration={20000} delay={8000} scale={0.5} />
      <Bird startX={-65} startY={130} duration={20000} delay={8300} scale={0.4} />
    </View>
  );
};
