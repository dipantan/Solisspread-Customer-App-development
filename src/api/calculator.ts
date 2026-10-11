import { api } from './client';
import type { CalculateSolarPayload, SolarEstimate } from './types';

export async function estimateSolar(payload: CalculateSolarPayload): Promise<SolarEstimate> {
  return api.post<SolarEstimate>('/calculator/estimate', payload, { auth: false });
}
