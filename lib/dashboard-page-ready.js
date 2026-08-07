'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useDashboardPageReady(loading) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();

  useEffect(() => {
    if (loading) return undefined;
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('qlynk:dashboard-page-ready', {
        detail: { routeKey: searchString ? `${pathname}?${searchString}` : pathname },
      }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, pathname, searchString]);
}
