import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MeetupReservSuccessPage({
  params,
}: {
  params: Promise<{ meetup_id: string }>; // Promise 추가
}) {
  const { meetup_id } = await params; // await 추가

  return (
    <div className="w-full max-w-lg mx-auto text-center text-[#23292F] p-8 rounded-lg shadow-lg bg-white mt-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-600">신청 완료! 🎉</h1>
        <p className="mt-4 text-gray-700">
          모임 참가 신청이 성공적으로 접수되었습니다.
        </p>
        <p className="text-gray-700">
          입금이 필요한 모임의 경우, 호스트가 확인 후 참가 확정 처리를
          진행합니다.
        </p>
      </div>
      <div className="flex justify-center gap-4">
        <Button asChild variant="outline">
          <Link href="/meetup">다른 모임 둘러보기</Link>
        </Button>
        <Button asChild>
          <Link href={`/meetup/${meetup_id}`}>해당 모임으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  );
}
