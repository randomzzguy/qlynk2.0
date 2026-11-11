// Shared SSE framing keeps split network chunks from dropping text or errors.
export async function* readChatEvents(body) {
  if (!body) throw new Error('The reply stream is unavailable. Please try again.');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') { yield { done: true }; return; }
        const event = JSON.parse(data);
        if (event.error) throw new Error(typeof event.error === 'string' ? event.error : 'The AI reply was interrupted. Please try again.');
        yield event;
      }
      if (done) throw new Error('The AI reply was interrupted. Please try again.');
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createSettledChatStream(body, { complete, release }) {
  const encoder = new TextEncoder();
  const events = readChatEvents(body);
  let answer = '';
  let cancelled = false;
  const encode = data => encoder.encode(`data: ${data}\n\n`);
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (cancelled) return;
        if (done) throw new Error('Incomplete reply');
        if (value.done) {
          if (!answer.trim()) throw new Error('Empty reply');
          await complete(answer);
          await events.return();
          if (!cancelled) {
            controller.enqueue(encode('[DONE]'));
            controller.close();
          }
          return;
        }
        const content = value.choices?.[0]?.delta?.content;
        if (typeof content === 'string') answer += content;
        controller.enqueue(encode(JSON.stringify(value)));
      } catch {
        await release();
        await events.return();
        if (!cancelled) {
          controller.enqueue(encode(JSON.stringify({ error: 'The reply could not be completed. Please try your message again.', code: 'AI_STREAM_FAILED' })));
          controller.close();
        }
      }
    },
    async cancel() {
      cancelled = true;
      // Do not wait for the upstream read before refunding. Provider fetch also
      // has the visitor abort signal and a bounded deadline.
      await release();
      await events.return();
    },
  });
}
