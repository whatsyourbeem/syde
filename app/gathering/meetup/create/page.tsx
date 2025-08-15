import MeetupEditForm from "@/components/meetup/meetup-edit-form";

export default async function MeetupCreatePage({ searchParams }: {
  searchParams: Promise<{ club_id?: string }>;
}) {
  const { club_id } = await searchParams;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">새로운 모임 만들기</h1>
      <MeetupEditForm clubId={club_id} />
    </div>
  );
}
