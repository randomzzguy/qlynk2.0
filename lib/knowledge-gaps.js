const UNCERTAINTY_MARKERS = [
  "i don't have that information",
  'i do not have that information',
  "i don't have enough information",
  'i do not have enough information',
  "i can't confirm",
  'i cannot confirm',
  "i'm not sure",
  'i am not sure',
  'not included in my knowledge',
  'not available in my knowledge',
  'the information provided does not',
  'please contact the owner',
  'contact the agent owner',
];

export function normalizeKnowledgeGapQuestion(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

export function shouldRecordKnowledgeGap(answer, uncertaintyMessage = '') {
  const normalizedAnswer = String(answer || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalizedAnswer) return false;

  const normalizedUncertainty = String(uncertaintyMessage || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalizedUncertainty.length >= 12 && normalizedAnswer.includes(normalizedUncertainty.slice(0, 120))) {
    return true;
  }

  return UNCERTAINTY_MARKERS.some((marker) => normalizedAnswer.includes(marker));
}
