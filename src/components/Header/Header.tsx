import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Search, Bell } from 'lucide-react';
import { GET_PROFILE } from '../../graphql/queries';
import type { User } from '../../types/task';
import { getAvatarUrl } from '../../utils/avatar';
import { useNotifications } from '../../hooks/useNotifications';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ searchValue, onSearchChange }: HeaderProps) {
  const { data, loading, error } = useQuery<{ profile: User }>(GET_PROFILE);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { notifications, clearNotifications } = useNotifications();
  const user = data?.profile;
  const avatarUrl = getAvatarUrl(user?.avatar);

  useEffect(() => {
    if (!profileOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  return (
    <header className="header">
      <div className="header__search">
        <Search size={18} className="header__search-icon" />
        <input
          className="header__search-input"
          type="text"
          placeholder="Search"
          aria-label="Search tasks"
          value={searchValue ?? ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <div className="header__actions">
        <div className="header__notifications" ref={notificationsRef}>
          <button
            type="button"
            className="header__icon-btn"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="header__notification-badge">
                {Math.min(notifications.length, 9)}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="header__notifications-popover">
              <div className="header__notifications-header">
                <strong>Notifications</strong>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="header__notifications-clear"
                    onClick={clearNotifications}
                  >
                    Clear
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="header__notification-empty">No notifications yet</p>
              ) : (
                <ul className="header__notification-list">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`header__notification-item header__notification-item--${notification.type}`}
                    >
                      <span>{notification.message}</span>
                      <time dateTime={notification.createdAt}>
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="header__profile" ref={profileRef}>
          <button
            type="button"
            className="header__avatar-btn"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Profile"
            aria-expanded={profileOpen}
          >
            <img className="header__avatar" src={avatarUrl} alt={user?.fullName ?? 'Profile'} />
          </button>

          {profileOpen && (
            <div className="header__profile-popover">
              {loading && <p className="header__profile-status">Loading profile...</p>}
              {error && <p className="header__profile-status">Failed to load profile</p>}
              {user && (
                <>
                  <div className="header__profile-summary">
                    <img className="header__profile-avatar" src={avatarUrl} alt={user.fullName} />
                    <div className="header__profile-identity">
                      <strong className="header__profile-name">{user.fullName}</strong>
                      <span className="header__profile-email">{user.email}</span>
                    </div>
                  </div>
                  <div className="header__profile-details">
                    <span>Type</span>
                    <strong>{user.type}</strong>
                    <span>Created</span>
                    <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
