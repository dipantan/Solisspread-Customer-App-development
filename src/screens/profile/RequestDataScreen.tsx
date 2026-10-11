import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Download } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';

interface RequestDataScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function RequestDataScreen({ onBack }: RequestDataScreenProps) {
  const insets = useSafeAreaInsets();
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      <View style={[COMMON_STYLES.header, { backgroundColor: COLORS.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={COMMON_STYLES.backBtn} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={COMMON_STYLES.headerTitle}>Request My Data</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <View style={styles.iconBox}>
            <Download size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Download Your Data</Text>
          <Text style={styles.desc}>
            You can request a copy of your personal data, including your AMC records, service history, and profile information.
            Once requested, it may take up to 48 hours for the download link to be emailed to your registered address.
          </Text>

          <TouchableOpacity
            style={[styles.btn, requested && styles.btnDisabled]}
            disabled={requested}
            onPress={() => setRequested(true)}
          >
            <Text style={styles.btnText}>{requested ? 'Request Sent' : 'Request Data'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  desc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: {
    backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: RADIUS.button, width: '100%', alignItems: 'center',
  },
  btnDisabled: { backgroundColor: COLORS.textTertiary },
  btnText: { color: COLORS.surface, fontSize: 16, fontWeight: '600' },
});
