import { Link, NavLink } from 'react-router-dom';
import { MAIN_NAV_ITEMS, ROUTES } from '../../constants/navigation';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

// Sidebar component with responsive behavior:
// - Desktop: always visible as a fixed column
// - Mobile: slides in as a drawer with an overlay backdrop
export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile drawer */}
      {open && (
        <div
          className="sidebar__overlay"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClose?.();
          }}
          role="presentation"
        />
      )}

      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <Link
          className="sidebar__logo"
          to={ROUTES.dashboard}
          onClick={onClose}
          aria-label="Go to dashboard"
        >
          <img className="sidebar__logo-img" src="/ravn-logo.png" alt="RAVN" />
        </Link>

        <nav className="sidebar__nav">
          {MAIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
              }
              onClick={onClose}
            >
              <item.icon size={18} />
              <span>{item.sidebarLabel}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
