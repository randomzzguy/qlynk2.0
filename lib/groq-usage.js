export function normalizeGroqUsage(value) {
  if (!value || typeof value !== 'object') return null;
  const prompt = value.prompt_tokens;
  const completion = value.completion_tokens;
  const cached = value.prompt_tokens_details?.cached_tokens ?? 0;
  if (![prompt, completion, cached].every(n => Number.isSafeInteger(n) && n >= 0 && n < 1_000_000_000)
    || cached > prompt || (value.total_tokens != null && value.total_tokens !== prompt + completion)) return null;
  return { prompt_tokens: prompt, completion_tokens: completion, cached_tokens: cached };
}

// Observe bytes already being delivered; do not tee/drain a second response,
// log content, or let malformed/missing telemetry interrupt a visitor's reply.
export function createGroqUsageObserver(streaming) {
  const decoder = new TextDecoder();
  let buffer = '';
  let usage = null;
  let disabled = false;
  const limit = streaming ? 65_536 : 262_144;
  const inspect = text => {
    try {
      const data = JSON.parse(text);
      usage = normalizeGroqUsage(data.usage) || normalizeGroqUsage(data.x_groq?.usage) || usage;
    } catch { /* telemetry is optional */ }
  };
  return {
    push(bytes) {
      if (disabled) return;
      buffer += decoder.decode(bytes, { stream: true });
      if (streaming) {
        let boundary;
        while ((boundary = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);
          if (line.length <= limit && line.startsWith('data:')) inspect(line.slice(5).trim());
        }
      }
      if (buffer.length > limit) { disabled = true; buffer = ''; }
    },
    finish() {
      if (!disabled) {
        buffer += decoder.decode();
        if (!streaming) inspect(buffer);
      }
      buffer = '';
      return usage;
    },
    get usage() { return usage; },
  };
}
