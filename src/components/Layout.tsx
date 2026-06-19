import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import SiteBackground from './layout/SiteBackground';
import SiteHeader from './layout/SiteHeader';
import SiteFooter from './layout/SiteFooter';

export default function Layout() {
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  // Smooth scroll (Lenis)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return (
    <>
      <SiteBackground />
      <SiteHeader />
      <main id="main-app" className="min-h-screen pt-nav">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
