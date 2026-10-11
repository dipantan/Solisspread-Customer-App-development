import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { AnimatedButton as TouchableOpacity } from '../common/AnimatedButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { AlertTriangle } from 'lucide-react-native';

interface OTPBackConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const OTPBackConfirmationModal: React.FC<OTPBackConfirmationModalProps> = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={32} color={COLORS.warning} />
          </View>

          <Text style={styles.title}>Wait!</Text>
          <Text style={styles.message}>If you go back now, you'll have to start registration from the beginning.{'\n\n'}Do you want to go back?</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exitBtn} onPress={onConfirm} activeOpacity={0.7}>
              <Text style={styles.exitBtnText}>Yes, go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 24, 56, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.modal,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7', // Light yellow for warning
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryNavy,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  exitBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  exitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000', // Black text on yellow background for better contrast
  },
});
