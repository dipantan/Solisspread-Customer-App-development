import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, BackHandler, Modal } from 'react-native';
import CustomWheelDatePicker from '../../components/common/CustomWheelDatePicker';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HeadphonesIcon,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  MapPin,
  Calendar,
  ChevronDown,
  Info,
  Package,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import StatusModal from '../../components/common/StatusModal';
import * as amcApi from '../../api/amc';
import * as ordersApi from '../../api/orders';
import * as usersApi from '../../api/users';
import { ApiError } from '../../api/client';

const { width } = Dimensions.get('window');



const CATEGORIES = ['Solar Panel', 'Solar Inverter', 'Solar Battery', 'Complete Solar System', 'Accessories'];

export default function BuyAmcScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (step: any, params?: any) => void }) {
  const insets = useSafeAreaInsets();
  const [amcPlans, setAmcPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [purchasedProducts, setPurchasedProducts] = useState<{ id: string; name: string; date: string }[]>([]);
  const [productDesc, setProductDesc] = useState('');
  const [installAddress, setInstallAddress] = useState('');
  useEffect(() => {
    amcApi.listAmcPlans().then(setAmcPlans).catch(() => {});
    usersApi
      .listAddresses()
      .then((addresses) => {
        const preferred = addresses.find((a) => a.isDefault) || addresses[0];
        if (preferred) {
          setInstallAddress(
            [preferred.address, preferred.city, preferred.state, preferred.pinCode]
              .filter(Boolean)
              .join(', '),
          );
        }
      })
      .catch(() => {});
    ordersApi
      .listOrders()
      .then((orders) => {
        const seen = new Map<string, { id: string; name: string; date: string }>();
        orders.forEach((order) => {
          const when = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '';
          (order.items ?? []).forEach((item) => {
            const name = item.product?.name;
            if (item.productId && name && !seen.has(item.productId)) {
              seen.set(item.productId, { id: item.productId, name, date: when });
            }
          });
        });
        setPurchasedProducts([...seen.values()]);
      })
      .catch(() => {});
  }, []);
  const [selectedOption, setSelectedOption] = useState<'from_us' | 'from_other' | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [productCategory, setProductCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [installationDate, setInstallationDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [modalState, setModalState] = useState({ visible: false, type: 'success' as 'success' | 'error', message: '' });

  React.useEffect(() => {
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
        <Text style={COMMON_STYLES.headerTitle}>Request for New AMC</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => { }}>
          <HeadphonesIcon size={18} color={COLORS.primaryDeep} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleSubmit = async () => {
    try {
      const purchased = purchasedProducts.find((p) => p.id === selectedProductId);
      const notes =
        selectedOption === 'from_other'
          ? [
              `Category: ${productCategory || 'Not specified'}`,
              productDesc.trim() ? `Details: ${productDesc.trim()}` : '',
              installationDate
                ? `Installed on: ${installationDate.toLocaleDateString('en-IN')}`
                : '',
            ]
              .filter(Boolean)
              .join('. ')
          : `AMC for purchased product: ${purchased?.name ?? 'selected product'}`;
      await amcApi.requestAmc({
        planId: selectedPlanId || undefined,
        productId: selectedOption === 'from_us' ? (selectedProductId || undefined) : undefined,
        requestType: 'NEW',
        notes,
        address: installAddress.trim() || undefined,
      });
      setModalState({
        visible: true,
        type: 'success',
        message: 'AMC request submitted successfully',
      });
    } catch (e: any) {
      setModalState({
        visible: true,
        type: 'error',
        message: e instanceof ApiError ? e.message : e?.message || 'Failed to submit AMC request',
      });
    }
  };

  const handleModalComplete = () => {
    setModalState(prev => ({ ...prev, visible: false }));
    onBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.bannerContainer}>
          <View style={styles.bannerIconBox}>
            <ShieldCheck size={20} color={COLORS.surface} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Keep your solar system protected!</Text>
            <Text style={styles.bannerSubtext}>Choose the option that applies to you and submit your AMC request.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section} layout={Layout.springify()}>
          <Text style={styles.sectionTitle}>Choose an Option</Text>

          <TouchableOpacity
            style={[styles.optionCard, selectedOption === 'from_us' && styles.optionCardSelected]}
            onPress={() => setSelectedOption('from_us')}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIconContainer, selectedOption === 'from_us' ? { backgroundColor: COLORS.primary + '15' } : { backgroundColor: COLORS.background }]}>
              <ShoppingCart size={24} color={selectedOption === 'from_us' ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>I purchased product from this company</Text>
              <Text style={styles.optionDesc}>Select this if you bought your product from us.</Text>
            </View>
            <View style={[styles.radioCircle, selectedOption === 'from_us' && styles.radioCircleSelected]}>
              {selectedOption === 'from_us' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, selectedOption === 'from_other' && styles.optionCardSelected]}
            onPress={() => setSelectedOption('from_other')}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIconContainer, selectedOption === 'from_other' ? { backgroundColor: COLORS.success + '15' } : { backgroundColor: COLORS.background }]}>
              <ShoppingBag size={24} color={selectedOption === 'from_other' ? COLORS.success : COLORS.textSecondary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>I purchased product from another company</Text>
              <Text style={styles.optionDesc}>Select this if you bought your product from somewhere else.</Text>
            </View>
            <View style={[styles.radioCircle, selectedOption === 'from_other' && styles.radioCircleSelected]}>
              {selectedOption === 'from_other' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {selectedOption === 'from_us' && (
          <Animated.View entering={FadeInUp.delay(100).springify()} layout={Layout.springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Your Purchased Products</Text>

            {purchasedProducts.length === 0 && (
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginVertical: 8 }}>
                No purchased products found on your account. If you bought the product elsewhere, choose "Bought from somewhere else" above.
              </Text>
            )}
            {purchasedProducts.map(product => {
              if (selectedProductId !== null && selectedProductId !== product.id) {
                return null;
              }

              const isSelected = selectedProductId === product.id;

              return (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.productCard, isSelected && styles.productCardSelected]}
                  onPress={() => setSelectedProductId(isSelected ? null : product.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.productIconBox, isSelected && { backgroundColor: COLORS.primary + '20' }]}>
                    <Package size={24} color={isSelected ? COLORS.primaryDeep : COLORS.textSecondary} />
                  </View>
                  <View style={styles.productContent}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDate}>Ordered: {product.date}</Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {selectedProductId !== null && (
              <Animated.View entering={FadeInUp.springify()} style={styles.actionContainer}>
                <TouchableOpacity style={styles.continueBtn} onPress={handleSubmit}>
                  <Text style={styles.continueBtnText}>Submit AMC Request</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {selectedOption === 'from_other' && (
          <Animated.View entering={FadeInUp.delay(100).springify()} layout={Layout.springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details Form</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Category</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryPicker(true)} activeOpacity={0.7}>
                <Text style={[styles.selectText, productCategory && { color: COLORS.textPrimary }]}>
                  {productCategory || 'Select Product Type'}
                </Text>
                <ChevronDown size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Description</Text>
              <View style={[styles.textInputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter brand, model, and other details..."
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                  value={productDesc}
                  onChangeText={setProductDesc}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Installation Date</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <Text style={[styles.selectText, installationDate && { color: COLORS.textPrimary }]}>
                  {installationDate ? installationDate.toLocaleDateString() : 'Select Installation Date'}
                </Text>
                <Calendar size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Installation Address</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter full address"
                  placeholderTextColor={COLORS.textTertiary}
                  value={installAddress}
                  onChangeText={setInstallAddress}
                />
                <MapPin size={20} color={COLORS.textSecondary} />
              </View>
              <TouchableOpacity style={styles.useLocationBtn}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.useLocationText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.continueBtn} onPress={handleSubmit}>
                <Text style={styles.continueBtnText}>Submit AMC Request</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

      </Animated.ScrollView>

      <StatusModal 
        visible={modalState.visible}
        type={modalState.type}
        message={modalState.message}
        onComplete={handleModalComplete}
      />

      <CustomWheelDatePicker
        visible={showDatePicker}
        value={installationDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date: Date) => {
          setInstallationDate(date);
          setShowDatePicker(false);
        }}
      />

      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category}
                style={[styles.modalOption, productCategory === category && styles.modalOptionSelected]}
                onPress={() => {
                  setProductCategory(category);
                  setShowCategoryPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, productCategory === category && { color: COLORS.primaryDeep, fontWeight: '700' }]}>{category}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDeep,
  },
  bannerContainer: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  bannerIconBox: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  bannerSubtext: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    width: '100%',
    ...SHADOWS.card,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.googleRed + '20',
    borderWidth: 1,
    borderColor: COLORS.googleRed,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.googleRed,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  productCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  productIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productContent: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  productDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  warrantyBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  warrantyText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  selectText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    height: '100%',
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  useLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  useLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
