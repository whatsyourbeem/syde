import MeetupEditForm from "@/components/meetup/meetup-edit-form";

type MeetupCreatePageProps = {
  searchParams: {
    club_id?: string;
  };
};

export default function MeetupCreatePage({ searchParams }: MeetupCreatePageProps) {
  const { club_id } = searchParams;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">새로운 모임 만들기</h1>
      <MeetupEditForm clubId={club_id} />
    </div>
  );
}
