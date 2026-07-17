import { getAgentTypeDefinition, isSupportedAgentType } from './agent-type-catalog.js';

export const RULE_LIMITS = {
  purpose: 500,
  audience: 300,
  listItems: 20,
  listItem: 160,
  uncertaintyMessage: 500,
  escalationMessage: 500,
  customInstructions: 2000,
  dailyMessageLimitMin: 10,
  dailyMessageLimitMax: 10_000,
};

export const DEFAULT_AGENT_RULES = Object.freeze({
  purpose: '',
  audience: '',
  allowed_topics: [],
  blocked_topics: [],
  behavior_rules: [],
  forbidden_behaviors: [],
  uncertainty_message: "I don't have enough verified information to answer that accurately.",
  escalation_message: '',
  custom_instructions: '',
  response_length: 'balanced',
  scope_mode: 'standard',
  daily_message_limit: null,
});

const OVERRIDE_PATTERNS = [
  /ignore\s+(?:(?:all|any|the)\s+)?(?:(?:previous)(?:\s+system)?|system|platform|qlynk)\s+(?:instructions|rules|policy)/i,
  /ignore\s+(?:all|any)\s+(?:instructions|rules|policy)/i,
  /(show|reveal|print|repeat|quote)\s+(me\s+)?(the\s+)?(hidden\s+)?(system|platform)\s+(prompt|instructions|policy)/i,
  /(disable|remove|bypass|override)\s+(the\s+)?(safety|platform|system|qlynk)\s+(rules|policy|guardrails|instructions)/i,
  /act\s+as\s+(an?\s+)?(unrestricted|unfiltered|jailbroken)\s+(assistant|model|ai)/i,
];

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function cleanList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];

  for (const item of value) {
    const cleaned = cleanText(item, RULE_LIMITS.listItem);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= RULE_LIMITS.listItems) break;
  }

  return result;
}

export function normalizeAgentRules(value = {}, agentType = 'personal') {
  const type = getAgentTypeDefinition(agentType);
  const responseLength = ['concise', 'balanced', 'detailed'].includes(value?.response_length)
    ? value.response_length
    : DEFAULT_AGENT_RULES.response_length;
  const scopeMode = ['standard', 'strict'].includes(value?.scope_mode)
    ? value.scope_mode
    : DEFAULT_AGENT_RULES.scope_mode;
  const requestedDailyLimit = Number(value?.daily_message_limit);
  const dailyMessageLimit = Number.isInteger(requestedDailyLimit)
    && requestedDailyLimit >= RULE_LIMITS.dailyMessageLimitMin
    && requestedDailyLimit <= RULE_LIMITS.dailyMessageLimitMax
    ? requestedDailyLimit
    : null;

  return {
    purpose: cleanText(value?.purpose, RULE_LIMITS.purpose) || type.defaultPurpose,
    audience: cleanText(value?.audience, RULE_LIMITS.audience),
    allowed_topics: cleanList(value?.allowed_topics),
    blocked_topics: cleanList(value?.blocked_topics),
    behavior_rules: cleanList(value?.behavior_rules),
    forbidden_behaviors: cleanList(value?.forbidden_behaviors),
    uncertainty_message: cleanText(value?.uncertainty_message, RULE_LIMITS.uncertaintyMessage)
      || DEFAULT_AGENT_RULES.uncertainty_message,
    escalation_message: cleanText(value?.escalation_message, RULE_LIMITS.escalationMessage),
    custom_instructions: cleanText(value?.custom_instructions, RULE_LIMITS.customInstructions),
    response_length: responseLength,
    scope_mode: scopeMode,
    daily_message_limit: dailyMessageLimit,
  };
}

export function validateAgentRulesPayload(payload) {
  const agentType = typeof payload?.agent_type === 'string' ? payload.agent_type : '';
  if (!isSupportedAgentType(agentType)) {
    return { error: 'Choose a supported agent type.' };
  }

  const rules = normalizeAgentRules(payload?.rules, agentType);
  const editableInstructionText = [
    ...rules.behavior_rules,
    ...rules.forbidden_behaviors,
    rules.custom_instructions,
  ].join('\n');

  if (OVERRIDE_PATTERNS.some((pattern) => pattern.test(editableInstructionText))) {
    return {
      error: 'Agent rules cannot override, reveal, disable, or bypass Qlynk platform safeguards.',
    };
  }

  return { agentType, rules, error: null };
}
