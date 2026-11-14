import * as amplitude from '@amplitude/analytics-browser';

// Google Analytics 4 — loads only when VITE_GA_ID is set (empty in dev → no-op).
// This is a SPA, so route views are sent manually via trackPageView; the GA4
// auto page_view is disabled to avoid double counting the first load.
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initGA(): void {
  if (!GA_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // GA expects the raw arguments object pushed onto the dataLayer.
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function trackPageView(path: string): void {
  if (!GA_ID) return;
  window.gtag('event', 'page_view', { page_path: path });
}

// Amplitude — loads only when VITE_AMPLITUDE_API_KEY is set (empty in dev → no-op).
// Autocapture covers page views, sessions, attribution, Web Vitals, clicks on
// links/buttons and failed network requests; castle connection metrics are sent
// explicitly through `track` (src/castle/telemetry.ts).
const AMPLITUDE_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY as string | undefined;

export function initAmplitude(): void {
  if (!AMPLITUDE_KEY) return;
  amplitude.init(AMPLITUDE_KEY, {
    autocapture: {
      attribution: true,
      pageViews: true,
      sessions: true,
      webVitals: true,
      elementInteractions: true,
      // default: only status 0 / 5xx — API and asset failures, not every request
      networkTracking: true,
      formInteractions: false,
      fileDownloads: false,
    },
  });
  // External <a> clicks (SOOP·YouTube·boards). The nearest [data-member] names the member.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]');
    if (!(a instanceof HTMLAnchorElement) || a.origin === window.location.origin) return;
    trackOutbound(a.href, { member: a.closest<HTMLElement>('[data-member]')?.dataset.member });
  }, { capture: true });
  // Events queued at tab close would be lost with fetch; beacon survives unload.
  window.addEventListener('pagehide', () => {
    amplitude.setTransport('beacon');
    amplitude.flush();
  });
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!AMPLITUDE_KEY) return;
  amplitude.track(event, props);
}

/** 사이트 밖(방송·영상·게시판)으로 나간 클릭 — 팬 사이트가 실제 시청으로 이어지는지 */
export function trackOutbound(url: string, props?: Record<string, unknown>): void {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return;
  }
  track('outbound_click', { host, url, from_path: window.location.pathname, ...props });
}

export function flushAnalytics(): void {
  if (AMPLITUDE_KEY) amplitude.flush();
}
