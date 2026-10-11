import { api } from './client';
import type {
  AmcContract,
  AmcPlan,
  CreateDocketPayload,
  Docket,
  RequestAmcPayload,
} from './types';

export async function listAmcPlans(): Promise<AmcPlan[]> {
  const data = await api.get<AmcPlan[] | { items?: AmcPlan[] }>('/service/amc/plans', {
    auth: false,
  });
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function listMyAmcPlans(): Promise<AmcContract[]> {
  const data = await api.get<AmcContract[] | { items?: AmcContract[] }>('/service/amc/my-plans');
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function requestAmc(payload: RequestAmcPayload): Promise<unknown> {
  return api.post('/service/amc/request', payload);
}

export async function listDockets(): Promise<Docket[]> {
  const data = await api.get<Docket[] | { items?: Docket[] }>('/service/dockets');
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function createDocket(payload: CreateDocketPayload): Promise<Docket> {
  return api.post<Docket>('/service/dockets', payload);
}

export async function getDocket(id: string): Promise<Docket> {
  return api.get<Docket>(`/service/dockets/${id}`);
}
