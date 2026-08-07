import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { NotificationContext, type AppNotification } from './notificationContextValue';

const TOAST_DURATION_MS = 3000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const showNotification = useCallback((message: string, type: AppNotification['type']) => {
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message,
      type,
      createdAt: new Date().toISOString(),
    };

    setToasts((prev) => [...prev, notification]);
    setNotifications((prev) => [notification, ...prev].slice(0, 20));

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== notification.id));
    }, TOAST_DURATION_MS);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(
    () => ({ toasts, notifications, showNotification, removeToast, clearNotifications }),
    [toasts, notifications, showNotification, removeToast, clearNotifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
