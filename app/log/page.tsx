import { createClient } from "@/lib/supabase/server";
import { LogEditDialog } from "@/components/log/log-edit-dialog";
import { LogListWrapper } from "@/components/log/log-list-wrapper";
import Image from "next/image";
import { LoginPromptCard } from "@/components/auth/login-prompt-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let avatarUrl = null;
  if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*, updated_at")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile for LogForm:", profileError);
    } else if (data) {
      profile = data;
      avatarUrl =
        profile.avatar_url && profile.updated_at
          ? `${profile.avatar_url}?t=${new Date(
              profile.updated_at
            ).getTime()}`
          : profile.avatar_url;
    }
  }

  return (
    <>
      <main className="flex min-h-[calc(100vh-4rem)] justify-center gap-x-5 py-3 md:p-5">
        <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
          {user && profile ? (
            <LogEditDialog
              userId={user.id}
              avatarUrl={avatarUrl}
              username={profile.username}
              full_name={profile.full_name}
            />
          ) : (
            <LoginPromptCard />
          )}
        </div>
        <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">
          <LogListWrapper user={profile} avatarUrl={avatarUrl} />
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
                <Image
                  src="/threads.png"
                  alt="Threads"
                  width={24}
                  height={24}
                />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
