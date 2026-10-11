import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
  color: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ icon, title, color }) => (
  <View style={styles.trustBadge}>
    <View style={[styles.trustIconWrapper, { backgroundColor: color + '1A' }]}>
      {icon}
    </View>
    <Text style={styles.trustTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  trustBadge: {
    width: 80,
    alignItems: 'center',
  },
  trustIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
