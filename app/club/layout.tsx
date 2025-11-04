import { createClient } from "@/lib/supabase/server";
import { LoginPromptCard } from "@/components/auth/login-prompt-card";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let joinedClubs: {
    id: string;
    name: string;
    thumbnail_url: string | null;
  }[] = [];

  if (user) {
    const profilePromise = supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .single();

    const clubsPromise = supabase
      .from("club_members")
      .select("clubs(id, name, thumbnail_url)")
      .eq("user_id", user.id);

    const [profileResult, clubsResult] = await Promise.all([
      profilePromise,
      clubsPromise,
    ]);

    if (profileResult.error && profileResult.error.code !== "PGRST116") {
      console.error("Error fetching profile:", profileResult.error);
    } else {
      profile = profileResult.data;
    }

    if (clubsResult.error) {
      console.error("Error fetching joined clubs:", clubsResult.error);
    } else {
      joinedClubs = clubsResult.data
        .map((item) => item.clubs)
        .filter(
          (
            club
          ): club is {
            id: string;
            name: string;
            thumbnail_url: string | null;
          } => club !== null
        );
    }
  }

  return (
    <div className="w-full">
      <div className="w-full bg-card border-b">
        <div className="w-full mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <h2 className="text-2xl font-bold mb-2 text-foreground py-2">
              Clubs
            </h2>
            <p>함께 모여 성장하는 SYDE 클럽</p>
          </div>
        </div>
      </div>
      <main className="flex min-h-[calc(100vh-4rem)] justify-center gap-x-5 pb-3 md:pb-5">
        <div className="hidden md:block w-1/5 sticky top-[70px] self-start h-screen">
          {user && profile ? (
            <div className="bg-white rounded-lg">
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">
                  내가 가입한 클럽 ({joinedClubs.length})
                </h3>
                {joinedClubs.length > 0 ? (
                  <ul className="space-y-3">
                    {joinedClubs.map((club) => (
                      <li key={club.id}>
                        <Link
                          href={`/club/${club.id}`}
                          className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-md transition-colors"
                        >
                          <Image
                            src={
                              club.thumbnail_url ||
                              "/default_club_thumbnail.png"
                            }
                            alt={`${club.name} thumbnail`}
                            width={32}
                            height={32}
                            className="size-8 rounded-md object-cover"
                          />
                          <span className="text-sm font-medium truncate">
                            {club.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    아직 가입한 클럽이 없어요.
                    <br />
                    마음에 드는 클럽에 가입해보세요!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <LoginPromptCard />
          )}
        </div>
        <div className="w-full md:w-4/5 lg:w-3/5 border-x border-gray-200">
          {children}
        </div>
        <div className="hidden lg:block w-1/5 sticky top-[70px] self-start h-screen">
          <div className="p-4 rounded-lg bg-white text-center">
            <h3 className="font-bold mb-2">마음에 드는 클럽이 없나요?</h3>
            <p className="text-sm text-gray-600 mb-4">
              관심 있는 주제로 직접 클럽을 개설해보세요!
            </p>
            <Link
              href="https://slashpage.com/syde-host-recruit"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full">클럽 개설 요청</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
