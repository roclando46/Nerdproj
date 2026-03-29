import { NavLink } from 'react-router-dom';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheckIcon },
  { name: 'Grant Writer', href: '/grants', icon: DocumentTextIcon },
  { name: 'Fixtures', href: '/fixtures', icon: CalendarDaysIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export function Sidebar(): JSX.Element {
  return (
    <aside className="w-64 flex flex-col bg-white border-r border-neutral-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-neutral-200">
        <ShieldCheckIcon className="h-7 w-7 text-primary-600 mr-2" />
        <span className="font-semibold text-neutral-900 text-sm leading-tight">
          Digital Club
          <br />
          Secretary
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-neutral-200">
        <p className="text-xs text-neutral-400">v0.1.0 — MVP</p>
      </div>
    </aside>
  );
}
