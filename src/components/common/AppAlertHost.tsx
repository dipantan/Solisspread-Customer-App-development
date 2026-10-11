import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { AnimatedButton as TouchableOpacity } from './AnimatedButton';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { useAlertStore, type AlertButton, type AlertKind } from '../../store/useAlertStore';

const KIND_META: Record<AlertKind, { color: string; bg: string; Icon: typeof Info }> = {
  success: { color: COLORS.success, bg: COLORS.successLight, Icon: CheckCircle2 },
  error: { color: COLORS.error, bg: COLORS.errorLight, Icon: XCircle },
  warning: { color: COLORS.warning, bg: COLORS.warningLight, Icon: AlertTriangle },
  info: { color: COLORS.info, bg: COLORS.infoLight, Icon: Info },
};

function AlertDialog() {
  const current = useAlertStore((s) => s.queue[0]);
  const dismiss = useAlertStore((s) => s.dismiss);

  if (!current) return null;
  const meta = KIND_META[current.kind];
  const stacked = current.buttons.length > 2;

  const press = (button?: AlertButton) => {
    dismiss(current.id);
    if (button?.onPress) setTimeout(() => void button.onPress?.(), 0);
  };

  const onRequestClose = () => {
    if (!current.cancelable) return;
    press(current.buttons.find((b) => b.style === 'cancel'));
  };

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onRequestClose}>
      <Pressable style={styles.overlay} onPress={onRequestClose}>
        <Animated.View key={current.id} entering={ZoomIn.duration(220)} style={styles.dialog}>
          <Pressable>
            <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
              <meta.Icon size={30} color={meta.color} />
            </View>
            <Text style={styles.title}>{current.title}</Text>
            {current.message ? <Text style={styles.message}>{current.message}</Text> : null}

            <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
              {current.buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                const isPrimary = !isCancel && (index === current.buttons.length - 1 || isDestructive);
                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.button,
                      !stacked && { flex: 1 },
                      isPrimary
                        ? { backgroundColor: isDestructive ? COLORS.error : COLORS.primary }
                        : styles.buttonSecondary,
                    ]}
                    onPress={() => press(button)}
                  >
                    <Text style={[styles.buttonText, isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function Toast() {
  const toast = useAlertStore((s) => s.toast);
  const setToast = useAlertStore((s) => s.setToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      if (useAlertStore.getState().toast?.id === toast.id) setToast(null);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;
  const meta = KIND_META[toast.kind];

  return (
    <View pointerEvents="box-none" style={[styles.toastWrap, { top: insets.top + 8 }]}>
      <Animated.View
        key={toast.id}
        entering={FadeInUp.duration(250)}
        exiting={FadeOutUp.duration(200)}
        style={[styles.toast, { borderLeftColor: meta.color }]}
      >
        <meta.Icon size={20} color={meta.color} />
        <Text style={styles.toastText} numberOfLines={3}>{toast.message}</Text>
        {toast.action ? (
          <TouchableOpacity
            style={styles.toastAction}
            onPress={() => {
              setToast(null);
              toast.action?.onPress();
            }}
          >
            <Text style={styles.toastActionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </View>
  );
}

/** Mount once at the app root; renders dialogs from `showAlert` and toasts from `showToast`. */
export default function AppAlertHost() {
  return (
    <>
      <Toast />
      <AlertDialog />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 24, 56, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 24,
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  buttonsStacked: {
    flexDirection: 'column-reverse',
  },
  button: {
    height: 48,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: COLORS.surface,
  },
  buttonTextSecondary: {
    color: COLORS.primaryDeep,
  },
  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...SHADOWS.card,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  toastAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  toastActionText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
