import ClubEditForm from "@/components/club/club-edit-form";

export default function ClubCreatePage() {
  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">새로운 클럽 만들기</h1>
      <ClubEditForm />
    </div>
  );
}
