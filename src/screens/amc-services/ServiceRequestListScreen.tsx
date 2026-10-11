import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, BackHandler, ActivityIndicator } from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../../components/common/AnimatedButton';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  HeadphonesIcon,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, COMMON_STYLES } from '../../constants/theme';
import * as amcApi from '../../api/amc';
import { ApiError } from '../../api/client';

const { width } = Dimensions.get('window');

export default function ServiceRequestListScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (step: any, params?: any) => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await amcApi.listDockets();
        setRequests(
          data.map((d) => ({
            id: d.docketNumber || d.id,
            docketId: d.id,
            category: d.issueCategory || 'Service Request',
            product: d.siteAddress || d.description || '',
            status: d.status || 'OPEN',
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '',
            description: d.description || '',
          })),
        );
      } catch {
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    })();
  }, []);

  const insets = useSafeAreaInsets();

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
        <Text style={COMMON_STYLES.headerTitle}>Service Requests</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.helpBtn} onPress={() => {}}>
          <HeadphonesIcon size={18} color={COLORS.primaryDeep} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatusBadge = (status: string) => {
    let bgColor = COLORS.infoLight;
    let textColor = COLORS.info;
    let Icon = Clock;

    if (status === 'Resolved') {
      bgColor = COLORS.successLight;
      textColor = COLORS.success;
      Icon = CheckCircle2;
    } else if (status === 'Pending') {
      bgColor = COLORS.warning + '20';
      textColor = COLORS.warning;
      Icon = AlertCircle;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Icon size={12} color={textColor} style={{ marginRight: 4 }} />
        <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'bottom']}>
      {renderHeader()}
      <View style={styles.container}>
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
              <FileText size={40} color={COLORS.textTertiary} />
              <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' }}>
                {loadingRequests ? 'Loading requests...' : 'No service requests yet'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay((index + 1) * 100).springify()}>
              <TouchableOpacity 
                style={styles.requestCard} 
                activeOpacity={0.8}
                onPress={() => onNavigate?.('service_request_details', { id: item.id })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.idRow}>
                    <FileText size={16} color={COLORS.primary} />
                    <Text style={styles.reqId}>{item.id}</Text>
                  </View>
                  {renderStatusBadge(item.status)}
                </View>
                
                <View style={styles.cardBody}>
                  <Text style={styles.categoryTitle}>{item.category}</Text>
                  <Text style={styles.productText} numberOfLines={1}>{item.product}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>Requested on: {item.date}</Text>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => onNavigate?.('service_request_details', { id: item.id })}>
                    <Text style={styles.viewBtnText}>View Details</Text>
                    <ChevronRight size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </View>
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
  container: {
    flex: 1,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    marginBottom: 4,
  },
  productText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
