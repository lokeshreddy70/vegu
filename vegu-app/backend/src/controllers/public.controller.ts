import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { sendSuccess } from '../utils/response';

type PublicConfig = {
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
  maintenanceMode: boolean;
  servicePauseUntil: string;
  servicePauseReason: string;
  referralEnabled: boolean;
  referralRewardAmount: string;
  referralMinOrderValue: string;
  walletMaxUsagePercent: string;
};

const DEFAULTS: PublicConfig = {
  supportPhone: '+91-1800-8348-4357',
  supportWhatsApp: '+91-90000-00000',
  supportEmail: 'support@vegu.app',
  officeAddress: 'Vegu HQ, Nellore, Andhra Pradesh, India',
  supportHours: '9:00 AM - 9:00 PM, Monday to Sunday',
  emergencySupport: 'For urgent order issues, call support immediately.',
  aboutTitle: 'About Vegu',
  aboutDescription: 'Vegu is a quick-commerce grocery platform focused on fresh produce, reliable delivery, and transparent pricing.',
  contactTitle: 'Contact Vegu',
  contactDescription: 'Reach our support team for orders, payments, refunds, and account help.',
  paymentMethods: JSON.stringify([
    { id: 'COD', label: 'Cash on Delivery', enabled: true },
    { id: 'RAZORPAY', label: 'UPI / Cards / Net Banking', enabled: true },
    { id: 'WALLET', label: 'Vegu Wallet', enabled: true },
  ]),
  faqJson: JSON.stringify([
    { question: 'How fast is Vegu delivery?', answer: 'Most orders are delivered in about 30 minutes.' },
    { question: 'How do refunds work?', answer: 'Refunds are processed to original payment method in 3 to 5 business days.' },
    { question: 'Can I schedule delivery?', answer: 'Yes, slot-based delivery is available where supported.' },
  ]),
  privacyPolicy: [
    'VEGU Privacy Policy',
    '',
    'Effective Date: 2026-07-04',
    '',
    '1) Data We Collect',
    '- Account data: name, phone number, email, password hash, role, profile photo (if provided).',
    '- Order data: cart, order history, delivery address, notes, payment method, refunds, support tickets.',
    '- Location data: precise location only when you use current-location features, live delivery tracking, or rider duty actions.',
    '- Device/app data: app version, notification token, network/session diagnostics for reliability and fraud prevention.',
    '- Media data: rider delivery proof photos and optional user-uploaded images.',
    '',
    '2) Why We Use Data',
    '- To create and secure your account.',
    '- To process orders, deliveries, payments, refunds, and customer support.',
    '- To improve ETA, route quality, and delivery safety for customers and riders.',
    '- To send transactional notifications (order accepted, packed, out for delivery, delivered, cancelled, refund updates).',
    '- To prevent abuse, detect fraud, and maintain platform security.',
    '',
    '3) Permissions Used in App',
    '- Location: address autofill, rider tracking, route guidance.',
    '- Camera/Photos: rider proof-of-delivery and profile uploads.',
    '- Notifications: real-time order, rider, and system alerts.',
    '- Network: required for all app features and synchronization.',
    '',
    '4) Data Sharing',
    '- We share only minimum required data between customer, rider, vendor, and admin roles to complete services.',
    '- Payment processing is handled via configured payment providers.',
    '- We do not sell personal data.',
    '',
    '5) Data Retention and Security',
    '- Data is retained as needed for legal, accounting, dispute resolution, and service continuity.',
    '- Access is role-based and logged. Transport uses encrypted channels where supported.',
    '- Sensitive credentials/tokens are not exposed in public app responses.',
    '',
    '6) Your Controls',
    '- You can update profile details and addresses inside the app.',
    '- You can disable notifications from device settings.',
    '- You can revoke location/camera permissions any time from device settings.',
    '- You can request account/data support through VEGU support channels.',
    '',
    '7) Children and Safety',
    '- VEGU is intended for users legally eligible to use e-commerce and payment services in their region.',
    '',
    '8) Policy Updates',
    '- We may update this policy to reflect product, legal, or security changes. Updated policy is published in-app.',
    '',
    '9) Contact',
    '- For privacy queries: support@vegu.app',
  ].join('\n'),
  termsAndConditions: [
    'VEGU Terms and Conditions',
    '',
    'Effective Date: 2026-07-04',
    '',
    '1) Scope',
    '- These terms apply to all VEGU users including customers, riders, vendors, store staff, and admins.',
    '- By creating an account, placing orders, accepting deliveries, or operating store workflows, you agree to these terms.',
    '',
    '2) Accounts and Access',
    '- You must provide accurate and up-to-date account information.',
    '- You are responsible for account security and all activities under your account.',
    '- VEGU may suspend or restrict access for policy abuse, fraud, unsafe conduct, or legal non-compliance.',
    '',
    '3) Orders, Pricing, and Fulfilment',
    '- Product availability, pricing, and promotions can vary by store, location, and operational windows.',
    '- Orders follow operational stages (accepted, picking, packing, dispatch, delivery) and may be updated in real time.',
    '- Out-of-stock substitutions, partial fulfilment, or cancellations may occur with user notification where possible.',
    '',
    '4) Payments and Refunds',
    '- Payments may be processed through configured payment methods including COD and online rails.',
    '- Refund decisions follow VEGU refund and cancellation policies and may require quality/order verification.',
    '- Fraudulent chargebacks, repeated abuse, or payment manipulation may lead to account restrictions.',
    '',
    '5) Delivery and Rider Operations',
    '- Delivery ETAs are estimates and depend on weather, traffic, rider availability, and store load.',
    '- For trust and safety, delivery proof (OTP, photo proof, timestamp, geolocation) may be required for select orders.',
    '- Users must not request unsafe deliveries, bypass identity checks, or instruct riders to violate local laws.',
    '',
    '6) Customer Responsibilities',
    '- Provide accurate addresses, reachable phone number, and clear delivery instructions.',
    '- Be present during delivery windows or ensure authorized recipient availability.',
    '- Respect rider and support staff; abusive behavior can result in blocked service.',
    '',
    '7) Rider and Store Staff Responsibilities',
    '- Riders/staff must follow assigned workflows, safety checks, proof steps, and compliance guidelines.',
    '- Riders must maintain valid legal documents, vehicle compliance, and safe driving behavior.',
    '- Store operations must maintain order integrity, quality checks, and dispatch verification.',
    '',
    '8) Compliance and Prohibited Use',
    '- No misuse, scraping, reverse engineering, harassment, impersonation, or unlawful transactions.',
    '- No delivery of prohibited items where disallowed by law or platform policy.',
    '- VEGU may cooperate with lawful requests from competent authorities.',
    '',
    '9) Limitation and Service Changes',
    '- Service features, coverage, fees, or policies may change as the platform scales.',
    '- VEGU is not liable for indirect losses arising from force majeure or external service outages.',
    '',
    '10) Contact and Grievance',
    '- For legal, safety, or policy issues contact support@vegu.app.',
  ].join('\n'),
  riderSafetyPolicy: [
    'VEGU Rider Safety and Compliance Policy',
    '',
    'Effective Date: 2026-07-04',
    '',
    'This policy applies to all riders using VEGU delivery tools and is aligned with Play Store safety and compliance expectations for courier apps.',
    '',
    '1) Mandatory Safety Requirements',
    '- Riders must follow all traffic rules, helmet/vehicle safety requirements, and local transport regulations.',
    '- Distracted driving is prohibited. App interaction should only happen when safely stopped, except for voice-safe/navigation-safe use.',
    '- Alcohol/drug impairment during duty is strictly prohibited.',
    '',
    '2) Verification and Dispatch Controls',
    '- Riders must complete pickup and handoff verification steps including order scan/OTP/proof where enabled.',
    '- No order may be marked delivered without required proof steps.',
    '- Location spoofing, proof tampering, or fake completion attempts are policy violations.',
    '',
    '3) Customer and Community Safety',
    '- Harassment, discrimination, intimidation, or unsafe conduct toward customers/store staff is prohibited.',
    '- Riders should avoid unsafe handoff zones and follow escalation protocol for suspicious situations.',
    '',
    '4) Data and Device Compliance',
    '- Rider app may use location, camera, and notifications strictly for dispatch, navigation, and delivery proof workflows.',
    '- Riders must protect account access and never share login credentials.',
    '',
    '5) Incident Reporting and Enforcement',
    '- Safety incidents must be reported through VEGU support immediately.',
    '- Confirmed serious violations can lead to temporary suspension, permanent deactivation, and legal escalation where required.',
    '',
    '6) Continuous Compliance',
    '- Riders may be asked to re-verify documents, safety declarations, and operational eligibility periodically.',
  ].join('\n'),
  refundPolicy: 'Refunds are issued for cancelled, missing, or quality-failed items after verification. Processing time is typically 3 to 5 business days.',
  cancellationPolicy: 'Orders can be cancelled before packing starts. Once out for delivery, cancellation may be restricted as per operational policy.',
  shippingPolicy: 'Delivery windows depend on location, slot availability, and operational load. Charges and free-delivery thresholds are displayed at checkout.',
  maintenanceMode: false,
  servicePauseUntil: '',
  servicePauseReason: '',
  referralEnabled: true,
  referralRewardAmount: '50',
  referralMinOrderValue: '199',
  walletMaxUsagePercent: '30',
};

const getPublicConfig = async (): Promise<PublicConfig> => {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    supportPhone: map.get('supportPhone') ?? DEFAULTS.supportPhone,
    supportWhatsApp: map.get('supportWhatsApp') ?? DEFAULTS.supportWhatsApp,
    supportEmail: map.get('supportEmail') ?? DEFAULTS.supportEmail,
    officeAddress: map.get('officeAddress') ?? DEFAULTS.officeAddress,
    supportHours: map.get('supportHours') ?? DEFAULTS.supportHours,
    emergencySupport: map.get('emergencySupport') ?? DEFAULTS.emergencySupport,
    aboutTitle: map.get('aboutTitle') ?? DEFAULTS.aboutTitle,
    aboutDescription: map.get('aboutDescription') ?? DEFAULTS.aboutDescription,
    contactTitle: map.get('contactTitle') ?? DEFAULTS.contactTitle,
    contactDescription: map.get('contactDescription') ?? DEFAULTS.contactDescription,
    paymentMethods: map.get('paymentMethods') ?? DEFAULTS.paymentMethods,
    faqJson: map.get('faqJson') ?? DEFAULTS.faqJson,
    privacyPolicy: map.get('privacyPolicy') ?? DEFAULTS.privacyPolicy,
    termsAndConditions: map.get('termsAndConditions') ?? DEFAULTS.termsAndConditions,
    riderSafetyPolicy: map.get('riderSafetyPolicy') ?? DEFAULTS.riderSafetyPolicy,
    refundPolicy: map.get('refundPolicy') ?? DEFAULTS.refundPolicy,
    cancellationPolicy: map.get('cancellationPolicy') ?? DEFAULTS.cancellationPolicy,
    shippingPolicy: map.get('shippingPolicy') ?? DEFAULTS.shippingPolicy,
    maintenanceMode: (map.get('maintenanceMode') ?? String(DEFAULTS.maintenanceMode)) === 'true',
    servicePauseUntil: map.get('servicePauseUntil') ?? DEFAULTS.servicePauseUntil,
    servicePauseReason: map.get('servicePauseReason') ?? DEFAULTS.servicePauseReason,
    referralEnabled: (map.get('referralEnabled') ?? String(DEFAULTS.referralEnabled)) === 'true',
    referralRewardAmount: map.get('referralRewardAmount') ?? DEFAULTS.referralRewardAmount,
    referralMinOrderValue: map.get('referralMinOrderValue') ?? DEFAULTS.referralMinOrderValue,
    walletMaxUsagePercent: map.get('walletMaxUsagePercent') ?? DEFAULTS.walletMaxUsagePercent,
  };
};

export const getPublicAppConfig = async (_req: Request, res: Response): Promise<void> => {
  const data = await getPublicConfig();
  sendSuccess(res, data);
};

export const getPublicPage = async (req: Request, res: Response): Promise<void> => {
  const slug = (req.params.slug || '').toLowerCase();
  const data = await getPublicConfig();

  const pages: Record<string, { title: string; content: string }> = {
    privacy: { title: 'Privacy Policy', content: data.privacyPolicy },
    terms: { title: 'Terms & Conditions', content: data.termsAndConditions },
    'rider-safety': { title: 'Rider Safety & Compliance', content: data.riderSafetyPolicy },
    refund: { title: 'Refund Policy', content: data.refundPolicy },
    cancellation: { title: 'Cancellation Policy', content: data.cancellationPolicy },
    shipping: { title: 'Shipping Policy', content: data.shippingPolicy },
    about: { title: data.aboutTitle, content: data.aboutDescription },
    contact: {
      title: data.contactTitle,
      content: `${data.contactDescription}\n\nPhone: ${data.supportPhone}\nWhatsApp: ${data.supportWhatsApp}\nEmail: ${data.supportEmail}\nOffice: ${data.officeAddress}\nHours: ${data.supportHours}`,
    },
  };

  const page = pages[slug] ?? null;
  if (!page) {
    sendSuccess(res, null);
    return;
  }

  sendSuccess(res, page);
};