import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useDayTime, TimeMode } from '../../hooks/useDayTime';
import { TwinklingStars } from './TwinklingStars';
import { MovingCloud } from './MovingCloud';
import { FlyingBirds } from './FlyingBirds';
import { CelestialBody } from './CelestialBody';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface DynamicSkyHeaderProps {
  children?: React.ReactNode;
  userName?: string;
}

const SKY_CONFIG = {
  morning: {
    colors: ['#00fff0', '#00c0f7', '#0083fe'] as [string, string, string],
    greeting: 'Good Morning ☀️',
  },
  noon: {
    colors: ['#F2994A', '#F2b14b', '#F2C94C'] as [string, string, string],
    greeting: 'Good Noon ☀️',
  },
  afternoon: {
    colors: ['#C6FFDD', '#FBD786', '#f7797d'] as [string, string, string],
    greeting: 'Good Afternoon 🌤️',
  },
  evening: {
    colors: ['#59CDE9', '#327bb8', '#0A2A88'] as [string, string, string],
    greeting: 'Good Evening 🌇',
  },
  night: {
    colors: ['#2980b9', '#2b5f84', '#2c3e50'] as [string, string, string],
    greeting: 'Good Night 🌙',
  },
};

export const DynamicSkyHeader = ({ children, userName = 'Customer' }: DynamicSkyHeaderProps) => {
  const timeMode = useDayTime();

  // We use shared values for the gradient colors to animate transitions
  const progress = useSharedValue(0);
  const currentMode = useSharedValue<TimeMode>(timeMode);
  const previousMode = useSharedValue<TimeMode>(timeMode);

  useEffect(() => {
    if (currentMode.value !== timeMode) {
      previousMode.value = currentMode.value;
      currentMode.value = timeMode;
      progress.value = 0;
      progress.value = withTiming(1, { duration: 800 });
    }
  }, [timeMode]);

  const animatedGradientStyle = useAnimatedStyle(() => {
    const prevColors = SKY_CONFIG[previousMode.value].colors;
    const nextColors = SKY_CONFIG[currentMode.value].colors;

    return {
      backgroundColor: interpolateColor(progress.value, [0, 1], [prevColors[1], nextColors[1]]),
    };
  });

  const renderSkyElements = () => {
    switch (timeMode) {
      case 'morning':
        return (
          <>
            <CelestialBody type="sun" right={100} top={30} size={80} />
            <MovingCloud startY={40} scale={0.8} duration={35000} />
            <MovingCloud startY={120} scale={1.2} duration={40000} delay={5000} />
            <MovingCloud startY={70} scale={0.6} duration={25000} delay={15000} />
            <FlyingBirds />
          </>
        );
      case 'noon':
        return (
          <>
            <CelestialBody type="sun" right={150} top={20} size={140} />
            <MovingCloud startY={20} scale={1.1} duration={28000} />
            <MovingCloud startY={90} scale={1.6} duration={32000} delay={6000} />
            <MovingCloud startY={160} scale={0.8} duration={22000} delay={14000} />
          </>
        );
      case 'afternoon':
        return (
          <>
            <CelestialBody type="sun" right={50} top={60} size={120} />
            <MovingCloud startY={30} scale={1} duration={30000} />
            <MovingCloud startY={100} scale={1.5} duration={35000} delay={8000} />
            <MovingCloud startY={150} scale={0.7} duration={20000} delay={18000} />
          </>
        );
      case 'evening':
        return (
          <>
            <CelestialBody type="sun" left={40} top={120} size={110} />
            <MovingCloud startY={50} scale={0.9} duration={32000} opacity={0.6} />
            <MovingCloud startY={130} scale={1.3} duration={38000} delay={7000} opacity={0.5} />
            <FlyingBirds />
          </>
        );
      case 'night':
        return (
          <>
            <TwinklingStars />
            <CelestialBody type="moon" right={110} top={70} size={90} />
            <MovingCloud startY={60} scale={1.1} duration={45000} opacity={0.3} />
            <MovingCloud startY={140} scale={0.8} duration={40000} delay={12000} opacity={0.2} />
          </>
        );
    }
  };

  return (
    <Animated.View style={[styles.container, animatedGradientStyle]}>
      {/* Absolute positioning for the SVG gradient background to crossfade smoothly */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* We use standard LinearGradient since react-native-reanimated struggles to interpolate array of colors inside expo-linear-gradient smoothly. The animated container background handles the mid-tone crossfade while the gradient adds depth. */}
        <LinearGradient
          colors={SKY_CONFIG[timeMode].colors}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {renderSkyElements()}
      </View>

      {/* Soft overlay to ensure readability */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />

      <View style={styles.content}>
        {/* User Greeting */}
        <View style={styles.greetingContainer}>
          <View>
            <Text style={styles.greetingTitle}>Hi, {userName} 👋</Text>
            <Text style={styles.greetingSub}>Welcome to SolAssist</Text>
          </View>
          <View style={styles.greetingTimeBg}>
            <Text style={styles.greetingTime}>{SKY_CONFIG[timeMode].greeting}</Text>
          </View>
        </View>

        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 80, // Padding to avoid overlap with absolute sticky header
    paddingBottom: 20,
    marginBottom: -20, // Negative margin to blend with bodyContent border radius
    overflow: 'hidden',
  },
  content: {
    zIndex: 10,
  },
  greetingContainer: {
    marginTop: 5,
    marginBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTimeBg: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  greetingTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  greetingSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});
