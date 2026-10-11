import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, Animated, Dimensions } from 'react-native';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import * as tokenStorage from '../../api/tokenStorage';
import * as usersApi from '../../api/users';
import { COLORS, GRADIENTS } from '../../constants/theme';

export default function SplashScreen({
  onFinish,
  onAuthenticated,
}: {
  onFinish: () => void;
  onAuthenticated?: () => void;
}) {

  const [isLoaded, setIsLoaded] = useState(false);
  const loadingProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      Animated.timing(loadingProgress, {
        toValue: 100,
        duration: 1800,
        useNativeDriver: false,
      }).start();

      try {
        const hasTokens = await tokenStorage.hasAuthTokens();
        if (hasTokens) {
          try {
            await usersApi.getMe();
            if (!cancelled && onAuthenticated) {
              onAuthenticated();
              return;
            }
          } catch {
            await tokenStorage.clearAuthTokens();
          }
        }
      } catch {
        // ignore bootstrap errors — fall through to Get Started
      }

      if (!cancelled) setIsLoaded(true);
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LinearGradient
      colors={GRADIENTS.splash}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <View style={styles.content}>
          {/* Top Header & Brand Logo */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo-light.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>
              Switch to Solar. Save More.
            </Text>
            <Text style={styles.tagline2}>
              Live Better.
            </Text>
          </View>

          {/* Middle House Illustration PNG */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../../assets/splash_house_solar.png')}
              style={styles.houseImage}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Action Area with Get Started Button or Progress Bar */}
          <View style={styles.footerSection}>
            {!isLoaded ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: loadingProgress.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>Loading your experience...</Text>
              </View>
            ) : (
              <PrimaryButton
                title="Get Started"
                onPress={onFinish}
                style={styles.getStartedButton}
              />
            )}
            <Text style={styles.versionText}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
            <Text style={styles.poweredByText}>Powered by Solisspread Assist Pvt. Ltd.</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 250,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
    marginBottom: 25,
  },
  tagline: {
    fontSize: 20,
    color: COLORS.border,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: 0.3,
  },
  tagline2: {
    fontSize: 24,
    color: COLORS.accent,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  illustrationContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.8, // approximate aspect ratio to show image properly
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  houseImage: {
    width: '100%',
    height: '100%',
  },
  footerSection: {
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  getStartedButton: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.surface + '70',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  poweredByText: {
    fontSize: 12,
    color: COLORS.surface + '90',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56, // matches button height
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  progressText: {
    color: COLORS.surface,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
});

