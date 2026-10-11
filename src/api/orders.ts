import { api } from './client';
import type {
  CreateOrderPayload,
  InitiatePaymentResult,
  Order,
  OrderStatus,
  OrderTracking,
} from './types';

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return api.post<Order>('/ecom/orders', payload);
}

export async function listOrders(): Promise<Order[]> {
  const data = await api.get<Order[] | { items?: Order[] }>('/ecom/orders', {
    query: { limit: 50 },
  });
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/ecom/orders/${id}`);
}

export async function getOrderTracking(id: string): Promise<OrderTracking> {
  return api.get<OrderTracking>(`/ecom/orders/${id}/tracking`);
}

export async function initiatePayment(payload: {
  orderId: string;
  gateway: 'RAZORPAY' | 'CASH_WALLET' | 'COD' | 'BANK_TRANSFER';
}): Promise<InitiatePaymentResult> {
  return api.post<InitiatePaymentResult>('/payments/initiate', payload);
}

export async function verifyPayment(payload: {
  orderId: string;
  gatewayTxId: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
}): Promise<unknown> {
  return api.post('/payments/verify', payload);
}

export function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Customer-facing three-stage status: Pending → Confirmed → Delivered. */
export function simpleStatus(status: OrderStatus): {
  label: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
  step: 0 | 1 | 2;
} {
  switch (status) {
    case 'CONFIRMED':
    case 'PROCESSING':
    case 'DISPATCHED':
      return { label: 'Confirmed', step: 1 };
    case 'DELIVERED':
      return { label: 'Delivered', step: 2 };
    case 'CANCELLED':
    case 'REFUNDED':
      return { label: 'Cancelled', step: 0 };
    default:
      return { label: 'Pending', step: 0 };
  }
}

export function paymentLabel(order: Order): string {
  const tx = order.transactions?.[order.transactions.length - 1];
  if (!tx) return 'Payment pending';
  if (tx.gateway === 'COD') return 'Cash on Delivery';
  if (tx.status === 'SUCCESS') return 'Paid online';
  if (tx.status === 'FAILED') return 'Payment failed';
  return 'Online payment pending';
}

export function formatOrderDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
