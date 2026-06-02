/**
 * Anthropic Claude helpers used by /api/ai/* routes.
 *
 * Everything here is server-only. The route handlers MUST verify the
 * caller owns the brand they're querying about before calling these —
 * `lib/ai.ts` itself trusts its inputs.
 *
 * If ANTHROPIC_API_KEY isn't set, the functions throw `AiNotConfigured`
 * so routes can return a friendly 503 + the UI can show "connect AI"
 * instead of crashing.
 */

export class AiNotConfigured extends Error {
  constructor() {
    super('Anthropic API key not configured');
    this.name = 'AiNotConfigured';
  }
}

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

async function callClaude(prompt: string, system: string, maxTokens = 512): Promise<string> {
  if (!isAiConfigured()) throw new AiNotConfigured();
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = resp.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();
  return text;
}

export async function generateMenuDescription(
  itemName: string,
  details: string,
  brandVoice?: string,
): Promise<string> {
  const system = [
    'You write short, mouth-watering menu item descriptions for a restaurant discovery app.',
    'Tone: warm, specific, sensory. Avoid clichés like "tantalizing", "delectable", "explosion of flavor".',
    'Keep it under 30 words. One or two sentences max. Plain text, no markdown.',
    brandVoice ? `Brand voice context: ${brandVoice}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const prompt = `Item name: ${itemName}\nAdditional details: ${details || '(none)'}\n\nWrite the description.`;
  return await callClaude(prompt, system, 200);
}

export async function suggestReviewReply(
  reviewText: string,
  rating: number,
  tone: 'warm' | 'professional' | 'apologetic' | 'grateful',
  reviewerName?: string,
): Promise<string> {
  const toneGuide: Record<typeof tone, string> = {
    warm: 'warm and personable — like a chef-owner who genuinely cares',
    professional: 'professional and concise — appropriate for a chain or corporate brand',
    apologetic: 'humble and apologetic — owns the mistake without being defensive',
    grateful: 'sincerely grateful — focuses on appreciation',
  } as any;
  const system = [
    'You draft replies from a restaurant owner to customer reviews.',
    'Rules: never argue, never offer specific discounts without owner approval, never reveal staff names, sign with the owner role not a person.',
    `Tone: ${toneGuide[tone]}.`,
    'Keep it 2-3 sentences. Plain text, no markdown.',
  ].join('\n');
  const prompt = `Review (${rating}/5 stars${reviewerName ? ` from ${reviewerName}` : ''}):\n"${reviewText}"\n\nDraft the reply.`;
  return await callClaude(prompt, system, 300);
}

export type HealthRecommendation = {
  id: string;
  severity: 'low' | 'medium' | 'high';
  category: 'menu' | 'photos' | 'reviews' | 'hours' | 'profile' | 'kosher';
  title: string;
  description: string;
  fix_href?: string;
  fix_label?: string;
};

export async function analyzeListingHealth(input: {
  brandSummary: string;
  locationsSummary: string;
  menuSummary: string;
  reviewSummary: string;
}): Promise<HealthRecommendation[]> {
  const system = [
    'You audit restaurant listings on a discovery app and surface concrete, actionable improvements.',
    'Output STRICT JSON: an array of objects with these fields:',
    '{id: string, severity: "low"|"medium"|"high", category: "menu"|"photos"|"reviews"|"hours"|"profile"|"kosher", title: string, description: string}.',
    'No prose, no markdown fences. Just the JSON array.',
    'Be specific — reference actual items, counts, or specifics from the listing data.',
    'Cap at 8 recommendations. Order most impactful first.',
  ].join('\n');
  const prompt =
    `BRAND:\n${input.brandSummary}\n\n` +
    `LOCATIONS:\n${input.locationsSummary}\n\n` +
    `MENU:\n${input.menuSummary}\n\n` +
    `REVIEWS:\n${input.reviewSummary}`;
  const raw = await callClaude(prompt, system, 1200);
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 8) as HealthRecommendation[];
  } catch {
    return [];
  }
}

export async function summarizeReviewThemes(
  reviewSnippets: string[],
): Promise<{ positive: string[]; negative: string[]; summary: string }> {
  if (reviewSnippets.length === 0) {
    return { positive: [], negative: [], summary: 'No reviews yet.' };
  }
  const system = [
    'You analyze customer review snippets and surface themes.',
    'Output STRICT JSON: {positive: string[], negative: string[], summary: string}.',
    'Cap at 5 themes each. summary is a 1-2 sentence narrative.',
    'No prose outside the JSON, no markdown fences.',
  ].join('\n');
  const prompt = `Recent reviews:\n${reviewSnippets.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  const raw = await callClaude(prompt, system, 600);
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { positive: [], negative: [], summary: '' };
  }
}
