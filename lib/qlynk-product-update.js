import { getQlynkProductKnowledge } from './qlynk-product-facts.js';

export const PRODUCT_PACK_KEY = 'free-creator-2026-10-11';
export function getQlynkProductRuleUpdate(rules) {
  if (!rules) return null;
  return {
    ...rules,
    allowed_topics: (rules.allowed_topics || []).map(topic => topic === 'Trial, plans, pricing, and message allowances'
      ? 'Free Creator, optional Agency, pricing, usage and MIT self-hosting' : topic),
    behavior_rules: (rules.behavior_rules || []).map(rule => rule === 'For prices, state the promotion period, first-payment scope, and regular renewal price'
      ? 'For prices, explain free Creator and optional paid Agency using current approved pricing; do not repeat expired promotions' : rule),
    custom_instructions: (rules.custom_instructions || '')
      .replace('Current public plans are Trial, Creator, and Agency.', 'Current hosted plans are free Creator and optional paid Agency.')
      .replace(/Pricing verified August 14, 2026:[\s\S]*?The discount applies only to the first payment\./,
        'Creator is free forever with 5,000 messages/month and one agent. Agency is $38/month or $360/year USD with 10,000 messages and attribution removed. Both have a 3 MB document limit. Source is MIT; self-hosters pay their own provider and hosting costs.'),
  };
}
export function getManagedProductFacts() {
  return getQlynkProductKnowledge().map((item, index) => ({
    title: `[Qlynk product facts] ${item.title}`,
    content: item.content,
    source_type: index === 0 ? 'text' : 'faq',
    category: index === 0 ? 'general' : 'pricing',
    priority: 5,
  }));
}

export function isObsoleteQlynkProductSource(item) {
  if (item.is_active === false || item.title?.startsWith('[Qlynk product facts]')) return false;
  const text = `${item.title || ''}\n${item.content || ''}`;
  return /14[-\s]+day(?:\s+free)?\s+trial|fourteen[-\s]+day\s+trial|trial[^\n.]*(?:10,000|offline|expires|agency)|live trial or paid plan|50%\s*(?:off|discount)|August\s+2026\s+(?:promotion|pricing offer)|\$(?:9|18|84|168|19|180)\b/i.test(text);
}

export function getProductUpdatePreview(knowledge) {
  const facts = getManagedProductFacts();
  const staleSources = knowledge.filter(isObsoleteQlynkProductSource);
  const changedFacts = facts.filter(fact => !knowledge.some(item => item.is_active !== false
    && item.title === fact.title && item.content === fact.content));
  return { packKey: PRODUCT_PACK_KEY, facts, staleSources, changedFactCount: changedFacts.length };
}
