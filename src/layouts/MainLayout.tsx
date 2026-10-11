import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Modal,
  Dimensions,
  ScrollView,
  ImageBackground
} from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../components/common/AnimatedButton';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  runOnJS,
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ArrowLeft,
  MessageSquare,
  Home as HomeIcon,
  ShoppingBag,
  Calculator,
  FileText,
  User as UserIcon,
  X,
  ShieldCheck,
  MapPin,
  CreditCard,
  Headphones,
  Settings,
  Info,
  LogOut,
  ChevronRight,
  ArrowLeftRight,
  Upload,
  Wallet,
  BadgeCheck,
  Pencil,
  Sun,
  ChevronLeft,
  LayoutGrid,
  BadgePercent,
  Package,
  Gift,
  ShoppingCart,
  Menu,
  Coins,
  AlertCircle
} from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { WebView } from 'react-native-webview';
import LottieView from 'lottie-react-native';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../constants/theme';
import { NotificationsPanel } from '../components/common/NotificationsPanel';
import SideMenu from '../components/common/SideMenu';
import { useCartStore } from '../store/useCartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- ANIMATED SVG COMPONENT --- //
const AnimatedSvg = ({ source, style }: { source: any; style?: any }) => {
  return (
    <ExpoImage
      source={source}
      style={[{ flex: 1 }, style]}
      contentFit="contain"
      transition={200}
    />
  );
};

// --- MAIN LAYOUT COMPONENT --- //
interface MainLayoutProps {
  children?: React.ReactNode;
  transparentHeader?: boolean;
  headerScrollY?: SharedValue<number>;
  activeTab?: 'home' | 'shop' | 'calculator' | 'amc' | 'orderHistory' | 'profile' | 'help_center';
  onTabChange?: (tab: string) => void;
  hideHeader?: boolean;
}

export default function MainLayout({ children, transparentHeader = false, headerScrollY, activeTab = 'home', onTabChange, hideHeader = false }: MainLayoutProps) {
  const insets = useSafeAreaInsets();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isNotifVisible, setIsNotifVisible] = useState(false);
  const cartCount = useCartStore((s) => s.totals.itemCount);
  const cartLoaded = useCartStore((s) => s.loaded);

  useEffect(() => {
    if (!cartLoaded) useCartStore.getState().fetchCart();
  }, [cartLoaded]);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    if (!transparentHeader || !headerScrollY) return {};

    return {
      backgroundColor: interpolateColor(
        headerScrollY.value,
        [0, 100],
        ['transparent', COLORS.primaryDeep]
      ),
    };
  });

  return (
    <View style={[styles.container, transparentHeader && { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky Top Header Section */}
      {!hideHeader && (
        <Animated.View
          style={[
            styles.darkHeader,
            { paddingTop: Math.max(insets.top, 16) + 8 },
            transparentHeader && styles.transparentHeaderOverride,
            animatedHeaderStyle,
          ]}
        >
          <View style={styles.topAppBar}>
            <View style={styles.brandLogoRow}>
              <Image
                source={require('../../assets/logo-rec-light.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerRightControls}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => setIsNotifVisible(true)}>
                <Bell size={20} color={COLORS.surface} />
                <View style={styles.badge} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => onTabChange?.('cart')}>
                <ShoppingCart size={20} color={COLORS.surface} />
                {cartCount > 0 ? <View style={styles.badge} /> : null}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Main Content Area */}
      <View style={styles.contentWrapper}>
        {children}
      </View>

      {/* Floating Chat Support Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom, 8) + 72 },
        ]}
        activeOpacity={0.9}
      >
        <MessageSquare size={22} color={COLORS.primaryDeep} />
      </TouchableOpacity>

      {/* Fixed Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Math.max(insets.bottom, 8), height: 64 + Math.max(insets.bottom, 8) },
        ]}
      >
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => onTabChange?.('home')}>
          <HomeIcon size={22} color={activeTab === 'home' ? COLORS.accent : COLORS.textSecondary} />
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => onTabChange?.('shop')}>
          <ShoppingBag size={22} color={activeTab === 'shop' ? COLORS.accent : COLORS.textSecondary} />
          <Text style={[styles.navText, activeTab === 'shop' && styles.activeNavText]}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => onTabChange?.('solar_calculator')}>
          <Calculator size={22} color={activeTab === 'calculator' ? COLORS.accent : COLORS.textSecondary} />
          <Text style={[styles.navText, activeTab === 'calculator' && styles.activeNavText]}>Calculator</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => onTabChange?.('amc')}>
          <ShieldCheck size={22} color={activeTab === 'amc' ? COLORS.accent : COLORS.textSecondary} />
          <Text style={[styles.navText, activeTab === 'amc' && styles.activeNavText]}>AMC</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => setIsMenuVisible(true)}>
          <Menu size={22} color={COLORS.textSecondary} />
          <Text style={styles.navText}>More</Text>
        </TouchableOpacity>
      </View>

      {/* Side Menu Panel */}
      <SideMenu isMenuVisible={isMenuVisible} setIsMenuVisible={setIsMenuVisible} onTabChange={onTabChange} />

      {/* Notification Panel */}
      <NotificationsPanel visible={isNotifVisible} onClose={() => setIsNotifVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDeep,
  },
  darkHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.primaryDeep,
    zIndex: 10,
    ...SHADOWS.card,
  },
  transparentHeaderOverride: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 0,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 30,
    // tintColor: COLORS.surface,
    // @ts-ignore
    // filter: 'brightness(100%) ',
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtn: {
    width: 35,
    height: 35,
    borderRadius: 20,
    overflow: 'visible',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    transform: [{ scale: 2 }]
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.primaryDeep,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    ...SHADOWS.soft,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.borderDark,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    zIndex: 100,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  activeNavText: {
    color: COLORS.accent,
    fontWeight: '800',
  },
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
  leftPanelContainer: {
    width: '100%',
    right: 'auto',
    left: 0,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  externalCloseCircle: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    ...SHADOWS.card,
  },
  sideMenuScroll: {
    paddingBottom: 40,
  },
  sideMenuHeaderBg: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  sideMenuHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  sideMenuBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideMenuBrandText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: 1,
  },
  sideMenuBrandSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  sideMenuCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  sideMenuBody: {
    paddingHorizontal: 20,
  },
  profileSectionOverlap: {
    marginTop: -50,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.card,
    ...SHADOWS.soft,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 100,
    width: 80,
    height: 80,
  },
  largeAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    position: 'absolute',
    left: 0,
    top: 0,
    transform: [{ scale: 2 }]
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.info,
    marginLeft: 4,
  },
  coinCard: {
    backgroundColor: COLORS.primaryDeep,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.card,
  },
  coinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinBalanceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coinLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  coinBalance: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.surface,
  },
  coinBalanceSub: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  coinHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinHistoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
    marginRight: 4,
  },
  coinWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  coinWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FCD34D',
    marginLeft: 8,
  },
  coinFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  coinFooterText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    paddingRight: 12,
    lineHeight: 18,
  },
  coinReferBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinReferBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  menuList: {
    flex: 1,
  },
  menuLinksList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    paddingHorizontal: 16,
    marginBottom: 20,
    ...SHADOWS.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primaryDeep,
    fontWeight: '500',
    marginLeft: 12,
  },
  menuBadge: {
    backgroundColor: COLORS.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    ...SHADOWS.soft,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: 8,
  },
  footerWrapper: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  developerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  developerText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  developerName: {
    fontSize: 12,
    color: COLORS.primaryDeep,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
