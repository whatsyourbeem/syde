'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import NotificationDropdown from './notification-dropdown';
import { Tables } from '@/types/database.types';

interface NotificationBellProps {
  initialUnreadCount: number;
  userId: string | null;
}

const NotificationBell = ({ initialUnreadCount, userId }: NotificationBellProps) => {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const supabase = createClient();

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel('realtime-notifications')
      .on<Tables<"notifications">>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${userId}` },
        (payload) => {
          setUnreadCount((prevCount) => prevCount + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (!userId) {
    return null;
  }

  return (
    <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full" />}>
       <NotificationDropdown unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
    </Suspense>
  );
};

export default NotificationBell;
