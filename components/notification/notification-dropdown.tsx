'use client';

import { useState, useEffect } from 'react';
import { getNotifications, markAllAsRead, handleNotificationClick, NotificationType } from './actions';
import NotificationItem from './notification-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationDropdownProps {
  unreadCount: number;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
}

const NotificationDropdown = ({ unreadCount, setUnreadCount }: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<NotificationType[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    const { data } = await getNotifications();
    setNotifications(data);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setUnreadCount(0);
    fetchNotifications(); // Refresh list
  };

  const onNotificationClick = async (notificationId: string, logId: string) => {
    await handleNotificationClick(notificationId, logId);
    // Optimistically update the count
    setUnreadCount(prev => Math.max(0, prev - 1));
    router.push(`/log/${logId}`);
  };

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-secondary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Button onClick={handleMarkAllAsRead} variant="link" className="w-full text-right">Mark all as read</Button>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications?.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <button onClick={() => onNotificationClick(notification.id, notification.log_id)} className="w-full text-left">
                <NotificationItem notification={notification} />
              </button>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
