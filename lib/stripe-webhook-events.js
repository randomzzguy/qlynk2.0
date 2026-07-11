const PROCESSING_STALE_AFTER_MS = 10 * 60 * 1000;

function safeFailureMessage(error) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  return message.replace(/[\r\n\t]+/g, ' ').slice(0, 500);
}

export async function claimStripeWebhookEvent(supabase, event) {
  const now = new Date().toISOString();
  const { error: insertError } = await supabase
    .from('stripe_webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
      status: 'processing',
      processing_started_at: now,
      updated_at: now,
    });

  if (!insertError) return { claimed: true, reason: 'new' };
  if (insertError.code !== '23505') throw insertError;

  const { data: existing, error: readError } = await supabase
    .from('stripe_webhook_events')
    .select('status, processing_started_at')
    .eq('event_id', event.id)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing) throw new Error('Webhook event ledger row disappeared');
  if (existing.status === 'completed') return { claimed: false, reason: 'completed' };

  const staleBefore = new Date(Date.now() - PROCESSING_STALE_AFTER_MS).toISOString();
  let retryQuery = supabase
    .from('stripe_webhook_events')
    .update({
      status: 'processing',
      event_type: event.type,
      processing_started_at: now,
      processed_at: null,
      last_error: null,
      updated_at: now,
    })
    .eq('event_id', event.id);

  retryQuery = existing.status === 'failed'
    ? retryQuery.eq('status', 'failed')
    : retryQuery.eq('status', 'processing').lt('processing_started_at', staleBefore);

  const { data: claimedRows, error: retryError } = await retryQuery
    .select('event_id, attempt_count');
  if (retryError) throw retryError;
  if (!claimedRows?.length) return { claimed: false, reason: 'processing' };

  const attemptCount = Number(claimedRows[0].attempt_count || 1) + 1;
  const { error: incrementError } = await supabase
    .from('stripe_webhook_events')
    .update({ attempt_count: attemptCount, updated_at: now })
    .eq('event_id', event.id)
    .eq('status', 'processing');
  if (incrementError) throw incrementError;

  return { claimed: true, reason: 'retry' };
}

export async function completeStripeWebhookEvent(supabase, eventId) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .update({ status: 'completed', processed_at: now, last_error: null, updated_at: now })
    .eq('event_id', eventId)
    .eq('status', 'processing')
    .select('event_id');
  if (error) throw error;
  if (!data?.length) throw new Error('Webhook event could not be marked completed');
}

export async function failStripeWebhookEvent(supabase, eventId, error) {
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'failed',
      last_error: safeFailureMessage(error),
      updated_at: now,
    })
    .eq('event_id', eventId)
    .eq('status', 'processing');
  if (updateError) throw updateError;
}
