import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { COLORS, RADIUS } from '../../constants/theme';

const AnimatedSuccessSvg = () => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.06,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [scaleValue, pulseValue]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: Animated.multiply(scaleValue, pulseValue) }],
      }}
    >
      <Svg width={110} height={110} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="46" fill={COLORS.successAlt} opacity={0.15} />
        <Circle cx="50" cy="50" r="38" fill={COLORS.successAlt} />
        <Path
          d="M32 50 L44 62 L68 38"
          fill="none"
          stroke={COLORS.surface}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
};

export default function ProfileSuccessScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated SVG Success Checkmark Icon */}
        <View style={styles.iconContainer}>
          <AnimatedSuccessSvg />
        </View>

        {/* Header Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Profile Completed!</Text>
          <Text style={styles.subtitle}>
            Your profile has been set up successfully. You are now ready to explore{' '}
            <Text style={styles.boldAppName}>Solisspread Assist</Text>.
          </Text>
        </View>

        {/* Go to Home Button */}
        <PrimaryButton title="Go to Home" onPress={onGoHome} style={styles.btn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 28,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryNavy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  boldAppName: {
    fontWeight: '800',
    color: COLORS.primaryNavy,
  },
  btn: {
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: RADIUS.button,
    width: '100%',
  },
});
