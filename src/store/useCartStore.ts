import { create } from 'zustand';
import * as cartApi from '../api/cart';
import { getRetailPrice } from '../api/catalog';
import { ApiError } from '../api/client';
import type { Cart, Product } from '../api/types';

export interface CartLine {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  unitMrp: number;
  lineTotal: number;
  lineMrp: number;
}

export interface CartTotals {
  itemCount: number;
  totalMrp: number;
  subtotal: number;
  savings: number;
}

interface CartState {
  lines: CartLine[];
  totals: CartTotals;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  pendingProductId: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  reset: () => void;
}

const EMPTY_TOTALS: CartTotals = { itemCount: 0, totalMrp: 0, subtotal: 0, savings: 0 };

function toLines(cart: Cart | null | undefined): CartLine[] {
  return (cart?.items ?? [])
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product as Product;
      const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
      const { base, mrp } = getRetailPrice(product);
      const unitMrp = Math.max(mrp, base);
      return {
        productId: item.productId,
        product,
        quantity,
        unitPrice: base,
        unitMrp,
        lineTotal: base * quantity,
        lineMrp: unitMrp * quantity,
      };
    });
}

function totalsOf(lines: CartLine[]): CartTotals {
  const totalMrp = lines.reduce((sum, l) => sum + l.lineMrp, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return {
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    totalMrp,
    subtotal,
    savings: Math.max(0, totalMrp - subtotal),
  };
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) return 'Please log in to use your cart.';
    return error.message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export const useCartStore = create<CartState>((set, get) => {
  const applyCart = (cart: Cart | null | undefined) => {
    const lines = toLines(cart);
    set({ lines, totals: totalsOf(lines), loaded: true, error: null });
  };

  return {
    lines: [],
    totals: EMPTY_TOTALS,
    loading: false,
    loaded: false,
    error: null,
    pendingProductId: null,

    fetchCart: async () => {
      set({ loading: true });
      try {
        applyCart(await cartApi.getCart());
      } catch (e) {
        set({ error: messageOf(e, 'Could not load your cart.'), loaded: true });
      } finally {
        set({ loading: false });
      }
    },

    addItem: async (productId, quantity = 1) => {
      set({ pendingProductId: productId });
      try {
        applyCart(await cartApi.addToCart({ productId, quantity }));
      } catch (e) {
        throw new Error(messageOf(e, 'Could not add this item to your cart.'));
      } finally {
        set({ pendingProductId: null });
      }
    },

    setQuantity: async (productId, quantity) => {
      const previous = get().lines;
      const optimistic = previous
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity, lineTotal: l.unitPrice * quantity, lineMrp: l.unitMrp * quantity }
            : l,
        )
        .filter((l) => l.quantity > 0);
      set({ lines: optimistic, totals: totalsOf(optimistic), pendingProductId: productId });
      try {
        applyCart(await cartApi.updateCartItem(productId, { quantity }));
      } catch (e) {
        set({ lines: previous, totals: totalsOf(previous) });
        throw new Error(messageOf(e, 'Could not update the quantity.'));
      } finally {
        set({ pendingProductId: null });
      }
    },

    removeItem: async (productId) => {
      const previous = get().lines;
      const remaining = previous.filter((l) => l.productId !== productId);
      set({ lines: remaining, totals: totalsOf(remaining), pendingProductId: productId });
      try {
        applyCart(await cartApi.removeCartItem(productId));
      } catch (e) {
        set({ lines: previous, totals: totalsOf(previous) });
        throw new Error(messageOf(e, 'Could not remove this item.'));
      } finally {
        set({ pendingProductId: null });
      }
    },

    clear: async () => {
      try {
        await cartApi.clearCart();
      } finally {
        set({ lines: [], totals: EMPTY_TOTALS });
      }
    },

    reset: () => set({ lines: [], totals: EMPTY_TOTALS, loaded: false, error: null }),
  };
});
