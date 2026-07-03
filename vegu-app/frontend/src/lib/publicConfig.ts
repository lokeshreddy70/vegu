import api from '@/lib/api';

export type PaymentMethodConfig = {
  id: string;
  label: string;
  enabled: boolean;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type PublicConfig = {
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  officeAddress: string;
  supportHours: string;
  emergencySupport: string;
  aboutTitle: string;
  aboutDescription: string;
  contactTitle: string;
  contactDescription: string;
  paymentMethods: string;
  faqJson: string;
  privacyPolicy: string;
  termsAndConditions: string;
  riderSafetyPolicy: string;
  refundPolicy: string;
  cancellationPolicy: string;
  shippingPolicy: string;
};

export async function getPublicConfig(): Promise<PublicConfig> {
  const res = await api.get('/api/public/config');
  return res.data.data;
}

export function parsePaymentMethods(value: string): PaymentMethodConfig[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}

export function parseFaq(value: string): FaqItem[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean);
  } catch {
    return [];
  }
}
