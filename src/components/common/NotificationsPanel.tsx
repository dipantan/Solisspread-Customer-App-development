import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Dimensions } from 'react-native';
import { AnimatedButton as TouchableOpacity } from './AnimatedButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Settings,
  LayoutGrid,
  FileText,
  BadgePercent,
  Package,
  ShoppingBag,
  Wallet,
  Bell,
  Info,
  Gift,
  ChevronRight,
  ArrowLeft
} from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { COLORS, SHADOWS, RADIUS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- SLIDE PANEL COMPONENT (Extracted from MainLayout) --- //
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
          {!hideHeader && (
            <View style={[styles.panelHeader, { paddingTop: insets.top + 10 }]}>
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

// --- MOCK DATA --- //
const NOTIFICATIONS_MOCK = [
  {
    id: '1',
    section: 'Today',
    title: 'Order Confirmed',
    desc: 'Your order #ORD12345 has been confirmed successfully.',
    time: '10:30 AM',
    type: 'order',
    read: false,
    dotColor: '#3B82F6',
    bgColor: '#F0F9FF',
    icon: ShoppingBag,
    iconColor: '#3B82F6',
    iconBg: '#DBEAFE',
    accessoryType: 'image',
    accessoryData: require('../../../assets/splash_solar_bg.png'),
  },
  {
    id: '2',
    section: 'Today',
    title: 'Special Offer for You!',
    desc: 'Get flat 10% OFF on all solar panels. Limited time offer.',
    time: '9:15 AM',
    type: 'offer',
    read: false,
    dotColor: '#10B981',
    bgColor: '#F0FDF4',
    icon: BadgePercent,
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
    accessoryType: 'pill',
    accessoryText: 'OFFER',
    accessoryColor: '#10B981',
    accessoryBg: '#D1FAE5',
  },
  {
    id: '3',
    section: 'Today',
    title: 'Wallet Cashback Received',
    desc: 'You have received ₹250 cashback in your wallet.',
    time: '8:45 AM',
    type: 'wallet',
    read: false,
    dotColor: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: Wallet,
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
    accessoryType: 'text',
    accessoryText: '+ ₹250',
    accessoryColor: '#10B981',
  },
  {
    id: '4',
    section: 'Today',
    title: 'Installation Scheduled',
    desc: 'Your installation is scheduled on 25 May, 2025 between 10 AM - 2 PM.',
    time: '8:30 AM',
    type: 'installation',
    read: false,
    dotColor: '#3B82F6',
    bgColor: '#FAF5FF',
    icon: Bell,
    iconColor: '#8B5CF6',
    iconBg: '#F3E8FF',
    accessoryType: 'date',
    accessoryMonth: 'MAY',
    accessoryDay: '25',
  },
  {
    id: '5',
    section: 'Yesterday',
    title: 'System Update',
    desc: 'We have improved app performance and fixed some bugs.',
    time: 'Yesterday, 6:30 PM',
    type: 'system',
    read: false,
    dotColor: '#3B82F6',
    bgColor: '#FFFFFF',
    icon: Info,
    iconColor: '#3B82F6',
    iconBg: '#DBEAFE',
    accessoryType: 'pill',
    accessoryText: 'UPDATE',
    accessoryColor: '#3B82F6',
    accessoryBg: '#DBEAFE',
  },
  {
    id: '6',
    section: 'Yesterday',
    title: 'Refer & Earn Bonus!',
    desc: 'Rahul Verma joined using your referral and you earned ₹500.',
    time: 'Yesterday, 3:20 PM',
    type: 'referral',
    read: false,
    dotColor: '#3B82F6',
    bgColor: '#FFFFFF',
    icon: Gift,
    iconColor: '#EF4444',
    iconBg: '#FEE2E2',
    accessoryType: 'pill',
    accessoryText: 'REFERRAL',
    accessoryColor: '#EF4444',
    accessoryBg: '#FEE2E2',
  },
  {
    id: '7',
    section: 'Earlier',
    title: 'Quote Generated',
    desc: 'Your solar quote #QTE12345 has been generated successfully.',
    time: '22 May 2025, 11:20 AM',
    type: 'quote',
    read: true,
    dotColor: '#94A3B8',
    bgColor: '#FFFFFF',
    icon: FileText,
    iconColor: '#64748B',
    iconBg: '#F1F5F9',
    accessoryType: 'none',
  },
];

// --- NOTIFICATION PANEL COMPONENT --- //
interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ visible, onClose }: NotificationsPanelProps) {
  const insets = useSafeAreaInsets();

  return (
    <SlidePanel visible={visible} onClose={onClose} direction="right" hideHeader>
      <View style={[styles.notifContainer, { paddingTop: insets.top }]}>
        <View style={styles.notifHeader}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.notifHeaderIconBtn}>
            <ChevronLeft size={24} color={COLORS.primaryDeep} />
          </TouchableOpacity>
          <Text style={styles.notifHeaderTitle}>Notifications</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.notifHeaderIconBtn}>
            <Settings size={24} color={COLORS.primaryDeep} />
          </TouchableOpacity>
        </View>

        <View style={styles.notifFiltersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notifFiltersScroll}>
            <TouchableOpacity style={[styles.notifFilterTab, styles.notifFilterActive]} activeOpacity={0.8}>
              <LayoutGrid size={16} color={COLORS.surface} />
              <Text style={[styles.notifFilterText, styles.notifFilterTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifFilterTab} activeOpacity={0.8}>
              <FileText size={16} color={COLORS.textSecondary} />
              <Text style={styles.notifFilterText}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifFilterTab} activeOpacity={0.8}>
              <BadgePercent size={16} color={COLORS.textSecondary} />
              <Text style={styles.notifFilterText}>Offers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifFilterTab} activeOpacity={0.8}>
              <Package size={16} color={COLORS.textSecondary} />
              <Text style={styles.notifFilterText}>Updates</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifFilterTab} activeOpacity={0.8}>
              <Settings size={16} color={COLORS.textSecondary} />
              <Text style={styles.notifFilterText}>System</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.notifListScroll} bounces={true}>
          {['Today', 'Yesterday', 'Earlier'].map((sectionTitle) => {
            const sectionItems = NOTIFICATIONS_MOCK.filter(n => n.section === sectionTitle);
            if (sectionItems.length === 0) return null;

            return (
              <View key={sectionTitle} style={styles.notifSection}>
                <View style={styles.notifSectionHeader}>
                  <Text style={styles.notifSectionTitle}>{sectionTitle}</Text>
                  {sectionTitle === 'Today' && (
                    <TouchableOpacity style={styles.notifMarkReadBtn} activeOpacity={0.7}>
                      <Text style={styles.notifMarkReadText}>Mark all as read</Text>
                      <View style={styles.notifMarkReadDot} />
                    </TouchableOpacity>
                  )}
                </View>

                {sectionItems.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.notifCard, { backgroundColor: item.bgColor }]}
                      activeOpacity={0.7}
                    >
                      {/* Status Dot */}
                      <View style={[styles.notifStatusDot, { backgroundColor: item.dotColor }]} />

                      {/* Icon Box */}
                      <View style={[styles.notifIconBox, { backgroundColor: item.iconBg }]}>
                        <IconComp size={22} color={item.iconColor} />
                      </View>

                      {/* Content */}
                      <View style={styles.notifContentBox}>
                        <Text style={styles.notifTitleTxt} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.notifDescTxt} numberOfLines={2}>{item.desc}</Text>
                        <Text style={styles.notifTimeTxt}>{item.time}</Text>
                      </View>

                      {/* Right Accessory */}
                      <View style={styles.notifAccessoryBox}>
                        {item.accessoryType === 'image' && (
                          <ExpoImage source={item.accessoryData} style={styles.notifAccessoryImg} contentFit="contain" />
                        )}
                        {item.accessoryType === 'pill' && (
                          <View style={[styles.notifPillBadge, { backgroundColor: item.accessoryBg }]}>
                            <Text style={[styles.notifPillBadgeTxt, { color: item.accessoryColor }]}>{item.accessoryText}</Text>
                          </View>
                        )}
                        {item.accessoryType === 'text' && (
                          <Text style={[styles.notifAccessoryTextValue, { color: item.accessoryColor }]}>{item.accessoryText}</Text>
                        )}
                        {item.accessoryType === 'date' && (
                          <View style={styles.notifDateBadge}>
                            <View style={styles.notifDateBadgeTop}>
                              <Text style={styles.notifDateBadgeMonth}>{item.accessoryMonth}</Text>
                            </View>
                            <View style={styles.notifDateBadgeBottom}>
                              <Text style={styles.notifDateBadgeDay}>{item.accessoryDay}</Text>
                            </View>
                          </View>
                        )}
                      </View>

                      <ChevronRight size={18} color={COLORS.textTertiary} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SlidePanel>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panelContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SCREEN_WIDTH * 1,
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  leftPanelContainer: {
    left: 0,
    right: 'auto',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.primaryDeep,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
  panelContent: {
    flex: 1,
    padding: 24,
  },
  notifContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  notifHeaderIconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  notifFiltersWrapper: {
    backgroundColor: COLORS.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifFiltersScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  notifFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifFilterActive: {
    backgroundColor: COLORS.primaryDeep,
    borderColor: COLORS.primaryDeep,
  },
  notifFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  notifFilterTextActive: {
    color: COLORS.surface,
  },
  notifListScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  notifSection: {
    marginBottom: 24,
  },
  notifSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  notifSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  notifMarkReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifMarkReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDeep,
    marginRight: 6,
  },
  notifMarkReadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 12,
    marginBottom: 12,
  },
  notifStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  notifIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifContentBox: {
    flex: 1,
  },
  notifTitleTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  notifDescTxt: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  notifTimeTxt: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  notifAccessoryBox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  notifAccessoryImg: {
    width: 40,
    height: 30,
    borderRadius: 4,
  },
  notifPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notifPillBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  notifAccessoryTextValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  notifDateBadge: {
    width: 36,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifDateBadgeTop: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 2,
    alignItems: 'center',
  },
  notifDateBadgeMonth: {
    fontSize: 9,
    color: COLORS.surface,
    fontWeight: '700',
  },
  notifDateBadgeBottom: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  notifDateBadgeDay: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
});
