import { ClipboardList, LayoutGrid, List } from 'lucide-react';

export const ROUTES = {
  dashboard: '/',
  myTasks: '/my-tasks',
  settings: '/settings',
} as const;

export const MAIN_NAV_ITEMS = [
  {
    to: ROUTES.dashboard,
    icon: LayoutGrid,
    bottomIcon: LayoutGrid,
    sidebarLabel: 'DASHBOARD',
    bottomLabel: 'Dashboard',
    mobileTabLabel: 'Dashboard',
    end: true,
  },
  {
    to: ROUTES.myTasks,
    icon: List,
    bottomIcon: ClipboardList,
    sidebarLabel: 'MY TASK',
    bottomLabel: 'My Task',
    mobileTabLabel: 'Task',
    end: false,
  },
] as const;
