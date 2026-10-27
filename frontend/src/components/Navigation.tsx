import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Garage', end: true },
  { to: '/maintenance', label: 'Maintenance & Parts', end: false },
  { to: '/deadlines', label: 'Deadlines', end: false },
  { to: '/statistics', label: 'Statistics', end: false },
];

export default function Navigation() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-5 py-3 sm:px-8">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-400/10 text-cyan-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
