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
