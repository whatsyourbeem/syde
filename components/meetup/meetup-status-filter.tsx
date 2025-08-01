"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 상태 배지 클래스 헬퍼 함수 (page.tsx에서 이동)
function getStatusBadgeClass(status: string) {
  switch (status) {
    case "오픈예정":
      return "border border-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700";
    case "신청가능":
      return "border border-green-500 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700";
    case "신청마감":
      return "border border-red-500 bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700";
    case "종료":
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700";
    default:
      return "border border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700";
  }
}

export default function MeetupStatusFilter({ searchParams }: { searchParams: { status?: string } }) {
  const router = useRouter();
  const currentStatus = searchParams.status || "전체";

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams();
    if (searchParams.status) {
      params.set("status", searchParams.status);
    }

    if (value === "전체") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="모든 상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="전체">전체</SelectItem>
          <SelectItem value="오픈예정">오픈예정</SelectItem>
          <SelectItem value="신청가능">신청가능</SelectItem>
          <SelectItem value="신청마감">신청마감</SelectItem>
          <SelectItem value="종료">종료</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
