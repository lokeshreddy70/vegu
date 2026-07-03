import { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { config } from '../config';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

type CacheEntry = { text: string; expiresAt: number };
const KITCHEN_CACHE_TTL_MS = 5 * 60 * 1000;
const KITCHEN_CACHE_MAX = 200;
const kitchenCache = new Map<string, CacheEntry>();

function buildCacheKey(userId: string | undefined, messages: Array<{ role: 'user' | 'assistant'; content: string }>): string {
  const scope = userId || 'guest';
  const payload = messages.map((m) => `${m.role}:${m.content}`).join('|').slice(-6000);
  return `${scope}:${payload}`;
}

function getCached(key: string): string | null {
  const hit = kitchenCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    kitchenCache.delete(key);
    return null;
  }
  return hit.text;
}

function setCached(key: string, text: string): void {
  kitchenCache.set(key, { text, expiresAt: Date.now() + KITCHEN_CACHE_TTL_MS });
  if (kitchenCache.size <= KITCHEN_CACHE_MAX) return;
  const oldest = kitchenCache.keys().next().value;
  if (oldest) kitchenCache.delete(oldest);
}

const SYSTEM_PROMPT = `You are VEGU's AI Kitchen Assistant — a smart, friendly culinary companion.

You help users:
- Find recipes based on available ingredients
- Plan meals for the week
- Suggest healthy alternatives
- Estimate ingredient quantities and costs
- Give step-by-step cooking guidance

VEGU is an instant grocery delivery app (10-minute delivery).

Response format rules:
1. Keep responses concise and conversational.
2. When you suggest a recipe or meal that requires ingredients, ALWAYS end your response with a structured ingredient block in this exact format:
<ingredients>
[{"name":"Tomatoes","qty":"3 pcs","searchQuery":"tomato"},{"name":"Onion","qty":"2 pcs","searchQuery":"onion"}]
</ingredients>
3. Each ingredient must have: name (display name), qty (amount needed), searchQuery (single word/phrase to search in store).
4. If no ingredients are needed (e.g., general advice), do NOT include the <ingredients> block.
5. Be warm, encouraging, and practical. Always mention that ingredients can be ordered from VEGU in 10 minutes.`;

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })).min(1).max(20),
});

export const kitchenChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid request', 400, parsed.error.flatten());
    return;
  }

  if (!config.gemini.apiKey) {
    sendError(res, 'AI Kitchen is not configured', 503);
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const cacheKey = buildCacheKey(req.user?.userId, parsed.data.messages);
  const cached = getCached(cacheKey);
  if (cached) {
    res.write(`data: ${JSON.stringify({ text: cached })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = parsed.data.messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = parsed.data.messages[parsed.data.messages.length - 1].content;

    const chat = model.startChat({ history });
    const stream = await chat.sendMessageStream(lastMessage);
    let fullText = '';

    for await (const chunk of stream.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    if (fullText.trim()) {
      setCached(cacheKey, fullText);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`);
    res.end();
    logger.error('Kitchen AI error', { error: err });
  }
};
