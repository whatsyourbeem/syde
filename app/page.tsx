import { createClient } from "@/lib/supabase/server";
import { LogForm } from "@/components/log/log-form";
import { LogListWrapper } from "@/components/log/log-list-wrapper";
import Image from "next/image";
import { LoginPromptCard } from "@/components/auth/login-prompt-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl = null;
  let username = null;
  let full_name = null;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url, username, full_name, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile for LogForm:", profileError);
    } else if (profile) {
      avatarUrl = profile.avatar_url
        ? `${profile.avatar_url}?t=${
            profile.updated_at ? new Date(profile.updated_at).getTime() : ""
          }`
        : null;
      username = profile.username;
      full_name = profile.full_name; // Add this line
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] justify-center p-5 gap-x-5">
      <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
        {user ? (
          <div className="flex flex-col items-center p-4">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt="User Avatar"
                width={60}
                height={60}
                className="rounded-full object-cover mb-4"
              />
            )}
            {full_name && <p className="text-base font-bold">{full_name}</p>}
            {username && <p className="text-sm text-gray-500">@{username}</p>}
            <Button variant="default" className="mt-4">
              로그 작성하기
            </Button>
          </div>
        ) : (
          <LoginPromptCard />
        )}
      </div>
      <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">
        <div className="w-full mx-auto mb-8">
          <LogForm
            userId={user?.id || null}
            userEmail={user?.email || null}
            avatarUrl={avatarUrl}
            username={username}
            full_name={full_name} // Add this line
          />
        </div>
        <LogListWrapper currentUserId={user?.id || null} />
      </div>
      <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen p-4">
        <div className="flex flex-col items-center text-center">
          
          <p className="text-sm text-gray-500 mb-4">ⓒ 2025. SYDE</p>
          <div className="flex justify-center gap-4">
            <Link
              href="https://open.kakao.com/o/gduSGmtf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              <Image
                src="/kakao-talk-bw.png"
                alt="Kakao"
                width={24}
                height={24}
              />
            </Link>
            <Link
              href="https://www.instagram.com/syde.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              <Image
                src="/instagram.png"
                alt="Instagram"
                width={24}
                height={24}
              />
            </Link>
            <Link
              href="https://www.threads.com/@syde.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              <Image src="/threads.png" alt="Threads" width={24} height={24} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
