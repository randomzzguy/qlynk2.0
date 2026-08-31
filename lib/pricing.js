export const PAID_PLAN_PRICING = Object.freeze({
  creator: Object.freeze({ monthly: 18, annual: 168 }),
  agency: Object.freeze({ monthly: 38, annual: 360 }),
});

export function formatUsd(amount) {
  return `$${amount}`;
}
