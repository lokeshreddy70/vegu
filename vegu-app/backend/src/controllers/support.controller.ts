import { Response } from 'express';
import { SupportSenderRole, SupportTicketCategory, SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import { z } from 'zod';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../types';

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).optional(),
});

const createTicketSchema = z.object({
  title: z.string().min(2).max(160),
  summary: z.string().min(2).max(4000),
  category: z.nativeEnum(SupportTicketCategory).default(SupportTicketCategory.GENERAL),
  priority: z.nativeEnum(SupportTicketPriority).default(SupportTicketPriority.MEDIUM),
  orderId: z.string().optional(),
  requestedAction: z.string().optional(),
});

const ticketReplySchema = z.object({
  body: z.string().min(1).max(4000),
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

const buildSystemPrompt = (settings: SupportSettings, context: string): string => `You are Vegu Support, a friendly AI assistant for the Vegu grocery delivery app. Vegu is a quick-commerce platform that delivers fresh groceries, fruits, vegetables, dairy, and household essentials within 30 minutes.

You help customers with:
- Order tracking and status questions
- Delivery issues and complaints
- Product availability and pricing
- Returns and refunds policy
- Account and payment issues
- App navigation help
- Promotions and coupons
- Rider and delivery escalation
- Support ticket triage and operations handoff

Vegu policies:
- Free delivery on orders above ₹500; ₹40 delivery fee otherwise
- 5% discount on orders above ₹1000
- Cancellations allowed only for PENDING and CONFIRMED orders
- Refunds processed within 3-5 business days
- 30-minute delivery guarantee in serviceable areas

Context you already know:
${context}

Keep responses concise, friendly, and helpful. Use simple language. If you cannot resolve an issue, say so clearly and recommend escalation. Never invent order facts.`;

const determineCategory = (message: string): SupportTicketCategory => {
  if (/refund|return|replace/i.test(message)) return SupportTicketCategory.REFUND;
  if (/late|delivery|rider|eta|address|missing|damaged|wrong item/i.test(message)) return SupportTicketCategory.DELIVERY;
  if (/order|cancel/i.test(message)) return SupportTicketCategory.ORDER;
  if (/payment|paid|upi|wallet|card/i.test(message)) return SupportTicketCategory.PAYMENT;
  if (/login|otp|profile|account|password/i.test(message)) return SupportTicketCategory.ACCOUNT;
  if (/inventory|stock|store/i.test(message)) return SupportTicketCategory.STORE_OPERATIONS;
  return SupportTicketCategory.GENERAL;
};

const determinePriority = (message: string, orderStatus?: string): SupportTicketPriority => {
  if (/urgent|asap|immediately|emergency/i.test(message)) return SupportTicketPriority.URGENT;
  if (/damaged|wrong item|missing item|failed payment|refund/i.test(message)) return SupportTicketPriority.HIGH;
  if (orderStatus === 'OUT_FOR_DELIVERY' && /late|delay/i.test(message)) return SupportTicketPriority.HIGH;
  if (/cancel|address|delivery|rider/i.test(message)) return SupportTicketPriority.MEDIUM;
  return SupportTicketPriority.LOW;
};

const shouldEscalate = (message: string): boolean => /refund|return|replace|damaged|wrong item|missing item|human|talk to human|agent|complaint|failed payment/i.test(message);

const buildActions = (category: SupportTicketCategory, orderId?: string, hasRider?: boolean) => {
  const common = [
    { type: 'human', label: 'Talk To Human' },
    { type: 'call', label: 'Call Support', value: 'tel:+91180083484357' },
  ];

  if (!orderId) return common;

  const orderActions = [
    { type: 'track', label: 'Track Order', value: `/orders/${orderId}` },
    { type: 'invoice', label: 'View Invoice', value: `/orders/${orderId}` },
    { type: 'change-address', label: 'Change Address', value: '/account/addresses' },
  ];

  if (category === SupportTicketCategory.ORDER || category === SupportTicketCategory.DELIVERY) {
    orderActions.push({ type: 'cancel', label: 'Cancel Order', value: orderId });
  }
  if (category === SupportTicketCategory.REFUND || category === SupportTicketCategory.PAYMENT || category === SupportTicketCategory.DELIVERY) {
    orderActions.push({ type: 'refund', label: 'Request Refund', value: orderId });
  }
  if (hasRider) {
    orderActions.push({ type: 'contact-rider', label: 'Contact Rider', value: orderId });
  }

  return [...orderActions, ...common];
};

const formatOrderContext = (order: Awaited<ReturnType<typeof getRelevantOrder>> extends infer T ? T : never) => {
  if (!order) return 'No relevant order found.';
  return [
    `Order ${order.orderNumber}`,
    `status=${order.status}`,
    `paymentStatus=${order.paymentStatus}`,
    `paymentMethod=${order.paymentMethod}`,
    `total=${order.total}`,
    order.vendor?.storeName ? `store=${order.vendor.storeName}` : 'store=unassigned',
    order.deliveryPartner?.user?.name ? `rider=${order.deliveryPartner.user.name}` : 'rider=not-assigned',
    order.estimatedDelivery ? `eta=${order.estimatedDelivery.toISOString()}` : 'eta=unknown',
  ].join('\n');
};

const getRelevantOrder = async (userId?: string, explicitOrderId?: string) => {
  if (!userId) return null;

  if (explicitOrderId) {
    return prisma.order.findFirst({
      where: { id: explicitOrderId, userId },
      include: {
        vendor: { select: { storeName: true } },
        deliveryPartner: { include: { user: { select: { name: true, phone: true } } } },
        address: true,
        items: { select: { quantity: true, name: true, image: true, total: true } },
      },
    });
  }

  return prisma.order.findFirst({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      vendor: { select: { storeName: true } },
      deliveryPartner: { include: { user: { select: { name: true, phone: true } } } },
      address: true,
      items: { select: { quantity: true, name: true, image: true, total: true } },
    },
  });
};

const ensureTicket = async (params: {
  userId?: string;
  orderId?: string;
  title: string;
  summary: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  sourceRole: SupportSenderRole;
  requestedAction?: string;
  userMessage: string;
  aiReply: string;
}) => {
  const existing = params.userId
    ? await prisma.supportTicket.findFirst({
        where: {
          userId: params.userId,
          orderId: params.orderId,
          category: params.category,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] },
        },
        orderBy: { updatedAt: 'desc' },
      })
    : null;

  if (existing) {
    return prisma.supportTicket.update({
      where: { id: existing.id },
      data: {
        priority: params.priority,
        requestedAction: params.requestedAction,
        lastMessagePreview: params.userMessage,
        aiSuggestedReply: params.aiReply,
        messages: {
          create: [
            { senderId: params.userId, senderRole: params.sourceRole, body: params.userMessage },
            { senderRole: SupportSenderRole.AI, body: params.aiReply },
          ],
        },
      },
    });
  }

  return prisma.supportTicket.create({
    data: {
      userId: params.userId,
      orderId: params.orderId,
      title: params.title,
      summary: params.summary,
      category: params.category,
      priority: params.priority,
      sourceRole: params.sourceRole,
      requestedAction: params.requestedAction,
      lastMessagePreview: params.userMessage,
      aiSuggestedReply: params.aiReply,
      messages: {
        create: [
          { senderId: params.userId, senderRole: params.sourceRole, body: params.userMessage },
          { senderRole: SupportSenderRole.AI, body: params.aiReply },
        ],
      },
    },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
    },
  });
};

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

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid request', 400, parsed.error.flatten());
    return;
  }

  const { message, history = [] } = parsed.data;
  const supportSettings = await getSupportSettings();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const category = determineCategory(message);
  const order = await getRelevantOrder(req.user?.userId);
  const priority = determinePriority(message, order?.status);
  const actionButtons = buildActions(category, order?.id, !!order?.deliveryPartner?.user?.phone);

  if (req.user?.userId && order && /late|where.*order|track|rider|eta|delivery/i.test(message)) {
    const reply = [
      `I checked your order **#${order.orderNumber}**.`,
      `Status: **${order.status.replace(/_/g, ' ')}**.`,
      order.deliveryPartner?.user?.name
        ? `Your rider is **${order.deliveryPartner.user.name}**${order.deliveryPartner.user.phone ? ` (${order.deliveryPartner.user.phone})` : ''}.`
        : 'A rider has not been assigned yet.',
      order.estimatedDelivery ? `Estimated delivery: **${new Date(order.estimatedDelivery).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}**.` : 'Estimated delivery is being updated.',
      order.vendor?.storeName ? `Store: **${order.vendor.storeName}**.` : null,
    ].filter(Boolean).join(' ');

    sendSuccess(res, {
      reply,
      source: 'ai',
      category,
      priority,
      actions: actionButtons,
      orderCard: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        riderName: order.deliveryPartner?.user?.name,
        riderPhone: order.deliveryPartner?.user?.phone,
        storeName: order.vendor?.storeName,
        eta: order.estimatedDelivery,
      },
    });
    return;
  }

  // If no API key, use built-in FAQ system
  if (!apiKey) {
    const answer = getFAQResponse(message, supportSettings);
    const ticket = shouldEscalate(message)
      ? await ensureTicket({
          userId: req.user?.userId,
          orderId: order?.id,
          title: `${category.replace(/_/g, ' ')} support request`,
          summary: message,
          category,
          priority,
          sourceRole: req.user?.role === 'DELIVERY' ? SupportSenderRole.RIDER : SupportSenderRole.CUSTOMER,
          requestedAction: actionButtons[0]?.type,
          userMessage: message,
          aiReply: answer,
        })
      : null;
    sendSuccess(res, { reply: answer, source: 'faq', category, priority, actions: actionButtons, ticket });
    return;
  }

  try {
    const context = [
      req.user ? `User email=${req.user.email} role=${req.user.role}` : 'Anonymous user',
      formatOrderContext(order),
    ].join('\n');

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
        system: buildSystemPrompt(supportSettings, context),
        messages: [
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const answer = getFAQResponse(message, supportSettings);
      sendSuccess(res, { reply: answer, source: 'faq', category, priority, actions: actionButtons });
      return;
    }

    const data = await response.json() as { content: { type: string; text: string }[] };
    const reply = data.content?.find(b => b.type === 'text')?.text || getFAQResponse(message, supportSettings);
    const ticket = shouldEscalate(message)
      ? await ensureTicket({
          userId: req.user?.userId,
          orderId: order?.id,
          title: `${category.replace(/_/g, ' ')} support request`,
          summary: message,
          category,
          priority,
          sourceRole: req.user?.role === 'DELIVERY' ? SupportSenderRole.RIDER : SupportSenderRole.CUSTOMER,
          requestedAction: actionButtons[0]?.type,
          userMessage: message,
          aiReply: reply,
        })
      : null;

    sendSuccess(res, {
      reply,
      source: 'ai',
      category,
      priority,
      actions: actionButtons,
      ticket,
      orderCard: order ? {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        riderName: order.deliveryPartner?.user?.name,
        riderPhone: order.deliveryPartner?.user?.phone,
        storeName: order.vendor?.storeName,
        eta: order.estimatedDelivery,
      } : null,
    });
  } catch {
    const answer = getFAQResponse(message, supportSettings);
    sendSuccess(res, { reply: answer, source: 'faq', category, priority, actions: actionButtons });
  }
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid support ticket', 400, parsed.error.flatten());
    return;
  }

  const data = parsed.data;
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user!.userId,
      orderId: data.orderId,
      title: data.title,
      summary: data.summary,
      category: data.category,
      priority: data.priority,
      requestedAction: data.requestedAction,
      sourceRole: req.user!.role === 'DELIVERY' ? SupportSenderRole.RIDER : SupportSenderRole.CUSTOMER,
      lastMessagePreview: data.summary,
      messages: {
        create: {
          senderId: req.user!.userId,
          senderRole: req.user!.role === 'DELIVERY' ? SupportSenderRole.RIDER : SupportSenderRole.CUSTOMER,
          body: data.summary,
        },
      },
    },
  });

  sendSuccess(res, ticket, 'Support ticket created');
};

export const getMyTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      order: { select: { id: true, orderNumber: true, status: true, total: true } },
      _count: { select: { messages: true } },
    },
    take: 30,
  });

  sendSuccess(res, tickets);
};

export const getTicketDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: {
      order: {
        include: {
          vendor: { select: { storeName: true } },
          deliveryPartner: { include: { user: { select: { name: true, phone: true } } } },
          address: true,
          items: { select: { name: true, quantity: true, total: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!ticket) {
    sendError(res, 'Support ticket not found', 404);
    return;
  }

  sendSuccess(res, ticket);
};

export const replyToTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = ticketReplySchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid reply', 400, parsed.error.flatten());
    return;
  }

  const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!ticket) {
    sendError(res, 'Support ticket not found', 404);
    return;
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: 'OPEN',
      lastMessagePreview: parsed.data.body,
      messages: {
        create: {
          senderId: req.user!.userId,
          senderRole: req.user!.role === 'DELIVERY' ? SupportSenderRole.RIDER : SupportSenderRole.CUSTOMER,
          body: parsed.data.body,
        },
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  sendSuccess(res, updated, 'Reply sent');
};
