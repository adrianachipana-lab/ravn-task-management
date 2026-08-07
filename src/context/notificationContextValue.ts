import { createContext } from 'react';

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'error';
  createdAt: string;
}

export interface NotificationContextValue {
  toasts: AppNotification[];
  notifications: AppNotification[];
  showNotification: (message: string, type: AppNotification['type']) => void;
  removeToast: (id: string) => void;
  clearNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);
