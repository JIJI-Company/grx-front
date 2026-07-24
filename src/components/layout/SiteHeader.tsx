import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const navigation = [
  { to: '/samgukji', label: '삼국지' },
  { to: '/live', label: 'LIVE' },
  { to: '/members', label: 'MEMBERS' },
  { to: '/history', label: 'HISTORY' },
  //{ to: '/times', label: 'TIMES' },
  { to: '/contents', label: 'CONTENTS' },
  { to: '/notice', label: 'NOTICE' },
  { to: '/calendar', label: 'CALENDAR' },
];

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ruby-600/20 bg-castle-950/50 backdrop-blur-xl" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
      <div className="flex h-nav items-center justify-between gap-4 px-[6%]">
        <Link
          to="/"
          className="focus-ring rounded-sm font-display text-[1.4rem] font-bold tracking-[2px] uppercase nav:text-[1.8rem] nav:tracking-[4px]"
          style={{ color: '#fff', textShadow: '0 0 15px rgba(255,26,74,0.8), 0 0 30px rgba(255,26,74,0.4)' }}
        >
          G-CASTLE
        </Link>
        <nav aria-label="주요 메뉴" className="hidden items-center gap-2 nav:flex lg:gap-4">
          {navigation.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={`nav-link${to === '/samgukji' ? ' nav-link-samgukji' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="focus-ring flex size-10 flex-col items-center justify-center gap-1.5 rounded-md border border-ruby-600/25 bg-ruby-600/8 nav:hidden"
          aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className={`h-px w-5 bg-white transition ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-px w-5 bg-white transition ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`h-px w-5 bg-white transition ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>
      <div
        id="mobile-navigation"
        className={`overflow-hidden border-t border-ruby-600/10 transition-[max-height,opacity] duration-300 nav:hidden ${
          isMenuOpen ? 'max-h-80 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <nav aria-label="모바일 메뉴" className="page-shell grid grid-cols-2 gap-2 py-3">
          {navigation.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={`mobile-nav-link${to === '/samgukji' ? ' mobile-nav-link-samgukji' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
