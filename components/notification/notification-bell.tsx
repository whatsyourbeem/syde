'use client';

import NotificationDropdown from './notification-dropdown';
import { useAuth } from '@/context/AuthContext';

// The count and its realtime subscription live in AuthContext, not here — this
// component is mounted twice (mobile + desktop header blocks, hidden via
// responsive CSS, not conditionally rendered), so owning that state here would
// double-count every new notification.
const NotificationBell = () => {
  const { user, unreadNotificationCount, markAllNotificationsRead, markOneNotificationRead } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <NotificationDropdown
      unreadCount={unreadNotificationCount}
      onMarkAllRead={markAllNotificationsRead}
      onMarkOneRead={markOneNotificationRead}
    />
  );
};

export default NotificationBell;
