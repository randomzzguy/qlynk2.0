const SENSITIVE_MEMORY_PATTERN = /(?:password|passcode|access[_ -]?code|api[_ -]?key|secret[_ -]?key|private[_ -]?key|credit[_ -]?card|card[_ -]?number|cvv|social[_ -]?security|passport[_ -]?(?:number|id)|national[_ -]?id|bank[_ -]?account)/i;

export function validateExplicitMemoryInput(key, value) {
  const safeKey = String(key || '').trim().slice(0, 80);
  const safeValue = String(value || '').trim().slice(0, 1000);

  if (!safeKey || !safeValue) {
    return { error: 'A memory key and value are required' };
  }
  if (SENSITIVE_MEMORY_PATTERN.test(`${safeKey} ${safeValue}`)) {
    return { error: 'Memory cannot store credentials, payment data, or identity documents' };
  }

  return { key: safeKey, value: safeValue };
}
