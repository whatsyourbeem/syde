'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Tables } from '@/types/database.types';

export type NotificationType = Tables<"notifications"> & {
  trigger_user: {
    username: string;
    avatar_url: string | null;
  } | null;
  logs: {
    content: string;
  } | null;
};

export async function getNotifications(): Promise<{ data: NotificationType[] | null, error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'User not found' };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      trigger_user:profiles!trigger_user_id(username, avatar_url),
      logs(content)
    `)
    .eq('recipient_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as NotificationType[], error: null };
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  revalidatePath('/'); // Revalidate layout to update unread count
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_user_id', user.id)
    .eq('is_read', false);

  revalidatePath('/'); // Revalidate layout to update unread count
}

export async function handleNotificationClick(notificationId: string, logId: string) {
  await markAsRead(notificationId);
  redirect(`/log/${logId}`);
}