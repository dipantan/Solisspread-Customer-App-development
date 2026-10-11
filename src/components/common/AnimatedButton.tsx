import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, AnimatedProps } from 'react-native-reanimated';
import { TIMING } from '../../constants/motion';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface AnimatedButtonProps extends AnimatedProps<TouchableOpacityProps> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  style, 
  onPress, 
  onPressIn, 
  onPressOut, 
  entering,
  exiting,
  layout,
  ...props 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: any) => {
    scale.value = withTiming(0.97, { duration: TIMING.micro, easing: Easing.out(Easing.ease) });
    if (onPressIn && typeof onPressIn === 'function') (onPressIn as any)(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withTiming(1, { duration: TIMING.micro, easing: Easing.out(Easing.ease) });
    if (onPressOut && typeof onPressOut === 'function') (onPressOut as any)(e);
  };

  const buttonContent = (
    <AnimatedTouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[style, animatedStyle]}
      activeOpacity={props.activeOpacity ?? 0.7}
      {...props}
    >
      {children}
    </AnimatedTouchableOpacity>
  );

  if (entering || exiting || layout) {
    return (
      <Animated.View entering={entering} exiting={exiting} layout={layout}>
        {buttonContent}
      </Animated.View>
    );
  }

  return buttonContent;
};
