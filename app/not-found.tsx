import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요 | SYDE",
};

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm text-gray-500">
          주소가 바뀌었거나 삭제된 글·프로젝트·프로필일 수 있어요.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/blog">블로그</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/showcase">쇼케이스</Link>
        </Button>
      </div>
    </div>
  );
}
