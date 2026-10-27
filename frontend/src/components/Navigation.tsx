import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Car,
  Wrench,
  CalendarClock,
  BarChart2,
  Fuel,
  Sun,
  Moon,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Garage', icon: Car, end: true },
  { to: '/fuel', label: 'Fuel', icon: Fuel, end: false },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, end: false },
  { to: '/deadlines', label: 'Deadlines', icon: CalendarClock, end: false },
  { to: '/statistics', label: 'Statistics', icon: BarChart2, end: false },
];

function getInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('cf-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default function Navigation() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cf-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">
              <Car size={16} color="white" strokeWidth={2.5} />
            </div>
            <span className="sidebar-logo-text">Carfolio</span>
          </div>
        </div>

        <div className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            style={{ flex: 1, textDecoration: 'none' }}
            className={({ isActive }) =>
              isActive ? 'mobile-tab active' : 'mobile-tab'
            }
          >
            {({ isActive }) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 0',
                  color: isActive
                    ? 'var(--accent)'
                    : 'var(--text-tertiary)',
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                <link.icon size={20} />
                {link.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}