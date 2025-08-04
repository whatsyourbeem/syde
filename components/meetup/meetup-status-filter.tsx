"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



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
