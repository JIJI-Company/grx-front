import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { setLenis } from '../utils/lenisInstance';
import { trackPageView } from '../utils/analytics';
import SiteBackground from './layout/SiteBackground';
import SiteHeader from './layout/SiteHeader';
import SiteFooter from './layout/SiteFooter';

const CASTLE_BACKGROUND_ROUTES = new Set([
  '/members',
  '/live',
  '/history',
  '/contents',
  '/notice',
  '/calendar',
]);

export default function Layout() {
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  // Smooth scroll (Lenis) — /members는 GSAP ScrollSmoother가 스크롤을 소유하므로 Lenis 비활성화
  useEffect(() => {
    if (pathname === '/members') {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenis(null);
      return undefined;
    }

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenisRef.current = lenis;
    setLenis(lenis);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, [pathname]);

  // Scroll to top on route change
  useEffect(() => {
    if (pathname === '/members') {
      window.scrollTo(0, 0);
      return;
    }
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  // GA4 page_view per SPA route (incl. first load; auto page_view is off).
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const usesCastleBackground = CASTLE_BACKGROUND_ROUTES.has(pathname);
    document.body.classList.toggle('castle-background-route', usesCastleBackground);

    return () => document.body.classList.remove('castle-background-route');
  }, [pathname]);

  return (
    <>
      <SiteBackground />
      <SiteHeader />
      <main id="main-app" className="min-h-screen pt-nav">
        <Outlet />
      </main>
      {/* /members는 ScrollSmoother 고정 래퍼 밖이라 푸터가 보이지 않아, 푸터 없는 페이지로 확정 */}
      {pathname !== '/members' && <SiteFooter />}
    </>
  );
}
