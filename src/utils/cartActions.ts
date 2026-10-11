import { useCartStore } from '../store/useCartStore';
import { showAlert, showToast } from '../store/useAlertStore';

export async function quickAddToCart(
  productId: string | undefined,
  name: string | undefined,
  onNavigate?: (step: any, params?: any) => void,
): Promise<void> {
  if (!productId) {
    showAlert('Unavailable', 'This product is not available right now.');
    return;
  }
  try {
    await useCartStore.getState().addItem(productId, 1);
    showToast(`${name ?? 'Item'} added to cart`, 'success', {
      action: onNavigate ? { label: 'View cart', onPress: () => onNavigate('cart') } : undefined,
    });
  } catch (e: any) {
    showAlert('Could not add to cart', e?.message || 'Could not add this item to your cart.');
  }
}
