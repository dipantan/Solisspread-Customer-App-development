import { create } from 'zustand';

export type AlertKind = 'info' | 'success' | 'error' | 'warning';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export interface AlertOptions {
  kind?: AlertKind;
  /** Tapping outside / hardware back closes the dialog. Defaults to true when there is a cancel button or a single button. */
  cancelable?: boolean;
}

export interface AlertRequest {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  kind: AlertKind;
  cancelable: boolean;
}

export interface ToastRequest {
  id: number;
  message: string;
  kind: AlertKind;
  action?: { label: string; onPress: () => void };
  duration: number;
}

interface AlertState {
  queue: AlertRequest[];
  toast: ToastRequest | null;
  push: (request: AlertRequest) => void;
  dismiss: (id: number) => void;
  setToast: (toast: ToastRequest | null) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  queue: [],
  toast: null,
  push: (request) => set((s) => ({ queue: [...s.queue, request] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((a) => a.id !== id) })),
  setToast: (toast) => set({ toast }),
}));

let nextId = 1;

function inferKind(title: string, buttons: AlertButton[]): AlertKind {
  if (buttons.some((b) => b.style === 'destructive')) return 'warning';
  const t = title.toLowerCase();
  if (/(error|fail|unable|invalid|mismatch|could not|not serviceable|unavailable|expired)/.test(t)) return 'error';
  if (/(success|saved|added|sent|submitted|updated|done|confirmed|placed)/.test(t)) return 'success';
  if (/(required|missing|incomplete|confirm|sure|permission|empty)/.test(t)) return 'warning';
  return 'info';
}

/** In-app replacement for `Alert.alert` with the same argument order. */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options: AlertOptions = {},
): void {
  const list = buttons && buttons.length ? buttons : [{ text: 'OK' }];
  const hasCancel = list.some((b) => b.style === 'cancel');
  useAlertStore.getState().push({
    id: nextId++,
    title,
    message,
    buttons: list,
    kind: options.kind ?? inferKind(title, list),
    cancelable: options.cancelable ?? (hasCancel || list.length === 1),
  });
}

export function showToast(
  message: string,
  kind: AlertKind = 'success',
  options: { action?: ToastRequest['action']; duration?: number } = {},
): void {
  useAlertStore.getState().setToast({
    id: nextId++,
    message,
    kind,
    action: options.action,
    duration: options.duration ?? (options.action ? 4000 : 2500),
  });
}
