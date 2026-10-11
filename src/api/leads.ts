import { api } from './client';

/** Public lead submission — same contract the customer web app uses. */
export async function createLead(payload: {
  fullName: string;
  phone: string;
  email?: string;
  state?: string;
  city?: string;
  pinCode?: string;
  notes?: string;
  source?: 'SOLAR_CALCULATOR' | 'WEBSITE_FORM' | 'REFERRAL' | 'DEALER_PORTAL' | 'DIRECT_WALKIN';
}): Promise<unknown> {
  return api.post('/crm/leads', payload);
}
