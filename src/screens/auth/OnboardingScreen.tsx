import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { COLORS, RADIUS } from '../../constants/theme';

interface OnboardingScreenProps {
  onNext: () => void;
  onSkip: () => void;
  onRequestExit?: () => void;
}

const slides = [
  {
    title: 'Save More with Solar\nLive Better, Greener',
    subtitle: 'Reduce electricity bills and contribute to a sustainable future.',
    image: require('../../../assets/onboarding_solar_house.png'),
  },
  {
    title: 'Smart Calculator\nInstant Estimate',
    subtitle: 'Enter your electricity bill and get a personalized solar solution in seconds.',
    image: require('../../../assets/onboarding_calculator.png'),
  },
  {
    title: 'Expert Installation\nReliable Support',
    subtitle: 'Professional installation and dedicated support at every step of your journey.',
    image: require('../../../assets/onboarding_installation.png'),
  },
];

export default function OnboardingScreen({ onNext, onSkip, onRequestExit }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const backAction = () => {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        return true;
      }
      if (onRequestExit) {
        onRequestExit();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentIndex, onRequestExit]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onNext();
    }
  };

  const slide = slides[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Top Image Section (0 padding/margin, Edge-to-Edge) */}
        <View style={styles.imageContainer}>
          <Image source={slide.image} style={styles.image} resizeMode="cover" />
        </View>

        {/* Bottom Details Container */}
        <View style={styles.bottomSection}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>

          <View style={styles.pagination}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              onPress={handleNext}
            />
            {currentIndex < slides.length - 1 && (
              <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    height: 340,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.accent,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: COLORS.border,
  },
  footer: {
    width: '100%',
    marginBottom: 20,
  },
  skipBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
