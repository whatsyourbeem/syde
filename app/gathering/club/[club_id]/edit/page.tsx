import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ClubEditForm from '@/components/club/club-edit-form';

type ClubEditPageProps = {
  params: Promise<{
    club_id: string;
  }>;
};

export default async function ClubEditPage({ params }: ClubEditPageProps) {
  const { club_id } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', club_id)
    .single();

  if (!club) {
    notFound();
  }

  if (session.user.id !== club.owner_id) {
    redirect(`/gathering/club/${club_id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">클럽 정보 수정</h1>
      <ClubEditForm club={club} />
    </div>
  );
}
