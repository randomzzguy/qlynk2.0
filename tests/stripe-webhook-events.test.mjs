import assert from 'node:assert/strict';
import test from 'node:test';
import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
} from '../lib/stripe-webhook-events.js';

function createLedgerClient() {
  const rows = new Map();

  class Query {
    constructor() {
      this.operation = null;
      this.payload = null;
      this.filters = [];
      this.wantsSingle = false;
    }
    insert(payload) { this.operation = 'insert'; this.payload = payload; return this; }
    update(payload) { this.operation = 'update'; this.payload = payload; return this; }
    select() { if (!this.operation) this.operation = 'select'; return this; }
    eq(column, value) { this.filters.push((row) => row[column] === value); return this; }
    lt(column, value) { this.filters.push((row) => row[column] < value); return this; }
    maybeSingle() { this.wantsSingle = true; return this; }
    then(resolve, reject) { return this.execute().then(resolve, reject); }

    async execute() {
      if (this.operation === 'insert') {
        if (rows.has(this.payload.event_id)) return { data: null, error: { code: '23505', message: 'duplicate' } };
        rows.set(this.payload.event_id, { attempt_count: 1, ...this.payload });
        return { data: null, error: null };
      }

      const matches = [...rows.values()].filter((row) => this.filters.every((filter) => filter(row)));
      if (this.operation === 'update') {
        matches.forEach((row) => Object.assign(row, this.payload));
      }
      const data = this.wantsSingle ? (matches[0] || null) : matches.map((row) => ({ ...row }));
      return { data, error: null };
    }
  }

  return {
    rows,
    from(table) {
      assert.equal(table, 'stripe_webhook_events');
      return new Query();
    },
  };
}

const event = { id: 'evt_test_123', type: 'checkout.session.completed' };

test('new Stripe event is claimed and completed exactly once', async () => {
  const client = createLedgerClient();
  assert.deepEqual(await claimStripeWebhookEvent(client, event), { claimed: true, reason: 'new' });
  await completeStripeWebhookEvent(client, event.id);
  assert.equal(client.rows.get(event.id).status, 'completed');
  assert.deepEqual(await claimStripeWebhookEvent(client, event), { claimed: false, reason: 'completed' });
});

test('currently processing duplicate is not claimed concurrently', async () => {
  const client = createLedgerClient();
  await claimStripeWebhookEvent(client, event);
  assert.deepEqual(await claimStripeWebhookEvent(client, event), { claimed: false, reason: 'processing' });
});

test('failed event is retryable and increments its attempt count', async () => {
  const client = createLedgerClient();
  await claimStripeWebhookEvent(client, event);
  await failStripeWebhookEvent(client, event.id, new Error('temporary database failure'));
  assert.equal(client.rows.get(event.id).status, 'failed');
  assert.match(client.rows.get(event.id).last_error, /temporary database failure/);

  assert.deepEqual(await claimStripeWebhookEvent(client, event), { claimed: true, reason: 'retry' });
  assert.equal(client.rows.get(event.id).attempt_count, 2);
  await completeStripeWebhookEvent(client, event.id);
  assert.equal(client.rows.get(event.id).status, 'completed');
});

test('stale processing event can be reclaimed after an interrupted delivery', async () => {
  const client = createLedgerClient();
  await claimStripeWebhookEvent(client, event);
  client.rows.get(event.id).processing_started_at = new Date(Date.now() - 11 * 60 * 1000).toISOString();
  assert.deepEqual(await claimStripeWebhookEvent(client, event), { claimed: true, reason: 'retry' });
});
