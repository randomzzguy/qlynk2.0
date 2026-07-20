const EVENT_NAME_PATTERN = /^[a-z0-9_]{1,64}$/;

export function trackMarketingEvent(name, properties = {}) {
  if (typeof window === 'undefined' || !EVENT_NAME_PATTERN.test(name)) return;

  const safeProperties = {
    ...properties,
    page_path: window.location.pathname,
  };

  window.dispatchEvent(new CustomEvent('qlynk:marketing-event', {
    detail: { name, properties: safeProperties },
  }));

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, safeProperties);
  }

  if (typeof window.plausible === 'function') {
    window.plausible(name, { props: safeProperties });
  }

  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(name, safeProperties);
  }
}
