import { Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../prisma/client';

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).optional(),
});

type SupportSettings = {
  supportPhone: string;
  supportEmail: string;
  supportHours: string;
};

const DEFAULT_SUPPORT: SupportSettings = {
  supportPhone: '+91-1800-8348-4357',
  supportEmail: 'support@vegu.app',
  supportHours: '9 AM to 9 PM daily',
};

const getSupportSettings = async (): Promise<SupportSettings> => {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['supportPhone', 'supportEmail', 'supportHours'] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    supportPhone: map.get('supportPhone') || DEFAULT_SUPPORT.supportPhone,
    supportEmail: map.get('supportEmail') || DEFAULT_SUPPORT.supportEmail,
    supportHours: map.get('supportHours') || DEFAULT_SUPPORT.supportHours,
  };
};

const buildSystemPrompt = (settings: SupportSettings): string => `You are Vegu Support, a friendly AI assistant for the Vegu grocery delivery app. Vegu is a quick-commerce platform that delivers fresh groceries, fruits, vegetables, dairy, and household essentials within 30 minutes.

You help customers with:
- Order tracking and status questions
- Delivery issues and complaints
- Product availability and pricing
- Returns and refunds policy
- Account and payment issues
- App navigation help
- Promotions and coupons

Vegu policies:
- Free delivery on orders above ₹500; ₹40 delivery fee otherwise
- 5% discount on orders above ₹1000
- Cancellations allowed only for PENDING and CONFIRMED orders
- Refunds processed within 3-5 business days
- 30-minute delivery guarantee in serviceable areas

Keep responses concise, friendly, and helpful. Use simple language. If you cannot resolve an issue, direct the user to email ${settings.supportEmail} or call ${settings.supportPhone}.`;

function getFAQResponse(message: string, settings: SupportSettings): string {
  const faqResponses: { pattern: RegExp; answer: string }[] = [
    { pattern: /track|where.*order|order.*status/i, answer: 'You can track your order in real-time from **My Orders** → tap your order → see the live tracking stepper. Orders typically arrive within 30 minutes of confirmation.' },
    { pattern: /cancel/i, answer: 'You can cancel orders that are in **Pending** or **Confirmed** status. Go to My Orders → tap the order → scroll down → "Cancel Order". Orders that are already being prepared cannot be cancelled.' },
    { pattern: /refund/i, answer: 'Refunds for cancelled or returned orders are processed within **3–5 business days** back to your original payment method. For COD orders, the refund is credited as wallet points.' },
    { pattern: /delivery.*fee|free.*delivery|shipping/i, answer: 'Delivery is **FREE** on orders above ₹500. A flat ₹40 delivery fee applies to orders below ₹500. Add more items to get free delivery.' },
    { pattern: /coupon|promo|discount|offer/i, answer: 'You can apply promo codes at checkout under the Order Summary section. We also offer **5% off** automatically on all orders above ₹1000. Check the Deals tab for current offers.' },
    { pattern: /payment|pay/i, answer: 'We accept **Cash on Delivery (COD)** and **Online Payments** (UPI, cards, net banking via Razorpay). You can select your preferred method at checkout.' },
    { pattern: /account|login|password|sign/i, answer: `For account issues, ensure your credentials are correct. If you forgot your password, use reset on login. For help, email ${settings.supportEmail}.` },
    { pattern: /hello|hi|hey|help/i, answer: 'Hi there! I\'m Vegu Support. How can I help you today? You can ask about orders, delivery, refunds, or payments.' },
  ];

  for (const faq of faqResponses) {
    if (faq.pattern.test(message)) return faq.answer;
  }
  return `I\'m not sure about that. For detailed support, please email **${settings.supportEmail}** or call **${settings.supportPhone}**. Our team is available ${settings.supportHours}.`;
}

export const chat = async (req: Request, res: Response): Promise<void> => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid request', 400, parsed.error.flatten());
    return;
  }

  const { message, history = [] } = parsed.data;
  const supportSettings = await getSupportSettings();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key, use built-in FAQ system
  if (!apiKey) {
    const answer = getFAQResponse(message, supportSettings);
    sendSuccess(res, { reply: answer, source: 'faq' });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: buildSystemPrompt(supportSettings),
        messages: [
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const answer = getFAQResponse(message, supportSettings);
      sendSuccess(res, { reply: answer, source: 'faq' });
      return;
    }

    const data = await response.json() as { content: { type: string; text: string }[] };
    const reply = data.content?.find(b => b.type === 'text')?.text || getFAQResponse(message, supportSettings);
    sendSuccess(res, { reply, source: 'ai' });
  } catch {
    const answer = getFAQResponse(message, supportSettings);
    sendSuccess(res, { reply: answer, source: 'faq' });
  }
};
