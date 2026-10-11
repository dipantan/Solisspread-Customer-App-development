import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Constants from 'expo-constants';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import SlidePanel from './SlidePanel';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { displayName, statusLabel } from '../../utils/userDisplay';
import {
  X,
  Pencil,
  BadgeCheck,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  FileText,
  User as UserIcon,
  Lock,
  ShieldCheck,
  MapPin,
  Bell,
  Globe,
  Palette,
  Sun,
  HelpCircle,
  Headphones,
  Info,
  Shield,
  LogOut
} from 'lucide-react-native';

interface SideMenuProps {
  isMenuVisible: boolean;
  setIsMenuVisible: (visible: boolean) => void;
  onTabChange?: (tab: string) => void;
}

export default function SideMenu({ isMenuVisible, setIsMenuVisible, onTabChange }: SideMenuProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const status = statusLabel(user);

  useEffect(() => {
    if (isMenuVisible) refreshUser();
  }, [isMenuVisible, refreshUser]);

  const handleLogout = async () => {
    setIsMenuVisible(false);
    await useAuthStore.getState().logout();
    const nav = useNavigationStore.getState();
    await nav.clearSession();
    nav.setCurrentStep('login');
  };

  return (
    <SlidePanel
      visible={isMenuVisible}
      onClose={() => setIsMenuVisible(false)}
      direction="left"
      hideHeader
    >
      <View style={{ zIndex: 10 }}>
        {/* Header Image Background */}
        <View style={[styles.sideMenuHeaderBg, { paddingTop: insets.top + 20 }]}>
          <ImageBackground
            source={require('../../../assets/splash_solar_bg.png')}
            style={StyleSheet.absoluteFillObject}
            imageStyle={{ opacity: 0.5 }}
          >
            <LinearGradient
              colors={[COLORS.primaryDeep, 'rgba(7, 24, 56, 0.5)', 'rgba(7, 24, 56, 0.8)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </ImageBackground>

          <View style={styles.sideMenuHeaderTop}>
            <View style={styles.sideMenuBrand}>
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 8,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
                ...SHADOWS.soft
              }}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={{ width: 42, height: 42 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.sideMenuBrandText}>SOLISSPREAD</Text>
                <Text style={styles.sideMenuBrandSub}>Powering a Brighter Tomorrow</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.sideMenuCloseBtn} activeOpacity={0.8} onPress={() => setIsMenuVisible(false)}>
              <X size={18} color={COLORS.primaryDeep} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sideMenuBody}>
          {/* Profile Section */}
          <View style={[styles.profileSection, styles.profileSectionOverlap]}>
            <View style={styles.avatarContainer}>
              <LottieView
                source={require('../../../assets/animations/user.json')}
                autoPlay
                loop
                style={styles.largeAvatar}
              />
              <TouchableOpacity
                style={styles.editAvatarBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setIsMenuVisible(false);
                  setTimeout(() => onTabChange?.('edit_profile'), 300);
                }}
              >
                <Pencil size={12} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName(user)}</Text>
              {user?.email ? (
                <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
              ) : null}
              <View style={styles.verifiedBadge}>
                <BadgeCheck size={14} color={status.verified ? COLORS.info : COLORS.textSecondary} />
                <Text style={[styles.verifiedText, !status.verified && { color: COLORS.textSecondary }]}>
                  {status.text}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setIsMenuVisible(false);
                setTimeout(() => onTabChange?.('edit_profile'), 300);
              }}
              style={{ padding: 4 }}
            >
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.sideMenuScroll} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={[styles.sideMenuBody, { paddingTop: 0 }]}>
          {/* SolaCoin Rewards Card */}
          <View style={styles.coinCard}>
            <View style={styles.coinHeaderRow}>
              <View style={styles.coinBalanceWrapper}>
                <View style={styles.coinIconBox}>
                  <LottieView
                    source={require('../../../assets/animations/coin.json')}
                    autoPlay
                    loop
                    style={{ width: 80, height: 80 }}
                  />
                </View>
                <View>
                  <Text style={styles.coinLabel}>SolaCoins Balance</Text>
                  <Text style={styles.coinBalance}>245 <Text style={styles.coinBalanceSub}>Coins</Text></Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.coinHistoryBtn} 
                activeOpacity={0.8}
                onPress={() => {
                  setIsMenuVisible(false);
                  onTabChange?.('referral_history');
                }}
              >
                <Text style={styles.coinHistoryText}>History</Text>
                <ChevronRight size={14} color={COLORS.surface} />
              </TouchableOpacity>
            </View>

            <View style={styles.coinWarningBox}>
              <AlertCircle size={16} color="#FCD34D" />
              <Text style={styles.coinWarningText}>5 coins will expire in 5 days</Text>
            </View>

            <View style={styles.coinFooter}>
              <Text style={styles.coinFooterText}>Earn more SolaCoins by referring friends!</Text>
              <TouchableOpacity 
                style={styles.coinReferBtn} 
                activeOpacity={0.8}
                onPress={() => {
                  setIsMenuVisible(false);
                  onTabChange?.('refer_earn');
                }}
              >
                <Text style={styles.coinReferBtnText}>Refer Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity Settings */}
          <Text style={styles.sectionTitle}>My Activity</Text>
          <View style={styles.menuLinksList}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setIsMenuVisible(false); onTabChange?.('orderHistory'); }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#3B82F620' }]}>
                <ShoppingBag size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>My Orders</Text>
                <Text style={styles.menuItemSub}>View and track your orders</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} activeOpacity={0.7}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B20' }]}>
                <FileText size={20} color="#F59E0B" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>My Quotes</Text>
                <Text style={styles.menuItemSub}>View your requested quotes</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Account Settings */}
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuLinksList}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setIsMenuVisible(false); onTabChange?.('edit_profile'); }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#8B5CF620' }]}>
                <UserIcon size={20} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Profile Information</Text>
                <Text style={styles.menuItemSub}>View and update your personal details</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setIsMenuVisible(false); onTabChange?.('change_password'); }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#10B98120' }]}>
                <Lock size={20} color="#10B981" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Change Password</Text>
                <Text style={styles.menuItemSub}>Update your account password</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setIsMenuVisible(false); onTabChange?.('security'); }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#3B82F620' }]}>
                <ShieldCheck size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Security</Text>
                <Text style={styles.menuItemSub}>Manage login, 2FA and account security</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} activeOpacity={0.7} onPress={() => { setIsMenuVisible(false); onTabChange?.('saved_addresses'); }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B20' }]}>
                <MapPin size={20} color="#F59E0B" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Saved Addresses</Text>
                <Text style={styles.menuItemSub}>Manage your delivery addresses</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuLinksList}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIconBox, { backgroundColor: '#3B82F620' }]}>
                <Bell size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Notifications</Text>
                <Text style={styles.menuItemSub}>Manage alerts and notifications</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIconBox, { backgroundColor: '#8B5CF620' }]}>
                <Globe size={20} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Language</Text>
                <Text style={styles.menuItemSub}>Choose your preferred language</Text>
              </View>
              <Text style={styles.menuValueText}>English</Text>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIconBox, { backgroundColor: '#10B98120' }]}>
                <Palette size={20} color="#10B981" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>App Appearance</Text>
                <Text style={styles.menuItemSub}>Choose light or dark mode</Text>
              </View>
              <Text style={styles.menuValueText}>Light</Text>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} activeOpacity={0.7}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B20' }]}>
                <Sun size={20} color="#F59E0B" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Units & Preferences</Text>
                <Text style={styles.menuItemSub}>Manage units and other preferences</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Support & About */}
          <Text style={styles.sectionTitle}>Support & About</Text>
          <View style={styles.menuLinksList}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setIsMenuVisible(false); onTabChange?.('help_center'); }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#3B82F620' }]}>
                <HelpCircle size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Help Center</Text>
                <Text style={styles.menuItemSub}>FAQs, guides and support</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setIsMenuVisible(false); onTabChange?.('support_tickets'); }}>
              <View style={[styles.menuIconBox, { backgroundColor: '#10B98120' }]}>
                <Headphones size={20} color="#10B981" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Contact Support</Text>
                <Text style={styles.menuItemSub}>Chat with our support team</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => {
                setIsMenuVisible(false);
                setTimeout(() => onTabChange?.('about_us'), 300);
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#8B5CF620' }]}>
                <Info size={20} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>About Us</Text>
                <Text style={styles.menuItemSub}>Know more about us</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => {
                setIsMenuVisible(false);
                setTimeout(() => onTabChange?.('terms'), 300);
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#6B728020' }]}>
                <FileText size={20} color="#6B7280" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Terms & Conditions</Text>
                <Text style={styles.menuItemSub}>Read our terms and conditions</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.lastMenuItem]} 
              activeOpacity={0.7}
              onPress={() => {
                setIsMenuVisible(false);
                setTimeout(() => onTabChange?.('privacy_center'), 300);
              }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EF444420' }]}>
                <Shield size={20} color="#EF4444" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemText}>Privacy Center</Text>
                <Text style={styles.menuItemSub}>Manage your data and privacy</Text>
              </View>
              <ChevronRight size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={handleLogout}>
            <LogOut size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.footerWrapper}>
            <Text style={[styles.poweredByText, { marginBottom: 4 }]}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
            <Text style={styles.poweredByText}>Powered by Solisspread Assist Pvt. Ltd.</Text>
            <View style={styles.developerFooter}>
              <Text style={styles.developerText}>Developed & Maintained by </Text>
              <Text style={styles.developerName}>Namix Software Pvt. Ltd.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SlidePanel>
  );
}

const styles = StyleSheet.create({
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
  sideMenuScroll: {
    paddingBottom: 40,
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
  profileSectionOverlap: {
    marginTop: -50,
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

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 10,
    marginTop: 8,
    marginLeft: 4,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuValueText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },


  developerName: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
