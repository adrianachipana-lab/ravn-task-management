import { NavLink } from 'react-router-dom';
import { MAIN_NAV_ITEMS } from '../../constants/navigation';

// Mobile-only tab bar shown below the header for switching between Dashboard and Task views
export function MobileTabs() {
  return (
    <div className="mobile-tabs">
      {MAIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `mobile-tabs__tab${isActive ? ' mobile-tabs__tab--active' : ''}`
          }
        >
          {item.mobileTabLabel}
        </NavLink>
      ))}
    </div>
  );
}
