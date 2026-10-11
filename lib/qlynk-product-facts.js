import { PLAN_PRICING } from './pricing.js';
import { getMessageLimit } from './plans.js';

export const PRODUCT_FACTS_DATE = '2026-10-11';
export const QLYNK_SOURCE_URL = 'https://github.com/randomzzguy/qlynk2.0';

export const QLYNK_PRICING_FAQS = [
  { q: 'Is Creator free forever?', a: `Yes. Creator is free with no expiry and no credit card required. Each account includes one agent and ${getMessageLimit('creator').toLocaleString('en-US')} messages per calendar month. Agency is an optional paid upgrade.` },
  { q: 'What does Agency cost?', a: `Agency is $${PLAN_PRICING.agency.monthly} monthly or $${PLAN_PRICING.agency.annual} annually in USD. It includes one agent, ${getMessageLimit('agency').toLocaleString('en-US')} messages per month and removal of the visible “Powered by Qlynk” label. Annual billing saves about 21% compared with monthly billing.` },
  { q: 'What happens to my old trial?', a: 'Old trial accounts move to free Creator with no expiry. You keep your knowledge, configuration and conversations. Creator includes 5,000 messages per month and shows the Qlynk attribution; Agency is optional.' },
  { q: 'Can I cancel Agency?', a: 'Manage Agency billing in Dashboard → Billing. When cancellation takes effect, you return to free Creator. Your knowledge and conversations remain, and Creator’s message allowance and attribution apply.' },
  { q: 'What happens at the message limit?', a: 'Chat pauses at your monthly allowance until the first day of the next month (UTC). Creator users can optionally upgrade to Agency for a higher allowance. Upgrading does not reset messages already used that month, and there are no automatic overage charges.' },
  { q: 'Does Agency include more storage?', a: 'Both hosted plans currently support PDF, DOCX and TXT documents up to 3 MB per file. This release does not offer a separate Agency storage allowance. The current Agency benefits are higher monthly message usage and removal of the Qlynk attribution.' },
  { q: 'Is Qlynk open source, and can I self-host?', a: `Qlynk’s source is licensed under MIT. You can run your own deployment using your own infrastructure and provider credentials; provider and hosting costs are your responsibility. Hosted Creator is free, and hosted Agency remains optional and paid. Source and setup documentation: ${QLYNK_SOURCE_URL}` },
];

export function getQlynkProductKnowledge() {
  return [
    { title: 'Qlynk product and scope', content: 'Qlynk is a platform for one focused AI agent per account. Owners define its purpose, audience, allowed and blocked topics, uncertainty response and human handoff. Agent types are Personal, Business, Property, Operations, Product, Support and Custom Guide. Knowledge inputs include facts, FAQs, links, notes and documents. Both hosted plans include public links, website widgets, visitor access controls, conversations, analytics and knowledge gaps. Creator is now free; previous paid Creator prices and expired August promotions do not apply. Self-hosting does not automatically change the existing one-agent-per-account structure or document limits; operators would need to change the source to implement different limits. Do not promise autonomous actions, bookings, payments, tickets, multiple agents per account, perfect accuracy or unimplemented integrations.' },
    ...QLYNK_PRICING_FAQS.map(({ q, a }) => ({ title: q, content: `${a} Product facts approved ${PRODUCT_FACTS_DATE}. Current hosted pricing: https://www.qlynk.site/pricing` })),
  ];
}
