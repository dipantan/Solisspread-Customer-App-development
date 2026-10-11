import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Headphones, Mail, Phone, MapPin, MessageCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { COLORS, COMMON_STYLES, RADIUS, SHADOWS } from '../../constants/theme';
import { getContactInfo } from '../../api/settings';

interface GrievanceRedressalScreenProps {
  onBack: () => void;
  onNavigate?: (step: any, params?: any) => void;
}

export default function GrievanceRedressalScreen({ onBack }: GrievanceRedressalScreenProps) {
  const insets = useSafeAreaInsets();
  const [contact, setContact] = useState<{ phone?: string | null; whatsappNumber?: string | null; supportEmail?: string | null }>({});

  useEffect(() => {
    getContactInfo().then(setContact).catch(() => {});
  }, []);

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
          <Text style={COMMON_STYLES.headerTitle}>Grievance Redressal</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <View style={styles.iconBox}>
            <Headphones size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Grievance Officer</Text>
          <Text style={styles.desc}>
            If you have any concerns or complaints regarding your privacy or data, please contact our Grievance Officer using the details below.
          </Text>

          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Mail size={20} color={COLORS.primaryDeep} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Email Address</Text>
              <Text style={styles.contactValue}>{contact.supportEmail || 'grievance@solisspread.com'}</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Phone size={20} color={COLORS.primaryDeep} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactValue}>{contact.phone || '+91 1800-123-4567'}</Text>
            </View>
          </View>

          {contact.whatsappNumber ? (
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <MessageCircle size={20} color={COLORS.primaryDeep} />
              </View>
              <View style={styles.contactText}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>{contact.whatsappNumber}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <MapPin size={20} color={COLORS.primaryDeep} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Office Address</Text>
              <Text style={styles.contactValue}>Solisspread Tech Park, Sector 5, Kolkata, West Bengal - 700091</Text>
            </View>
          </View>

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
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  desc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 24 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  contactIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  contactText: { flex: 1 },
  contactLabel: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 4 },
  contactValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
});
