export const DASHBOARD_TOUR_VERSION = 1;
export const DASHBOARD_TOUR_CHECKOUT_EVENT = 'qlynk:dashboard-tour-checkout-state';

export function announceDashboardTourCheckoutState(blocked) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DASHBOARD_TOUR_CHECKOUT_EVENT, {
    detail: { blocked: Boolean(blocked) },
  }));
}
