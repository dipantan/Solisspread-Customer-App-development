import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeOut, useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface StatusModalProps {
  visible: boolean;
  type: 'success' | 'error';
  title?: string;
  message: string;
  duration?: number;
  onComplete?: () => void;
}

export default function StatusModal({ visible, type, title, message, duration = 2500, onComplete }: StatusModalProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      progress.value = withTiming(1, { duration, easing: Easing.linear }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    }
  }, [visible, duration]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: progress.value * (width - 48), // Calculate exact width in pixels to bypass flex/padding issues
    };
  });

  if (!visible) return null;

  const isSuccess = type === 'success';
  const iconColor = isSuccess ? COLORS.success : COLORS.error;
  const bgColor = isSuccess ? COLORS.successLight : COLORS.errorLight;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeInDown.duration(400).springify()} 
          exiting={FadeOut.duration(200)}
          style={styles.modalContainer}
        >
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            {isSuccess ? (
              <CheckCircle2 size={40} color={iconColor} />
            ) : (
              <XCircle size={40} color={iconColor} />
            )}
          </View>
          
          <Text style={styles.title}>{title || (isSuccess ? 'Success!' : 'Error')}</Text>
          <Text style={styles.message}>{message}</Text>
          <Animated.View style={[styles.progressBar, { backgroundColor: iconColor }, progressStyle]} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 24,
    width: width - 48,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 6, // Slightly thicker for a more visible border-like look
  },
});
