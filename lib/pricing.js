export const PLAN_PRICING = Object.freeze({
  creator: Object.freeze({ monthly: 0, annual: 0 }),
  agency: Object.freeze({ monthly: 38, annual: 360 }),
});

export const PAID_PLAN_PRICING = Object.freeze({ agency: PLAN_PRICING.agency });

export function formatUsd(amount) {
  return `$${amount}`;
}
