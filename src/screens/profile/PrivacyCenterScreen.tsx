import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES } from '../../constants/theme';

interface PrivacyCenterScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function PrivacyCenterScreen({ onBack, onNavigate }: PrivacyCenterScreenProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  const renderHeader = () => (
    <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={COLORS.primaryDeep} />
        </TouchableOpacity>
        <Text style={COMMON_STYLES.headerTitle}>Privacy Center</Text>
      </View>
    </View>
  );

  const MENU_ITEMS = [
    { title: 'Privacy Policy', step: 'privacy', color: COLORS.textPrimary },
    { title: 'Request My Data', step: 'request_data', color: COLORS.textPrimary },
    { title: 'Consent Management', step: 'consent_management', color: COLORS.textPrimary },
    { title: 'Grievance Redressal', step: 'grievance_redressal', color: COLORS.textPrimary },
    { title: 'De-activate my Account', step: 'deactivate_account', color: COLORS.googleRed },
    { title: 'Delete my Account', step: 'delete_account', color: COLORS.googleRed },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={['top', 'bottom']}>
      {renderHeader()}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => onNavigate?.(item.step)}
            >
              <Text style={[styles.menuText, { color: item.color }]}>{item.title}</Text>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '400',
  },
});
