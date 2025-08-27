'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Database } from '@/types/database.types';
import { PostgrestError } from '@supabase/supabase-js';

type MeetupWithParticipants = Database['public']['Tables']['meetups']['Row'] & {
  meetup_participants: Database['public']['Tables']['meetup_participants']['Row'][];
};

export async function joinMeetup(meetupId: string) {
  console.log('Attempting to join meetup with ID:', meetupId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not found' };
  }

  // 1. 모임 정보 가져오기
  const { data: meetup, error: meetupError } = await supabase
    .from('meetups')
    .select('organizer_id, max_participants, meetup_participants(*)')
    .eq('id', meetupId)
    .single() as { data: MeetupWithParticipants | null; error: PostgrestError | null };

  if (meetupError || !meetup) {
    console.error('Error fetching meetup:', meetupError);
    return { error: '모임 정보를 찾을 수 없습니다.' };
  }

  // 2. 모임장인지 확인
  if (meetup.organizer_id === user.id) {
    return { error: '모임장은 자신의 모임에 참가할 수 없습니다.' };
  }

  // 3. 이미 참가자인지 확인
  const { data: existingParticipant } = await supabase
    .from('meetup_participants')
    .select('id')
    .eq('meetup_id', meetupId)
    .eq('user_id', user.id)
    .single();

  if (existingParticipant) {
    return { error: '이미 모임에 참가하셨습니다.' };
  }

  // 4. 정원 확인
  const currentParticipants = meetup.meetup_participants?.length || 0;
  if (meetup.max_participants && currentParticipants >= meetup.max_participants) {
    return { error: '모임 정원이 가득 찼습니다.' };
  }

  // 5. 참가자 추가
  const { error } = await supabase
    .from('meetup_participants')
    .insert({ meetup_id: meetupId, user_id: user.id, status: 'pending' });

  if (error) {
    console.error('Error inserting participant:', error);
    return { error: '모임 참가에 실패했습니다. 다시 시도해주세요.' };
  }

  revalidatePath(`/socialing/meetup/${meetupId}`);
  return { success: true };
}

export async function approveMeetupParticipant(meetupId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not found' };
  }

  // Verify that the current user is the organizer of the meetup
  const { data: meetup, error: meetupError } = await supabase
    .from('meetups')
    .select('organizer_id')
    .eq('id', meetupId)
    .single();

  if (meetupError || !meetup) {
    console.error('Error fetching meetup for approval:', meetupError);
    return { error: '모임 정보를 찾을 수 없습니다.' };
  }

  if (meetup.organizer_id !== user.id) {
    return { error: '모임장만 참가자를 승인할 수 있습니다.' };
  }

  // Update the participant\'s status to 'approved'
  const { error } = await supabase
    .from('meetup_participants')
    .update({ status: 'approved' })
    .eq('meetup_id', meetupId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error approving participant:', error);
    return { error: '참가자 승인에 실패했습니다. 다시 시도해주세요.' };
  }

  revalidatePath(`/socialing/meetup/${meetupId}`);
  return { success: true };
}