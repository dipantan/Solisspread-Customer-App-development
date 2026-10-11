import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
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

interface MovingCloudProps {
  startX?: number;
  startY?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
}

export const MovingCloud = ({
  startX = -200,
  startY = 0,
  scale = 1,
  duration = 30000,
  delay = 0,
  opacity = 0.8,
}: MovingCloudProps) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(width + 200, {
          duration,
          easing: Easing.linear,
        }),
        -1, // infinite
        false // do not reverse, reset to start
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(startY, { // Keep Y constant or change slightly if needed
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
    opacity,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <LottieView
        source={require('../../../assets/animations/cloud.json')}
        style={{ width: 200, height: 100 }}
        autoPlay
        loop
        resizeMode="contain"
      />
    </Animated.View>
  );
};
