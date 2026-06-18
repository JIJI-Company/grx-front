import { Link, NavLink } from 'react-router-dom';

const navigation = [
  { to: '/live', label: 'LIVE' },
  { to: '/members', label: 'MEMBERS' },
  { to: '/history', label: 'HISTORY' },
  { to: '/times', label: 'TIMES' },
  { to: '/schedule', label: 'SCHEDULE' },
  { to: '/calendar', label: 'CALENDAR' },
];

export default function SiteHeader() {
  return (
    <nav id="navbar">
      <Link to="/" className="logo glow-title">G-CASTLE</Link>
      <div className="nav-links">
        {navigation.map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
