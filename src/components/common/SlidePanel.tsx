import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlidePanelProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  direction?: 'left' | 'right';
  hideHeader?: boolean;
}

const SlidePanel: React.FC<SlidePanelProps> = ({
  visible, onClose, title, children, direction = 'right', hideHeader = false
}) => {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH);
  const [internalVisible, setInternalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      translateX.value = withTiming(direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH, { duration: 300, easing: Easing.in(Easing.ease) }, (isFinished) => {
        if (isFinished) {
          runOnJS(setInternalVisible)(false);
        }
      });
    }
  }, [visible, translateX, direction]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  if (!internalVisible) return null;

  return (
    <Modal transparent visible={internalVisible} animationType="none" statusBarTranslucent={true}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.panelContainer, direction === 'left' && styles.leftPanelContainer, animatedStyle]}>
          {/* Solid Header with Back Button */}
          {!hideHeader && (
            <View
              style={[styles.panelHeader, { paddingTop: insets.top + 10 }]}
            >
              <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
                <ArrowLeft size={20} color={COLORS.surface} />
              </TouchableOpacity>
              <Text style={styles.panelTitle}>{title}</Text>
            </View>
          )}
          <View style={[styles.panelContent, (direction === 'left' || hideHeader) && { padding: 0 }]}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panelContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 0,
    ...SHADOWS.card,
  },
  leftPanelContainer: {
    width: '100%',
    right: 'auto',
    left: 0,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.primaryDeep,
    ...SHADOWS.soft,
  },
  backBtn: {
    marginRight: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
  panelContent: {
    flex: 1,
    padding: 20,
  },

});

export default SlidePanel;
