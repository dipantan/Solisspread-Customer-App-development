import React from 'react';
import { View, Text, StyleSheet, Modal, BackHandler } from 'react-native';
import { AnimatedButton as TouchableOpacity } from './AnimatedButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { AlertCircle } from 'lucide-react-native';

interface ExitConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({ visible, onClose }) => {
  const handleExit = () => {
    BackHandler.exitApp();
  };

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
            <AlertCircle size={32} color={COLORS.error} />
          </View>

          <Text style={styles.title}>Exit App?</Text>
          <Text style={styles.message}>Are you sure you want to close the Solisspread app?</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.exitBtn} onPress={handleExit} activeOpacity={0.7}>
              <Text style={styles.exitBtnText}>Yes, Exit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>No, Stay</Text>
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
    padding: 24
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.modal,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    ...SHADOWS.card
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryNavy,
    marginBottom: 8
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between'
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.successAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.successAlt
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface
  },
  exitBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderDark
  },
  exitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary
  }
});
