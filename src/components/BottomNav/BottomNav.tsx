import { NavLink } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { MAIN_NAV_ITEMS } from '../../constants/navigation';

interface BottomNavProps {
  onAddClick: () => void;
}

type MainNavItem = (typeof MAIN_NAV_ITEMS)[number];

const [primaryNavItem, secondaryNavItem] = MAIN_NAV_ITEMS;

function BottomNavLink({ item }: { item: MainNavItem }) {
  const Icon = item.bottomIcon ?? item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
    >
      <Icon size={20} />
      <span>{item.bottomLabel}</span>
    </NavLink>
  );
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <BottomNavLink item={primaryNavItem} />

      <button type="button" className="bottom-nav__add" onClick={onAddClick}>
        <PlusCircle size={28} />
        <span>Add Project</span>
      </button>

      <BottomNavLink item={secondaryNavItem} />
    </nav>
  );
}
