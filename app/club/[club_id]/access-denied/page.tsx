import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoginRedirectButton } from "@/components/auth/login-redirect-button";
import { Lock } from "lucide-react";

interface AccessDeniedPageProps {
  params: Promise<{
    club_id: string;
  }>;
}

export default async function AccessDeniedPage({
  params,
}: AccessDeniedPageProps) {
  const { club_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", club_id)
    .single();

  return (
    <div className="container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center text-center mt-10">
      <Lock className="w-16 h-16 mb-8 text-gray-400" />
      {user ? (
        <>
          <h1 className="text-3xl font-bold mb-8">읽기 권한이 필요합니다</h1>
          <p className="mb-8 text-gray-600">
            이 콘텐츠를 보기 위한 멤버 등급이 부족합니다.
            <br />
            {club && `${club.name} 클럽의 멤버 등급을 확인해주세요.`}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">로그인이 필요합니다</h1>
          <p className="mb-8 text-gray-600">
            이 콘텐츠를 보려면 로그인이 필요합니다.
            <br />
            로그인 후 다시 시도해주세요.
          </p>
        </>
      )}
      <div className="flex gap-4">
        {!user && <LoginRedirectButton />}
        <Link href={`/club/${club_id}`}>
          <Button variant="outline">클럽으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}
